/**
 * XML sitemap with hreflang alternates. Contains only canonical, indexable
 * URLs: thank-you pages and entries marked `example: true` are left out.
 * lastmod is only set where a real date exists (content entries).
 */
import type { APIRoute } from 'astro';
import { INDEXABLE_ROUTES, LANGS, routeAlternates, SERVICE_KEYS, serviceAlternates, entryPath, type CollectionName, type Lang } from '~/i18n/routes';
import { entryLang, entrySlug, getJobs, getNews, getProjects } from '~/lib/content';
import { isoDate } from '~/lib/format';
import { hiddenRoutes } from '~/lib/nav';

interface Group {
  alternates: Partial<Record<Lang, string>>;
  lastmod?: Date;
}

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

async function contentGroups(): Promise<Group[]> {
  const groups = new Map<string, Group>();
  const sources: Array<[CollectionName, (lang: Lang) => Promise<Array<{ id: string; data: Record<string, any> }>>]> = [
    ['projects', getProjects],
    ['news', getNews],
    ['jobs', getJobs],
  ];
  for (const [collection, load] of sources) {
    for (const lang of LANGS) {
      for (const entry of await load(lang)) {
        if (entry.data.example) continue;
        const key = `${collection}:${entry.data.translationKey}`;
        const group = groups.get(key) ?? { alternates: {} };
        group.alternates[entryLang(entry)] = entryPath(collection, entrySlug(entry), lang);
        const date: Date | undefined = entry.data.updated ?? entry.data.date ?? entry.data.published;
        if (date && (!group.lastmod || date > group.lastmod)) group.lastmod = date;
        groups.set(key, group);
      }
    }
  }
  return [...groups.values()];
}

export const GET: APIRoute = async ({ site }) => {
  const abs = (path: string) => new URL(path, site).href;
  const hidden = await hiddenRoutes('sv');
  const groups: Group[] = [
    ...INDEXABLE_ROUTES.filter((key) => !hidden.has(key)).map((key) => ({ alternates: routeAlternates(key) })),
    ...SERVICE_KEYS.map((key) => ({ alternates: serviceAlternates(key) })),
    ...(await contentGroups()),
  ];

  const urls = groups.flatMap((group) => {
    const langs = LANGS.filter((l) => group.alternates[l]);
    const links = langs.length > 1
      ? [
          ...langs.map((l) => `    <xhtml:link rel="alternate" hreflang="${l}" href="${escape(abs(group.alternates[l]!))}"/>`),
          ...(group.alternates.sv ? [`    <xhtml:link rel="alternate" hreflang="x-default" href="${escape(abs(group.alternates.sv))}"/>`] : []),
        ]
      : [];
    return langs.map((l) =>
      [
        '  <url>',
        `    <loc>${escape(abs(group.alternates[l]!))}</loc>`,
        ...(group.lastmod ? [`    <lastmod>${isoDate(group.lastmod)}</lastmod>`] : []),
        ...links,
        '  </url>',
      ].join('\n'),
    );
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
