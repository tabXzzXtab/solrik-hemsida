/**
 * Generates the downloadable PDFs: "Så arbetar vi" / "How we work" (About page) and
 * clearly labelled placeholder tenant forms (replace with the real forms).
 * (Photos come from scripts/pexels.mjs, the logo and favicons from scripts/brand-assets.mjs.)
 *
 * Usage:  npm run placeholders          (skips files that already exist)
 *         npm run placeholders -- --force   (overwrites)
 *
 * Replace a generated file by saving the real one over the same file name.
 */
import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const force = process.argv.includes('--force');

const exists = async (p) => access(p).then(() => true, () => false);

async function out(relPath, buffer) {
  const abs = join(root, relPath);
  if (!force && (await exists(abs))) {
    console.log(`  skip  ${relPath}`);
    return;
  }
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, buffer);
  console.log(`  write ${relPath}`);
}

/* ------------------------------------------------------------------ */
/*  Minimal PDF writer (Helvetica, WinAnsiEncoding)                    */
/* ------------------------------------------------------------------ */

const WIN_ANSI = { '–': 0x96, '—': 0x97, '‘': 0x91, '’': 0x92, '“': 0x93, '”': 0x94, '•': 0x95, '…': 0x85, '€': 0x80 };

function pdfString(str) {
  const bytes = [];
  for (const ch of str) {
    let code = WIN_ANSI[ch] ?? ch.codePointAt(0);
    if (code > 0xff) code = 0x3f; // '?'
    if (code === 0x28 || code === 0x29 || code === 0x5c) bytes.push(0x5c);
    bytes.push(code);
  }
  return Buffer.from(bytes);
}

function wrap(text, maxChars) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > maxChars) {
      lines.push(line.trim());
      line = word;
    } else line += ' ' + word;
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

/**
 * blocks: [{ text, size?, bold?, gap?, color?, keepWithNext?, bullet? }]
 * Flows onto as many A4 pages as needed; a block marked keepWithNext (a heading)
 * never ends up alone at the bottom of a page. Bullets get a hanging indent.
 */
