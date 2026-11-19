// ------------------------------------------------------------------
// Opens a page of the site with no window and runs a line of code in
// it, for checking what the 3D world is doing.
//
//   npm run peek -- <address> "<code>"
//
//   npm run peek -- "http://localhost:3000/?nointro=1" "window.__world.getState().quality"
//
// The code may use `await`. Its result is printed, along with anything
// the page itself complained about.
// ------------------------------------------------------------------

import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

const BROWSERS = [
  process.env.SHOTS_BROWSER,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
].filter(Boolean);

const [url, code, waitSeconds] = process.argv.slice(2);
if (!url || !code) {
  console.error('Usage: npm run peek -- <address> "<code>" [seconds to wait first]');
  process.exit(1);
}

const browser = await puppeteer.launch({
  executablePath: BROWSERS.find((p) => existsSync(p)),
  headless: true,
  args: ["--ignore-gpu-blocklist", "--enable-gpu", "--hide-scrollbars", "--mute-audio"],
  defaultViewport: { width: 1280, height: 720 },
});
const page = await browser.newPage();
const complaints = [];
page.on("pageerror", (error) => complaints.push(`error: ${String(error.message).slice(0, 300)}`));
page.on("console", (message) => {
  if (message.type() === "error" || message.type() === "warn") complaints.push(`${message.type()}: ${message.text().slice(0, 300)}`);
});
page.on("requestfailed", (request) => complaints.push(`failed: ${request.url().slice(0, 160)}`));

try {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  await page.waitForFunction(() => window.__world && window.__world.getState().worldReady, { timeout: 90_000, polling: 250 }).catch(() => complaints.push("the 3D world never reported ready"));
  await new Promise((resolve) => setTimeout(resolve, Number(waitSeconds ?? 3) * 1000));
  const result = await page.evaluate(`(async () => { return (${code}); })()`);
  console.log(typeof result === "string" ? result : JSON.stringify(result, null, 2));
} catch (error) {
  console.log(`FAILED: ${String(error.message).slice(0, 300)}`);
}
if (complaints.length) console.log(`\nThe page said:\n${[...new Set(complaints)].slice(0, 12).join("\n")}`);
await browser.close();
