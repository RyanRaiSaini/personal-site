// Builds the downloadable résumé PDF from app/data/resume.ts.
//
//     npm run resume
//
// Writes public/resume/Ryan-Saini-Resume.pdf. The layout follows the
// classic one-page LaTeX résumé: centred name, ruled section headings,
// dates on the right, bullets with bold figures. Text stays real text
// (selectable, searchable, readable by applicant tracking systems).

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

const PAGE = { width: 612, height: 792 };
const MARGIN = { x: 40, top: 34, bottom: 30 };
const WIDTH = PAGE.width - MARGIN.x * 2;
const R = "Times-Roman";
const B = "Times-Bold";
const I = "Times-Italic";

const doc = new PDFDocument({
  size: "LETTER",
  margins: { top: MARGIN.top, bottom: MARGIN.bottom, left: MARGIN.x, right: MARGIN.x },
  info: { Title: resume.pdf.title, Author: resume.name, Subject: "Résumé" },
});
doc.pipe(createWriteStream(outFile));

// "a **bold** b" -> [{ text: "a ", bold: false }, { text: "bold", bold: true }, ...]
function segments(text) {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) => (part.startsWith("**") ? { text: part.slice(2, -2), bold: true } : { text: part, bold: false }));
}

function richText(text, x, y, options) {
  const parts = segments(text);
  doc.x = x;
  doc.y = y;
  parts.forEach((part, i) => {
    doc.font(part.bold ? B : R).text(part.text, { ...options, continued: i < parts.length - 1 });
  });
}

// ---- name and contact line ----
doc.font(B).fontSize(25).text(resume.name, MARGIN.x, MARGIN.top, { width: WIDTH, align: "center", characterSpacing: 0.6 });
doc.moveDown(0.12);

doc.fontSize(10);
const SEPARATOR = "  |  ";
const contactWidth = resume.contact.reduce((sum, item, i) => sum + doc.font(R).widthOfString(item.text) + (i ? doc.widthOfString(SEPARATOR) : 0), 0);
let cx = MARGIN.x + (WIDTH - contactWidth) / 2;
const cy = doc.y;
resume.contact.forEach((item, i) => {
  if (i) {
    doc.font(R).fillColor("#000").text(SEPARATOR, cx, cy, { lineBreak: false });
    cx += doc.widthOfString(SEPARATOR);
  }
  const w = doc.widthOfString(item.text);
  doc.font(R).fillColor("#000").text(item.text, cx, cy, { lineBreak: false, underline: Boolean(item.href), link: item.href || undefined });
  cx += w;
});
doc.y = cy + 15;

function sectionHeading(title) {
  doc.moveDown(0.35);
  const y = doc.y;
  // small caps: a large first letter and smaller capitals after it
  let x = MARGIN.x;
  for (const word of title.split(" ")) {
    doc.font(R).fontSize(13.5).text(word[0].toUpperCase(), x, y, { lineBreak: false });
    x += doc.widthOfString(word[0].toUpperCase());
    doc.fontSize(10.8).text(word.slice(1).toUpperCase(), x, y + 2.3, { lineBreak: false });
    x += doc.widthOfString(word.slice(1).toUpperCase()) + 4;
  }
  const ruleY = y + 16;
  doc.moveTo(MARGIN.x, ruleY).lineTo(MARGIN.x + WIDTH, ruleY).lineWidth(0.6).stroke("#000");
  doc.y = ruleY + 5;
}

function entry(item) {
  const y = doc.y;
  const inset = 8;
  doc.font(B).fontSize(11);
  const [main, ...rest] = item.title.split(" | ");
  doc.text(main, MARGIN.x + inset, y, { lineBreak: false });
  if (rest.length) {
    const offset = doc.widthOfString(main);
    doc.font(R).text(" | ", MARGIN.x + inset + offset, y, { lineBreak: false });
    const bar = doc.widthOfString(" | ");
    doc.font(I).fontSize(10).text(rest.join(" | "), MARGIN.x + inset + offset + bar, y + 0.8, { lineBreak: false });
  }
  doc.font(R).fontSize(11).text(item.date, MARGIN.x, y, { width: WIDTH - inset, align: "right", lineBreak: false });

  const y2 = y + 13.5;
  doc.font(I).fontSize(10).text(item.subtitle, MARGIN.x + inset, y2, { lineBreak: false });
  doc.text(item.location, MARGIN.x, y2, { width: WIDTH - inset, align: "right", lineBreak: false });
  doc.y = y2 + 13.5;

  doc.fontSize(10);
  for (const bullet of item.bullets) {
    const by = doc.y;
    doc.font(R).text("•", MARGIN.x + inset + 10, by, { lineBreak: false });
    richText(bullet, MARGIN.x + inset + 22, by, { width: WIDTH - inset * 2 - 22, align: "left", lineGap: 0.6 });
    doc.y += 1.6;
  }
  doc.y += 2.5;
}

for (const section of resume.sections) {
  sectionHeading(section.heading);
  section.entries.forEach(entry);
}

sectionHeading("Technical Skills");
doc.fontSize(10);
for (const line of resume.skills) {
  const y = doc.y;
  doc.x = MARGIN.x + 8;
  doc.y = y;
  doc.font(B).text(`${line.label}: `, { width: WIDTH - 16, continued: true, lineGap: 0.8 });
  doc.font(R).text(line.value, { lineGap: 0.8 });
  doc.y += 1;
}

const pages = doc.bufferedPageRange ? doc.bufferedPageRange().count : 1;
doc.end();
console.log(`Wrote ${path.relative(root, outFile)}${pages > 1 ? ` (warning: ${pages} pages)` : ""}`);
