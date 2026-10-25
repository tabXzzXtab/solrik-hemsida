/**
 * Builds the logo and favicons from one transparent logo PNG
 * (symbol on the left, name on the right).
 *
 *   src/assets/logo/solrik-logo.png   full logo (trimmed)
 *   src/assets/logo/solrik-symbol.png symbol only – the header sets the name in the heading font next to it
 *   public/logo.png                   logo for structured data
 *   public/favicon.ico, favicon-96x96.png, apple-touch-icon.png   from the symbol
 *
 * Usage:  npm run brand -- path/to/logo.png
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const input = process.argv[2];
if (!input) {
  console.error('Usage: npm run brand -- path/to/logo.png');
  process.exit(1);
}

async function out(relPath, buffer) {
  const abs = join(root, relPath);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, buffer);
  console.log(`  write ${relPath}`);
}

const logo = await sharp(input).ensureAlpha().trim().png().toBuffer();
await out('src/assets/logo/solrik-logo.png', logo);
await out('public/logo.png', logo);

// The symbol ends at the first wide run of empty columns.
const { data, info } = await sharp(logo).raw().toBuffer({ resolveWithObject: true });
const filled = (x) => {
  for (let y = 0; y < info.height; y++) if (data[(y * info.width + x) * info.channels + 3] > 16) return true;
  return false;
};
let symbolEnd = info.width;
for (let x = 0, gap = 0; x < info.width; x++) {
  gap = filled(x) ? 0 : gap + 1;
  if (gap >= Math.round(info.height * 0.08)) {
    symbolEnd = x - gap + 1;
    break;
  }
}
const symbol = await sharp(logo).extract({ left: 0, top: 0, width: symbolEnd, height: info.height }).trim().png().toBuffer();
await out('src/assets/logo/solrik-symbol.png', symbol);

/** Symbol centred on a square canvas. `fill` is the share of the width it may use. */
const square = async (size, { fill = 0.94, background = { r: 0, g: 0, b: 0, alpha: 0 } } = {}) => {
  const inner = Math.round(size * fill);
  const fitted = await sharp(symbol).resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).toBuffer();
  return sharp({ create: { width: size, height: size, channels: 4, background } })
    .composite([{ input: fitted, gravity: 'center' }])
    .png()
    .toBuffer();
};

function icoFromPng(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry.writeUInt8(size, 0);
  entry.writeUInt8(size, 1);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, png]);
}

await out('public/favicon.ico', icoFromPng(await square(32), 32));
await out('public/favicon-96x96.png', await square(96));
// iOS fills transparency with black, so the touch icon gets the page background.
await out('public/apple-touch-icon.png', await square(180, { fill: 0.8, background: { r: 251, g: 251, b: 248, alpha: 1 } }));
console.log('Done.');
