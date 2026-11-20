// Builds the downloadable résumé PDF from app/data/resume.ts.
//
//     npm run resume
//
// Writes public/resume/Ryan-Saini-Resume.pdf.
//
// The page is laid out to match my LaTeX résumé (Jake Gutierrez's
// template, 11pt article on letter paper): the same typeface, Computer
// Modern, the same margins, sizes and spacing, measured from the LaTeX
// output. The only differences from that file are the ones a public
// copy needs: an email address where the phone number was.
//
// Text stays real text (selectable, searchable, readable by applicant
// tracking systems). The fonts are in scripts/fonts (SIL Open Font
// License; see OFL.txt there).

import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import PDFDocument from "pdfkit";
import { resume } from "../app/data/resume.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "resume");
await mkdir(outDir, { recursive: true });
const outFile = path.join(outDir, resume.pdf.file);
const font = (file) => path.join(root, "scripts", "fonts", file);

// ---- the page, in points (72 to the inch), as LaTeX sets it ----
const PAGE = { width: 612, height: 792 };
const LEFT = 36; // half-inch margins
const RIGHT = 576;
const ENTRY = LEFT + 10.84; // entries are set in by 0.15in
const ENTRY_RIGHT = ENTRY + 0.97 * (RIGHT - LEFT); // where dates and places end
const BULLET_TEXT = 70; // where a bullet's words begin
const BULLET_DOT = 62;

// LaTeX's sizes, converted from its points to PDF points
const SIZE = { name: 24.79, heading: 11.96, body: 10.91, small: 9.96 };
// Small capitals are capitals at about four-fifths the size, set a
// little apart (LaTeX's small capitals are drawn wider than its capitals)
const SMALL_CAPS = 0.82;
// A paragraph turns a few points before the right-hand margin, which
// is where LaTeX turned the same lines
const TURN = RIGHT - 4.5;

// Distances between baselines, measured from the LaTeX output
const GAP = {
  top: 51.6, // top of the page to the name
  nameToContact: 17.8,
  beforeHeading: 22.2, // from the last line above to a section's title
  headingRule: 5.3, // title to the rule under it
  ruleToEntry: 13.3,
  rowToRow: 11.8, // an entry's first line to its second
  rowToBullet: 13.8,
  bulletLine: 11.96, // lines within one bullet
  bulletToBullet: 14.0,
  bulletToEntry: 16.9,
  ruleToSkills: 13.4,
  skillsLine: 13.85,
};

const doc = new PDFDocument({
  size: "LETTER",
  margins: { top: 0, bottom: 0, left: 0, right: 0 },
  info: { Title: resume.pdf.title, Author: resume.name, Subject: "Résumé" },
});
doc.pipe(createWriteStream(outFile));
doc.registerFont("R", font("cmu-serif-500-roman.ttf"));
doc.registerFont("B", font("cmu-serif-700-roman.ttf"));
doc.registerFont("I", font("cmu-serif-500-italic.ttf"));

// One piece of text with its baseline at y. Returns its width.
function put(text, x, y, { face = "R", size = SIZE.body, align = "left", link, underline = false, heavy = 0 } = {}) {
  doc.font(face).fontSize(size);
  const width = doc.widthOfString(text);
  const left = align === "right" ? x - width : align === "center" ? x - width / 2 : x;
  const options = { lineBreak: false, baseline: "alphabetic" };
  if (link) options.link = link;
  if (heavy) {
    // a hair of outline, to match the weight of true small capitals
    doc.lineWidth(heavy).fillColor("#000").strokeColor("#000");
    doc.text(text, left, y, { ...options, fill: true, stroke: true });
  } else doc.fillColor("#000").text(text, left, y, options);
  if (underline) {
    doc
      .moveTo(left, y + 1.5)
      .lineTo(left + width, y + 1.5)
      .lineWidth(0.4)
      .stroke("#000");
  }
  return width;
}

// Text in capitals and small capitals, the way LaTeX's \scshape sets it
function smallCaps(text, x, y, size, { align = "left", heavy = 0, apart = 0.3 } = {}) {
  const runs = [];
  for (const char of text) {
    const upper = char === char.toUpperCase() && char !== char.toLowerCase();
    const big = upper || !/\p{L}/u.test(char);
    const last = runs[runs.length - 1];
    if (last && last.big === big) last.text += char.toUpperCase();
    else runs.push({ big, text: char.toUpperCase() });
  }
  doc.font("R");
  const widths = runs.map((run) => doc.fontSize(run.big ? size : size * SMALL_CAPS).widthOfString(run.text) + apart * run.text.length);
  const total = widths.reduce((sum, w) => sum + w, 0) - apart;
  let at = align === "center" ? x - total / 2 : x;
  runs.forEach((run, i) => {
    doc.font("R").fontSize(run.big ? size : size * SMALL_CAPS);
    const options = { lineBreak: false, baseline: "alphabetic", characterSpacing: apart };
    if (heavy) {
      doc.lineWidth(heavy).fillColor("#000").strokeColor("#000");
      doc.text(run.text, at, y, { ...options, fill: true, stroke: true });
    } else doc.fillColor("#000").text(run.text, at, y, options);
    at += widths[i];
  });
}

