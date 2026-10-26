/**
 * Generates the downloadable PDFs: the BRF checklist (finished) and clearly
 * labelled placeholder tenant forms (replace with the real forms).
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

/** blocks: [{ text, size?, bold?, gap?, color? }] */
function makePdf(blocks) {
  const parts = [];
  let y = 790;
  for (const b of blocks) {
    const size = b.size ?? 11;
    const maxChars = Math.floor(483 / (size * 0.5));
    const font = b.bold ? 'F2' : 'F1';
    const [r, g, bl] = b.color ?? [0.12, 0.11, 0.1];
    y -= b.gap ?? 6;
    for (const line of wrap(b.text, maxChars)) {
      y -= size * 1.35;
      parts.push(Buffer.from(`BT ${r} ${g} ${bl} rg /${font} ${size} Tf 56 ${y.toFixed(1)} Td (`, 'latin1'), pdfString(line), Buffer.from(') Tj ET\n', 'latin1'));
    }
  }
  // accent bar at top
  parts.unshift(Buffer.from('0.118 0.420 0.278 rg 0 812 595 30 re f\n', 'latin1'));
  const stream = Buffer.concat(parts);

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
  ];
  const chunks = [Buffer.from('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n', 'latin1')];
  const offsets = [];
  let length = chunks[0].length;
  const push = (buf) => { chunks.push(buf); length += buf.length; };
  objects.forEach((body, i) => {
    offsets.push(length);
    push(Buffer.from(`${i + 1} 0 obj\n${body}\nendobj\n`, 'latin1'));
  });
  offsets.push(length);
  push(Buffer.concat([Buffer.from(`6 0 obj\n<< /Length ${stream.length} >>\nstream\n`, 'latin1'), stream, Buffer.from('\nendstream\nendobj\n', 'latin1')]));
  const xrefStart = length;
  let xref = `xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`;
  for (const off of offsets) xref += `${String(off).padStart(10, '0')} 00000 n \n`;
  push(Buffer.from(`${xref}trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`, 'latin1'));
  return Buffer.concat(chunks);
}

const muted = [0.42, 0.39, 0.35];
/** A finished one-page document (title, intro, bullet list with "#" subheadings). */
const documentPdf = (title, intro, items = [], { draft = false, contact = 'Solrik AB · Aspögatan 1, 211 54 Malmö' } = {}) =>
  makePdf([
    ...(draft ? [{ text: 'PLATSHÅLLARE – ersätt med er riktiga fil innan publicering', size: 9, bold: true, color: [0.118, 0.420, 0.278], gap: 0 }] : []),
    { text: 'Solrik AB', size: 10, color: muted, gap: draft ? 14 : 0 },
    { text: title, size: 20, bold: true, gap: 10 },
    { text: intro, size: 11, gap: 10 },
    ...items.map((item) => (item.startsWith('#') ? { text: item.slice(1), size: 13, bold: true, gap: 14 } : { text: `•  ${item}`, size: 11, gap: 4 })),
    { text: contact, size: 9, color: muted, gap: 24 },
  ]);

/* ------------------------------------------------------------------ */
/*  Asset list                                                         */
/* ------------------------------------------------------------------ */

const pdfs = [
  {
    file: 'public/dokument/checklista-infor-stambyte.pdf',
    pdf: documentPdf('Inför stambyte – checklista för styrelsen', 'Det här behöver styrelsen ha koll på – från underlag och beslut till upphandling och genomförande.', [
      '#Underlag',
      'Aktuell underhållsplan och statusbesiktning av stammarna (t.ex. filmning av avlopp).',
      'Ritningar över stammar, badrum och kök – kontrollera att de stämmer med verkligheten.',
      'Sammanställning av tidigare åtgärder och kända skador.',
      '#Beslut och ekonomi',
      'Bestäm omfattning: endast stammar, eller även badrum, kök och el.',
      'Ta fram budget och finansiering – påverkas avgiften?',
      'Kontrollera vilka beslut som kräver stämma och vilka regler i stadgarna som gäller.',
      '#Medlemmarna',
      'Informera tidigt: tidplan, störningar, tillgång till vatten och toalett under arbetet.',
      'Planera för tillval och för lägenheter med egna tidigare renoveringar.',
      '#Upphandling och genomförande',
      'Begär offerter på samma underlag så att de går att jämföra.',
      'Klargör entreprenadform, garantitid, besiktningar och vem som är BAS-P/BAS-U.',
      'Utse en kontaktperson i styrelsen och bestäm hur ändringar ska hanteras.',
    ]),
  },
  {
    file: 'public/dokument/checklist-before-pipe-replacement.pdf',
    pdf: documentPdf('Before pipe replacement – checklist for the board', 'What the board needs to keep track of – from documentation and decisions to procurement and delivery.', [
      '#Documentation',
      'Current maintenance plan and a condition survey of the pipes.',
      'Drawings of risers, bathrooms and kitchens – check they match reality.',
      '#Decisions and finances',
      'Decide the scope: pipes only, or bathrooms, kitchens and electrics too.',
      'Budget and financing – will the monthly fee change?',
      '#Members',
      'Inform early: schedule, disruption, access to water and toilets during the works.',
      '#Procurement and delivery',
      'Request quotes on the same basis so they can be compared.',
      'Clarify contract type, warranty period, inspections and the safety coordinators (BAS-P/BAS-U).',
    ]),
  },
  { file: 'public/dokument/blankett-andrahandsuthyrning.pdf', pdf: documentPdf('Ansökan om andrahandsuthyrning', 'Platshållare för blankett. Ersätt med er riktiga blankett (PDF).', [], { draft: true }) },
  { file: 'public/dokument/blankett-uppsagning.pdf', pdf: documentPdf('Uppsägning av lägenhet', 'Platshållare för blankett. Ersätt med er riktiga blankett (PDF).', [], { draft: true }) },
  { file: 'public/dokument/blankett-andring-i-lagenhet.pdf', pdf: documentPdf('Ansökan om ändring i lägenhet', 'Platshållare för blankett. Ersätt med er riktiga blankett (PDF).', [], { draft: true }) },
  { file: 'public/dokument/blankett-parkering.pdf', pdf: documentPdf('Ansökan om parkeringsplats', 'Platshållare för blankett. Ersätt med er riktiga blankett (PDF).', [], { draft: true }) },
];

console.log('Generating placeholder assets…');
for (const { file, pdf } of pdfs) await out(file, pdf);

console.log('Done.');
