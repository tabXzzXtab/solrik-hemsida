/**
 * SEO / quality audit of the built site (run after `npm run build`):
 *   npm run qa
 *
 * Checks every HTML page in dist/ for: title + meta description (presence,
 * length, duplicates), self-referencing canonical, exactly one <h1>, <html lang>,
 * reciprocal hreflang, valid JSON-LD, <img> alt/width/height, broken internal
 * links, internal inlinks and click depth from the home page.
 * Exits with code 1 when errors are found (warnings don't fail).
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const dist = join(root, 'dist');
if (!existsSync(dist)) {
  console.error('dist/ not found – run `npm run build` first.');
  process.exit(1);
}

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const files = walk(dist);
const htmlFiles = files.filter((f) => f.endsWith('.html') && !f.endsWith(`${sep}404.html`));
const assetSet = new Set(files.map((f) => '/' + relative(dist, f).split(sep).join('/')));
const toPath = (file) => '/' + relative(dist, file).split(sep).join('/').replace(/index\.html$/, '');

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}=("([^"]*)"|'([^']*)')`, 'i'));
  return m ? decode(m[2] ?? m[3] ?? '') : null;
};

const errors = [];
const warnings = [];
const pages = new Map();

for (const file of htmlFiles) {
  const path = toPath(file);
  const html = readFileSync(file, 'utf8');
  const head = html.split('</head>')[0];
  const body = html.slice(head.length);
  const metaTags = head.match(/<meta\b[^>]*>/gi) ?? [];
  const linkTags = head.match(/<link\b[^>]*>/gi) ?? [];
  const meta = (name) => metaTags.map((t) => (attr(t, 'name') === name || attr(t, 'property') === name ? attr(t, 'content') : null)).find((v) => v !== null);

  const page = {
    path,
    title: decode(head.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? ''),
    description: meta('description') ?? '',
    robots: meta('robots') ?? '',
    canonical: linkTags.map((t) => (attr(t, 'rel') === 'canonical' ? attr(t, 'href') : null)).find(Boolean) ?? '',
    lang: html.match(/<html[^>]*\slang="([^"]+)"/i)?.[1] ?? '',
    hreflang: Object.fromEntries(linkTags.filter((t) => attr(t, 'rel') === 'alternate' && attr(t, 'hreflang')).map((t) => [attr(t, 'hreflang'), attr(t, 'href')])),
    h1: (body.match(/<h1\b/gi) ?? []).length,
    links: [...body.matchAll(/<a\b[^>]*\shref="([^"]+)"/gi)].map((m) => decode(m[1])),
    imgs: body.match(/<img\b[^>]*>/gi) ?? [],
    jsonld: [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]),
    ogImage: meta('og:image') ?? '',
  };
  page.noindex = /noindex/i.test(page.robots);
  pages.set(path, page);
}

const site = (() => {
  const any = [...pages.values()].find((p) => p.canonical);
  return any ? new URL(any.canonical).origin : 'https://www.example.se';
})();
const internal = (href) => {
  if (href.startsWith('#') || /^(mailto|tel|javascript):/i.test(href)) return null;
  const url = new URL(href, site + '/');
  if (url.origin !== site) return null;
  return decodeURI(url.pathname);
};

const titles = new Map();
const descriptions = new Map();

for (const p of pages.values()) {
  const where = p.path;
  if (!p.title) errors.push(`${where}: missing <title>`);
  else if (p.title.length > 70) warnings.push(`${where}: title ${p.title.length} chars (> 70): "${p.title}"`);
  if (!p.description) errors.push(`${where}: missing meta description`);
  else if (p.description.length > 170) warnings.push(`${where}: description ${p.description.length} chars (> 170)`);
  else if (p.description.length < 50 && !p.noindex) warnings.push(`${where}: description short (${p.description.length} chars)`);
  if (!p.noindex) {
    titles.set(p.title, [...(titles.get(p.title) ?? []), where]);
    descriptions.set(p.description, [...(descriptions.get(p.description) ?? []), where]);
  }
  if (!p.canonical) errors.push(`${where}: missing canonical`);
  else if (new URL(p.canonical).pathname !== where) errors.push(`${where}: canonical points elsewhere (${p.canonical})`);
  if (p.h1 !== 1) errors.push(`${where}: ${p.h1} <h1> elements (expected 1)`);
  if (!['sv', 'en'].includes(p.lang)) errors.push(`${where}: <html lang="${p.lang}">`);
  if (!p.ogImage) warnings.push(`${where}: no og:image`);

  // hreflang: self-reference + reciprocity
  const langs = Object.keys(p.hreflang).filter((l) => l !== 'x-default');
  if (langs.length) {
    if (p.hreflang[p.lang] && new URL(p.hreflang[p.lang]).pathname !== where) errors.push(`${where}: hreflang ${p.lang} is not self-referencing`);
    for (const l of langs) {
      const target = pages.get(new URL(p.hreflang[l]).pathname);
      if (!target) errors.push(`${where}: hreflang ${l} → missing page ${p.hreflang[l]}`);
      else if (target.hreflang[p.lang] !== p.canonical) errors.push(`${where}: hreflang ${l} target does not link back`);
    }
  }

  for (const block of p.jsonld) {
    try {
      const data = JSON.parse(block);
      if (!data['@context'] || !Array.isArray(data['@graph'])) warnings.push(`${where}: JSON-LD without @context/@graph`);
      // Placeholders are "[…]" inside string values; JSON arrays themselves don't count.
      const strings = [];
      const collect = (v) => (typeof v === 'string' ? strings.push(v) : v && typeof v === 'object' && Object.values(v).forEach(collect));
      collect(data);
      const placeholder = strings.find((s) => /\[[^\]]*\]/.test(s));
      if (placeholder) warnings.push(`${where}: JSON-LD contains a bracketed placeholder value ("${placeholder.slice(0, 60)}")`);
    } catch (e) {
      errors.push(`${where}: invalid JSON-LD (${e.message})`);
    }
  }

  for (const img of p.imgs) {
    if (attr(img, 'alt') === null) errors.push(`${where}: <img> without alt (${attr(img, 'src')})`);
    if (!attr(img, 'width') || !attr(img, 'height')) warnings.push(`${where}: <img> without width/height (${attr(img, 'src')})`);
  }

  for (const href of p.links) {
    const target = internal(href);
    if (target === null) continue;
    const exists = pages.has(target) || assetSet.has(target) || assetSet.has(target.replace(/\/$/, '') + '/index.html');
    if (!exists) errors.push(`${where}: broken internal link → ${href}`);
    if (pages.has(target) && !target.endsWith('/')) warnings.push(`${where}: link without trailing slash → ${href}`);
  }
}

for (const [title, where] of titles) if (where.length > 1) errors.push(`duplicate title "${title}" on ${where.join(', ')}`);
for (const [desc, where] of descriptions) if (where.length > 1) errors.push(`duplicate description "${desc.slice(0, 50)}…" on ${where.join(', ')}`);

// Inlinks and click depth (BFS over internal <a href> from both home pages)
const inlinks = new Map([...pages.keys()].map((p) => [p, new Set()]));
for (const p of pages.values()) {
  for (const href of p.links) {
    const target = internal(href);
    if (target && pages.has(target) && target !== p.path) inlinks.get(target).add(p.path);
  }
}
const depth = new Map([['/', 0]]);
const queue = ['/'];
while (queue.length) {
  const current = queue.shift();
  for (const href of pages.get(current)?.links ?? []) {
    const target = internal(href);
    if (target && pages.has(target) && !depth.has(target)) {
      depth.set(target, depth.get(current) + 1);
      queue.push(target);
    }
  }
}
for (const p of pages.values()) {
  if (p.noindex) continue;
  const d = depth.get(p.path);
  if (d === undefined) errors.push(`${p.path}: not reachable from the home page`);
  else if (d > 3) warnings.push(`${p.path}: click depth ${d} (> 3)`);
  if (inlinks.get(p.path).size < 2) warnings.push(`${p.path}: only ${inlinks.get(p.path).size} internal inlink(s)`);
}

// Sitemap sanity
const sitemapFile = join(dist, 'sitemap.xml');
if (!existsSync(sitemapFile)) errors.push('sitemap.xml missing');
else {
  const locs = [...readFileSync(sitemapFile, 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  for (const loc of locs) {
    const p = pages.get(loc);
    if (!p) errors.push(`sitemap: ${loc} is not a built page`);
    else if (p.noindex) errors.push(`sitemap: ${loc} is noindex`);
  }
  const indexable = [...pages.values()].filter((p) => !p.noindex).map((p) => p.path);
  for (const path of indexable) if (!locs.includes(path)) warnings.push(`sitemap: indexable page ${path} missing`);
  console.log(`sitemap.xml: ${locs.length} URLs`);
}

const noindexed = [...pages.values()].filter((p) => p.noindex).map((p) => p.path);
console.log(`Pages audited: ${pages.size} (noindex: ${noindexed.length} → ${noindexed.join(', ') || '–'})`);
console.log(`Max click depth: ${Math.max(...[...depth.values()])}`);
console.log(`\nErrors (${errors.length}):\n${errors.map((e) => '  ✗ ' + e).join('\n') || '  none'}`);
console.log(`\nWarnings (${warnings.length}):\n${warnings.map((w) => '  ! ' + w).join('\n') || '  none'}`);
process.exit(errors.length ? 1 : 0);