// "a **bold** b" -> words, each knowing whether it is bold
function words(text) {
  const out = [];
  for (const part of text.split(/(\*\*[^*]+\*\*)/g).filter(Boolean)) {
    const bold = part.startsWith("**");
    const plain = bold ? part.slice(2, -2) : part;
    // a line may also turn after a hyphen inside a word, as in the original
    for (const piece of plain.split(/(\s+)/).filter(Boolean)) {
      if (/^\s+$/.test(piece)) out.push({ space: true });
      else for (const bit of piece.split(/(?<=[A-Za-z]-)(?=[A-Za-z])/)) out.push({ text: bit, bold, glue: true });
    }
  }
  // pieces of one hyphenated word stay together unless a line has to turn there
  return out;
}

// A paragraph of bold and plain words, turned at `right`, left edge at
// `x`, first baseline at `y`. Returns the last baseline.
function paragraph(text, x, y, right, { size = SIZE.small, leading = GAP.bulletLine } = {}) {
  const measure = (item) => doc.font(item.bold ? "B" : "R").fontSize(size).widthOfString(item.text);
  doc.font("R").fontSize(size);
  const space = doc.widthOfString(" ");
  let line = [];
  let width = 0;
  let pendingSpace = false;
  const lines = [];
  for (const item of words(text)) {
    if (item.space) {
      pendingSpace = line.length > 0;
      continue;
    }
    const w = measure(item);
    const gap = pendingSpace ? space : 0;
    if (line.length && x + width + gap + w > right) {
      lines.push(line);
      line = [];
      width = 0;
      line.push({ ...item, w, gap: 0 });
      width = w;
    } else {
      line.push({ ...item, w, gap });
      width += gap + w;
    }
    pendingSpace = false;
  }
  if (line.length) lines.push(line);
  let baseline = y;
  lines.forEach((items, i) => {
    baseline = y + i * leading;
    let at = x;
    for (const item of items) {
      at += item.gap;
      put(item.text, at, baseline, { face: item.bold ? "B" : "R", size });
      at += item.w;
    }
  });
  return baseline;
}

// ---- name and contact line ----
let y = GAP.top;
smallCaps(resume.name, PAGE.width / 2, y, SIZE.name, { align: "center", heavy: 0.5, apart: 1.5 });

y += GAP.nameToContact;
doc.font("R").fontSize(SIZE.small);
const BAR = " | ";
const contactWidth = resume.contact.reduce((sum, item, i) => sum + doc.widthOfString(item.text) + (i ? doc.widthOfString(BAR) : 0), 0);
let cx = PAGE.width / 2 - contactWidth / 2;
resume.contact.forEach((item, i) => {
  if (i) cx += put(BAR, cx, y, { size: SIZE.small });
  cx += put(item.text, cx, y, { size: SIZE.small, link: item.href || undefined, underline: Boolean(item.href) });
});

function sectionHeading(title) {
  y += GAP.beforeHeading;
  smallCaps(title, LEFT, y, SIZE.heading);
  y += GAP.headingRule;
  doc.moveTo(LEFT, y).lineTo(RIGHT, y).lineWidth(0.4).stroke("#000");
}

function entry(item, first) {
  y += first ? GAP.ruleToEntry : GAP.bulletToEntry;
  const [main, ...rest] = item.title.split(" | ");
  let x = ENTRY + put(main, ENTRY, y, { face: "B" });
  if (rest.length) {
    x += put(" | ", x, y);
    put(rest.join(" | "), x, y, { face: "I", size: SIZE.small });
  }
  put(item.date, ENTRY_RIGHT, y, { align: "right" });

  y += GAP.rowToRow;
  put(item.subtitle, ENTRY, y, { face: "I", size: SIZE.small });
  put(item.location, ENTRY_RIGHT, y, { face: "I", size: SIZE.small, align: "right" });

  item.bullets.forEach((bullet, i) => {
    y += i ? GAP.bulletToBullet : GAP.rowToBullet;
    doc.circle(BULLET_DOT, y - 2.5, 1.15).fill("#000");
    y = paragraph(bullet, BULLET_TEXT, y, TURN);
  });
}

for (const section of resume.sections) {
  sectionHeading(section.heading);
  section.entries.forEach((item, i) => entry(item, i === 0));
  // a section that ends without bullets sits a little closer to the next
  if (!section.entries[section.entries.length - 1].bullets.length) y += 1.2;
}

sectionHeading("Technical Skills");
y += GAP.ruleToSkills - GAP.skillsLine;
for (const line of resume.skills) {
  y += GAP.skillsLine;
  y = paragraph(`**${line.label}**: ${line.value}`, ENTRY, y, TURN, { leading: GAP.skillsLine });
}

const spare = Math.round(PAGE.height - 36 - y);
doc.end();
console.log(`Wrote ${path.relative(root, outFile)}`);
if (spare < 0) console.warn(`Warning: the résumé runs ${-spare} points past the bottom margin. Shorten app/data/resume.ts to bring it back to one page.`);
else console.log(`One page, with ${spare} points of space left at the bottom.`);