function makePdf(blocks) {
  const TOP = 790;
  const BOTTOM = 56;
  const pages = [[]];
  let y = TOP;
  for (const b of blocks) {
    const size = b.size ?? 11;
    const lineHeight = size * 1.35;
    const maxChars = Math.floor(483 / (size * 0.5));
    const font = b.bold ? 'F2' : 'F1';
    const [r, g, bl] = b.color ?? [0.12, 0.11, 0.1];
    const lines = wrap(b.text, maxChars - (b.bullet ? 3 : 0));
    // Width of "•  " in Helvetica (bullet 350 + two spaces 278 each, per 1000 em).
    const indent = b.bullet ? size * 0.906 : 0;
    const gap = b.gap ?? 6;
    const needed = gap + lines.length * lineHeight + (b.keepWithNext ? 2 * 11 * 1.35 : 0);
    if (y - needed < BOTTOM && pages.at(-1).length) {
      pages.push([]);
      y = TOP;
    } else {
      y -= gap;
    }
    lines.forEach((line, i) => {
      y -= lineHeight;
      const x = 56 + (i > 0 ? indent : 0);
      const text = b.bullet && i === 0 ? `•  ${line}` : line;
      pages.at(-1).push(Buffer.from(`BT ${r} ${g} ${bl} rg /${font} ${size} Tf ${x.toFixed(1)} ${y.toFixed(1)} Td (`, 'latin1'), pdfString(text), Buffer.from(') Tj ET\n', 'latin1'));
    });
  }
  // Accent bar at the top of every page.
  const streams = pages.map((parts) => Buffer.concat([Buffer.from('0.118 0.420 0.278 rg 0 812 595 30 re f\n', 'latin1'), ...parts]));

  // Objects: 1 catalog, 2 page tree, 3–4 fonts, then a page and its content stream per page.
  const pageId = (i) => 5 + i * 2;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    `<< /Type /Pages /Kids [${streams.map((_, i) => `${pageId(i)} 0 R`).join(' ')}] /Count ${streams.length} >>`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
    ...streams.flatMap((stream, i) => [
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${pageId(i) + 1} 0 R >>`,
      Buffer.concat([Buffer.from(`<< /Length ${stream.length} >>\nstream\n`, 'latin1'), stream, Buffer.from('\nendstream', 'latin1')]),
    ]),
  ];
  const chunks = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'latin1')];
  const offsets = [];
  let length = chunks[0].length;
  const push = (buf) => { chunks.push(buf); length += buf.length; };
  objects.forEach((body, i) => {
    offsets.push(length);
    const content = typeof body === 'string' ? Buffer.from(body, 'latin1') : body;
    push(Buffer.concat([Buffer.from(`${i + 1} 0 obj\n`, 'latin1'), content, Buffer.from('\nendobj\n', 'latin1')]));
  });
  const xrefStart = length;
  let xref = `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) xref += `${String(off).padStart(10, '0')} 00000 n \n`;
  push(Buffer.from(`${xref}trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`, 'latin1'));
  return Buffer.concat(chunks);
}

const muted = [0.42, 0.39, 0.35];
/** A finished document (title, intro, bullet list with "#" subheadings). */
const documentPdf = (title, intro, items = [], { draft = false, contact = 'Solrik AB · Aspögatan 1, 211 54 Malmö' } = {}) =>
  makePdf([
    ...(draft ? [{ text: 'PLATSHÅLLARE – ersätt med er riktiga fil innan publicering', size: 9, bold: true, color: [0.118, 0.420, 0.278], gap: 0 }] : []),
    { text: 'Solrik AB', size: 10, color: muted, gap: draft ? 14 : 0 },
    { text: title, size: 20, bold: true, gap: 10 },
    { text: intro, size: 11, gap: 10 },
    ...items.map((item) => (item.startsWith('#') ? { text: item.slice(1), size: 13, bold: true, gap: 14, keepWithNext: true } : { text: item, size: 11, gap: 4, bullet: true })),
    { text: contact, size: 9, color: muted, gap: 24 },
  ]);

/* ------------------------------------------------------------------ */
/*  Asset list                                                         */
/* ------------------------------------------------------------------ */

const pdfs = [
  {
    file: 'public/dokument/sa-arbetar-vi.pdf',
    pdf: documentPdf('Så arbetar vi – arbetsmiljö, kvalitet och miljö', 'En sammanfattning för er som vill veta hur Solrik arbetar innan ni anlitar oss – som underlag för upphandling, leverantörsbedömning eller styrelsens beslut.', [
      '#Organisation och ansvar',
      'Solrik AB (org.nr 559200-5077) ingår i Radiant Group och har kontor på Aspögatan 1 i Malmö. Vi arbetar i hela Skåne län.',
      'En avtalspart för hela uppdraget – vi samordnar alla hantverkare och underentreprenörer.',
      'Underentreprenörer har rätt behörigheter för sina uppgifter och följer samma krav som vi.',
      'En utsedd kontaktperson följer uppdraget från start till slutbesiktning.',
      '#Säker arbetsmiljö',
      'Riskbedömning inför varje uppdrag och arbetsmiljöplan när uppdraget kräver det.',
      'Vi tar rollen som BAS-P och BAS-U när det krävs.',
      'Alla som arbetar på plats får en genomgång av arbetsplatsen, riskerna och skyddsutrustningen.',
      'Tillbud och olyckor rapporteras och följs upp, så att de inte upprepas.',
      '#Kvalitet',
      'Egenkontroller under arbetets gång. Dokumentationen lämnas över vid slutbesiktningen.',
      'Våtrum utförs enligt branschregler för våtrum, med dokumentation.',
      'Garanti enligt branschens standardavtal, med garantibesiktning innan garantitiden går ut.',
      '#Miljö',
      'Byggavfall sorteras på arbetsplatsen i de fraktioner som krävs.',
      'Material med lång livslängd, dokumenterade för framtida underhåll. Återbruk där det går.',
      'Förslag på energiåtgärder räknas hem, så att ni ser både besparing och återbetalningstid.',
    ], { contact: 'Frågor? Skicka en förfrågan via kontaktformuläret på www.solrik.se · Solrik AB · Aspögatan 1, 211 54 Malmö' }),
  },
  {
    file: 'public/dokument/how-we-work.pdf',
    pdf: documentPdf('How we work – site safety, quality and environment', 'A summary for those who want to know how Solrik works before hiring us – for procurement, supplier assessment or a board decision.', [
      '#Organisation and responsibility',
      'Solrik AB (company reg. no. 559200-5077) is part of Radiant Group, with its office at Aspögatan 1 in Malmö. We work throughout Skåne County.',
      'One contract for the whole assignment – we coordinate every trade and subcontractor.',
      'Subcontractors hold the right qualifications for their tasks and meet the same requirements as we do.',
      'A named contact person follows the assignment from start to final inspection.',
      '#Site safety',
      'A risk assessment before every assignment and a work environment plan when the assignment requires one.',
      'We act as safety coordinator (BAS-P and BAS-U) when required.',
      'Everyone working on site is briefed on the site, the risks and the protective equipment.',
      'Incidents and accidents are reported and followed up so they are not repeated.',
      '#Quality',
      'Self-inspections as the work progresses. The documentation is handed over at the final inspection.',
      'Wet rooms are built to the industry rules for wet rooms, with documentation.',
      'Warranty under standard industry contracts, with a warranty inspection before the warranty ends.',
      '#Environment',
      'Construction waste is sorted on site into the required fractions.',
      'Durable materials, documented for future maintenance. Reuse where possible.',
      'Proposed energy measures are costed, so you see both the saving and the payback time.',
    ], { contact: 'Questions? Send an enquiry using the contact form at www.solrik.se · Solrik AB · Aspögatan 1, 211 54 Malmö' }),
  },
  { file: 'public/dokument/blankett-andrahandsuthyrning.pdf', pdf: documentPdf('Ansökan om andrahandsuthyrning', 'Platshållare för blankett. Ersätt med er riktiga blankett (PDF).', [], { draft: true }) },
  { file: 'public/dokument/blankett-uppsagning.pdf', pdf: documentPdf('Uppsägning av lägenhet', 'Platshållare för blankett. Ersätt med er riktiga blankett (PDF).', [], { draft: true }) },
  { file: 'public/dokument/blankett-andring-i-lagenhet.pdf', pdf: documentPdf('Ansökan om ändring i lägenhet', 'Platshållare för blankett. Ersätt med er riktiga blankett (PDF).', [], { draft: true }) },
  { file: 'public/dokument/blankett-parkering.pdf', pdf: documentPdf('Ansökan om parkeringsplats', 'Platshållare för blankett. Ersätt med er riktiga blankett (PDF).', [], { draft: true }) },
];

console.log('Generating placeholder assets…');
for (const { file, pdf } of pdfs) await out(file, pdf);

console.log('Done.');
