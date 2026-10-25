/**
 * Pick and download stock photos from Pexels for the image slots in scripts/pexels-slots.json.
 *
 *   node scripts/pexels.mjs search [slot …]   → contact sheets in .pexels-cache/ (numbered candidates)
 *   node scripts/pexels.mjs download          → downloads every slot that has a "pick" (Pexels photo id)
 *
 * Workflow: run `search`, look at .pexels-cache/sheet-<slot>.jpg, write the chosen photo id into
 * "pick" in pexels-slots.json, run `download`. Credits are written to src/config/photo-credits.json
 * and shown as "Foto: <photographer> / Pexels".
 *
 * Requires PEXELS_API_KEY (or VITE_PEXELS_API_KEY) in .env. The key is only used here, never in the site.
 * Pexels licence: free to use, attribution appreciated – https://www.pexels.com/license/
 */
import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
try {
  process.loadEnvFile(join(root, '.env'));
} catch {
  /* no .env – rely on the environment */
}
const KEY = process.env.PEXELS_API_KEY || process.env.VITE_PEXELS_API_KEY;
if (!KEY) {
  console.error('Missing PEXELS_API_KEY in .env');
  process.exit(1);
}

const slotsFile = join(root, 'scripts', 'pexels-slots.json');
const cacheDir = join(root, '.pexels-cache');
const creditsFile = join(root, 'src', 'config', 'photo-credits.json');
const slots = JSON.parse(await readFile(slotsFile, 'utf8'));
delete slots._readme;

async function api(path) {
  const res = await fetch(`https://api.pexels.com/v1/${path}`, { headers: { Authorization: KEY } });
  if (!res.ok) throw new Error(`Pexels ${res.status} for ${path}`);
  return res.json();
}

async function image(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download ${res.status} ${url}`);
  return Buffer.from(await res.arrayBuffer());
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

async function search(names) {
  await mkdir(cacheDir, { recursive: true });
  const all = {};
  for (const name of names) {
    const slot = slots[name];
    const data = await api(`search?query=${encodeURIComponent(slot.query)}&orientation=landscape&size=large&per_page=9`);
    const photos = data.photos.slice(0, 9);
    all[name] = photos.map((p, i) => ({ n: i + 1, id: p.id, photographer: p.photographer, alt: p.alt, w: p.width, h: p.height }));
    const W = 300, H = 200, pad = 6;
    const tiles = await Promise.all(
      photos.map(async (p, i) => {
        const thumb = await sharp(await image(`${p.src.original}?auto=compress&cs=tinysrgb&w=600`)).resize(W, H, { fit: 'cover' }).toBuffer();
        const label = Buffer.from(`<svg width="${W}" height="${H}"><rect x="0" y="0" width="${String(i + 1).length * 14 + 66}" height="24" fill="#000" fill-opacity=".75"/><text x="6" y="17" font-family="Arial" font-size="15" font-weight="700" fill="#fff">${i + 1} · ${p.id}</text></svg>`);
        return sharp(thumb).composite([{ input: label, top: 0, left: 0 }]).toBuffer();
      }),
    );
    const header = Buffer.from(`<svg width="${3 * (W + pad)}" height="30"><text x="4" y="21" font-family="Arial" font-size="18" font-weight="700" fill="#111">${esc(name)} — "${esc(slot.query)}"</text></svg>`);
    await sharp({ create: { width: 3 * (W + pad), height: 30 + 3 * (H + pad), channels: 3, background: '#e8e8e8' } })
      .composite([
        { input: header, top: 0, left: 0 },
        ...tiles.map((input, i) => ({ input, left: (i % 3) * (W + pad), top: 30 + Math.floor(i / 3) * (H + pad) })),
      ])
      .jpeg({ quality: 80 })
      .toFile(join(cacheDir, `sheet-${name}.jpg`));
    console.log(`sheet-${name}.jpg  (${photos.length} candidates)`);
  }
  const existing = await readFile(join(cacheDir, 'candidates.json'), 'utf8').then(JSON.parse, () => ({}));
  await writeFile(join(cacheDir, 'candidates.json'), JSON.stringify({ ...existing, ...all }, null, 2));
}

async function download() {
  const credits = await readFile(creditsFile, 'utf8').then(JSON.parse, () => ({}));
  for (const [name, slot] of Object.entries(slots)) {
    if (!slot.pick) continue;
    const p = await api(`photos/${slot.pick}`);
    const buffer = await image(`${p.src.original}?auto=compress&cs=tinysrgb&w=${slot.width ?? 1800}`);
    const target = join(root, slot.target);
    await mkdir(dirname(target), { recursive: true });
    await sharp(buffer).rotate().jpeg({ quality: 82, mozjpeg: true }).toFile(target);
    const photographer = p.photographer.replace(/\s+/g, ' ').trim();
    credits[name] = { id: p.id, photographer, photographerUrl: p.photographer_url, url: p.url, alt: p.alt };
    console.log(`${name.padEnd(24)} ← ${p.id} by ${p.photographer}`);
  }
  await writeFile(creditsFile, JSON.stringify(credits, null, 2) + '\n');
  console.log(`Credits → ${creditsFile}`);
}

const [command, ...rest] = process.argv.slice(2);
if (command === 'search') await search(rest.length ? rest : Object.keys(slots));
else if (command === 'download') await download();
else console.log('Usage: node scripts/pexels.mjs search [slot …] | download');
