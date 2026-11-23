// ------------------------------------------------------------------
// Photographs the first page of the résumé, for the frame in the
// ticket office (rooms/TicketOffice.tsx).
//
//   npm run resume:image -- http://localhost:3000
//
// It opens the site's Résumé page (made from app/data/resume.ts, like
// the PDF), lays the sheet out at the width of a letter page, and saves
// that page as public/resume/resume-page.webp. Run it again after any
// change to the résumé.
// ------------------------------------------------------------------

import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";
import sharp from "sharp";

const BROWSERS = [
  process.env.SHOTS_BROWSER,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].filter(Boolean);

const site = process.argv[2] ?? "http://localhost:3000";
// a letter page, 8.5 by 11 inches, at 96 dots to the inch (taller if
// the sheet runs on; the frame takes its shape from the picture)
const PAGE = { width: 816, height: 1056 };
const SCALE = 2;
const OUT = "public/resume/resume-page.webp";

const browser = await puppeteer.launch({
  executablePath: BROWSERS.find((b) => existsSync(b)),
  headless: true,
  defaultViewport: { width: 1400, height: 1600, deviceScaleFactor: SCALE },
});
const page = await browser.newPage();
await page.goto(`${site}/resume?nointro=1&quality=low`, { waitUntil: "networkidle2", timeout: 120000 });
await page.waitForSelector(".resume-page", { timeout: 60000 });
await page.evaluateHandle("document.fonts.ready");

// a copy of the sheet, on its own, at page width; as tall as it needs
const tall = await page.evaluate(({ width, height }) => {
  const sheet = document.querySelector(".resume-sheet");
  const copy = sheet.cloneNode(true);
  const stage = document.createElement("div");
  stage.id = "resume-stage";
  Object.assign(stage.style, { position: "fixed", left: "0", top: "0", width: `${width}px`, height: `${height}px`, overflow: "hidden", background: "#ffffff", zIndex: "2147483647" });
  Object.assign(copy.style, { width: "100%", maxWidth: "none", margin: "0", boxShadow: "none", borderRadius: "0" });
  stage.appendChild(copy);
  document.body.appendChild(stage);
  const needed = Math.ceil(copy.scrollHeight);
  stage.style.height = `${Math.max(height, needed)}px`;
  return Math.max(height, needed);
}, PAGE);
const shot = await page.screenshot({ clip: { x: 0, y: 0, width: PAGE.width, height: tall }, type: "png" });
await browser.close();

await sharp(shot).resize({ width: 1200 }).webp({ quality: 88 }).toFile(OUT);
console.log(`saved ${OUT}`);
