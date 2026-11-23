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

for (const sheetName of ["crowd", "crowd-back", "queue"]) {
  if (!existsSync(`${DIR}/${sheetName}-colour.raw.png`)) continue;
  for (const [part, options] of [
    ["colour", { quality: 86, alphaQuality: 90, effort: 6 }],
    ["mask", { quality: 92, alphaQuality: 90, effort: 6, nearLossless: true }],
  ]) {
    const from = `${DIR}/${sheetName}-${part}.raw.png`;
    const to = `${DIR}/${sheetName}-${part}.webp`;
    await sharp(from).webp(options).toFile(to);
    console.log(`${to}  ${(statSync(from).size / 1024).toFixed(0)} KB -> ${(statSync(to).size / 1024).toFixed(0)} KB`);
  }

  const { data, info } = await sharp(`${DIR}/${sheetName}-colour.raw.png`).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const sheet = JSON.parse(readFileSync(`${DIR}/${sheetName}.json`, "utf8"));
  const [cellW, cellH] = sheet.cell;
  sheet.boxes = sheet.cells.map((_, c) => {
    let x0 = cellW;
    let x1 = 0;
    let y0 = cellH;
    for (let y = 0; y < info.height; y++)
      for (let x = 0; x < cellW; x++)
        if (data[(y * info.width + c * cellW + x) * 4 + 3] > 8) {
          x0 = Math.min(x0, x);
          x1 = Math.max(x1, x + 1);
          y0 = Math.min(y0, y);
        }
    // [left, right, top] as shares of the cell, measured from its bottom left
    const share = (v, of) => Math.round((v / of) * 1000) / 1000;
    return [share(Math.max(0, x0 - MARGIN), cellW), share(Math.min(cellW, x1 + MARGIN), cellW), share(cellH - Math.max(0, y0 - MARGIN), cellH)];
  });
  writeFileSync(`${DIR}/${sheetName}.json`, JSON.stringify(sheet, null, 2) + "\n");
  console.log(sheetName, "outlines", JSON.stringify(sheet.boxes));
}
