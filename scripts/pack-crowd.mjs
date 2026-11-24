// ------------------------------------------------------------------
// Squeezes the crowd's picture sheets for the web.
//
//   npm run crowd:pack
//
// blender/build_crowd.py writes, into public/stadium/crowd/, a colour
// sheet and a mask sheet for the people seen from the front (crowd-*)
// and, with --back, from behind (crowd-back-*); with --stand, standing
// people for the ticket office's queues (queue-*). This writes the WebP
// files the site loads. The masks are measurements, not colours, so
// they are kept sharp.
// ------------------------------------------------------------------

import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const DIR = "public/stadium/crowd";
// Each person fills only a part of his cell. The outline of each (with a
// few pixels to spare) goes into the sheet's .json, so the site can draw
// each person on a card no larger than he is: the empty corners cost as
// much to draw as the person.
const MARGIN = 3;

// One of the men's hair has a gap that shows his scalp: a small patch of
// skin with hair all round it. In the mask such a patch is marked as hair,
// so the site colours it with the rest of his hair.
const isSkin = (d, i) => d[i + 1] > 128 && d[i] < 100 && d[i + 2] < 100;
const isHair = (d, i) => d[i] < 60 && d[i + 1] < 60 && d[i + 2] > 140 && d[i + 2] < 225;
// round the patch's edge the pixels are part skin, part hair: they count as hair
const isHairEdge = (d, i) => d[i] < 60 && d[i + 2] > 100 && d[i + 2] < 225;
async function closeHairGaps(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const seen = new Uint8Array(width * height);
  let hairValue = null;
  for (let i = 0; i < data.length && !hairValue; i += 4) if (isHair(data, i)) hairValue = [data[i], data[i + 1], data[i + 2]];
  let closed = 0;
  for (let start = 0; start < width * height; start++) {
    if (seen[start] || !isSkin(data, start * 4)) continue;
    // the patch of skin this pixel belongs to, and what lies round it
    const patch = [start];
    seen[start] = 1;
    let hairRound = 0;
    let otherRound = 0;
    for (let k = 0; k < patch.length; k++) {
      const p = patch[k];
      const x = p % width;
      const y = (p - x) / width;
      for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue;
        const q = ny * width + nx;
        if (isSkin(data, q * 4)) {
          if (!seen[q]) {
            seen[q] = 1;
            patch.push(q);
          }
        } else if (isHairEdge(data, q * 4)) hairRound++;
        else otherRound++;
      }
    }
    if (patch.length < 400 && hairRound > 4 * otherRound && hairValue) {
      for (const p of patch) data.set(hairValue, p * 4);
      closed++;
    }
  }
  return { image: sharp(data, { raw: { width, height, channels: 4 } }), closed };
}

for (const sheetName of ["crowd", "crowd-back", "queue"]) {
  if (!existsSync(`${DIR}/${sheetName}-colour.raw.png`)) continue;
  for (const [part, options] of [
    ["colour", { quality: 86, alphaQuality: 90, effort: 6 }],
    ["mask", { quality: 92, alphaQuality: 90, effort: 6, nearLossless: true }],
  ]) {
    const from = `${DIR}/${sheetName}-${part}.raw.png`;
    const to = `${DIR}/${sheetName}-${part}.webp`;
    // and a half-size copy for phones and the "low" setting (a quarter of
    // the memory); the mask is shrunk without blending, so its colours stay
    // exact labels
    const small = to.replace(".webp", "-small.webp");
    if (part === "mask") {
      const { image, closed } = await closeHairGaps(from);
      const buffer = await image.png().toBuffer();
      await sharp(buffer).webp(options).toFile(to);
      const { width } = await sharp(buffer).metadata();
      await sharp(buffer).resize(Math.round(width / 2), null, { kernel: "nearest" }).webp(options).toFile(small);
      console.log(`${sheetName}: ${closed} gaps in the hair closed`);
    } else {
      await sharp(from).webp(options).toFile(to);
      const { width } = await sharp(from).metadata();
      await sharp(from).resize(Math.round(width / 2)).webp(options).toFile(small);
    }
    console.log(`${to}  ${(statSync(from).size / 1024).toFixed(0)} KB -> ${(statSync(to).size / 1024).toFixed(0)} KB`);
  }

  const { data, info } = await sharp(`${DIR}/${sheetName}-colour.raw.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const mask = await sharp(`${DIR}/${sheetName}-mask.raw.png`).ensureAlpha().raw().toBuffer();
  const sheet = JSON.parse(readFileSync(`${DIR}/${sheetName}.json`, "utf8"));
  const [cellW, cellH] = sheet.cell;
  // the cells sit in rows of `columns`, the first row at the top
  const columns = sheet.columns ?? sheet.cells.length;
  const corner = (c) => [(c % columns) * cellW, Math.floor(c / columns) * cellH];
  sheet.boxes = sheet.cells.map((_, c) => {
    const [cx, cy] = corner(c);
    let x0 = cellW;
    let x1 = 0;
    let y0 = cellH;
    for (let y = 0; y < cellH; y++)
      for (let x = 0; x < cellW; x++)
        if (data[((cy + y) * info.width + cx + x) * 4 + 3] > 8) {
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x + 1);
          y0 = Math.min(y0, y);
        }
    // [left, right, top] as shares of the cell, measured from its bottom left
    const share = (v, of) => Math.round((v / of) * 1000) / 1000;
    return [share(Math.max(0, x0 - MARGIN), cellW), share(Math.min(cellW, x1 + MARGIN), cellW), share(cellH - Math.max(0, y0 - MARGIN), cellH)];
  });
  // How dark each person's own skin is, 0 (the fairest of them) to 1 (as
  // dark as the site's darkest tone): the site can only darken a picture,
  // so it darkens each from where they already are
  const linear = (v) => Math.pow(v / 255, 2.2);
  const brightness = sheet.cells.map((_, c) => {
    const [cx, cy] = corner(c);
    let sum = 0;
    let n = 0;
    for (let y = 0; y < cellH; y++)
      for (let x = 0; x < cellW; x++) {
        const i = ((cy + y) * info.width + cx + x) * 4;
        if (mask[i + 1] > 200 && mask[i] < 40 && mask[i + 2] < 40 && data[i + 3] > 200) {
          sum += 0.3 * linear(data[i]) + 0.59 * linear(data[i + 1]) + 0.11 * linear(data[i + 2]);
          n++;
        }
      }
    return n ? sum / n : 0;
  });
  // each person's average over their four cells; "fair" is the average of
  // the first four people bar Remy (people 1 to 3), who were drawn as fair
  // from the start and looked right (Remy's skin is lit far brighter)
  const EACH = 4;
  const person = (p) => brightness.slice(p * EACH, p * EACH + EACH).reduce((a, b) => a + b, 0) / EACH;
  const fair = (person(1) + person(2) + person(3)) / 3;
  // the site's darkest skin multiplies brightness by about 0.26
  sheet.tones = sheet.cells.map((_, c) => Math.round(Math.min(1, Math.max(0, (1 - person(Math.floor(c / EACH)) / fair) / (1 - 0.26))) * 100) / 100);
  writeFileSync(`${DIR}/${sheetName}.json`, JSON.stringify(sheet, null, 2) + "\n");
  console.log(sheetName, "skin tones", JSON.stringify(sheet.tones));
}
