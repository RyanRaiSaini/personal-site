// ------------------------------------------------------------------
// Takes the same set of pictures of the site every time, so a change
// to the 3D world or the interface can be judged before and after.
//
//   npm run shots -- <address> <folder> [name,name,...]
//
//   npm run shots -- http://localhost:3000 docs/redesign/after
//   npm run shots -- https://ryansaini.vercel.app docs/redesign/before first-view,goal
//
// It drives a copy of Chrome or Edge that is already installed, with
// no window. Each scene shot parks the camera at a fixed spot (the
// site's own `__look` helper), so two runs line up exactly.
// ------------------------------------------------------------------

import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import puppeteer from "puppeteer-core";

const BROWSERS = [
  process.env.SHOTS_BROWSER,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean);

const DESKTOP = { width: 1280, height: 720 };
const PHONE = { width: 390, height: 844 };

// A clear afternoon with the roof open, and a night with it closed
const DAY = "nointro=1&roof=open&time=14:00&weather=clear&quality=high";
const NIGHT = "nointro=1&roof=closed&time=22:00&weather=clear&quality=high";

// look: [x, y, z, targetX, targetY, targetZ, fieldOfView], in metres.
// scene: true hides the page's text and buttons, leaving the 3D view.
// start: true takes the picture on the start screen, before the walk-out.
const SHOTS = [
  { name: "start-screen", path: "/", query: DAY.replace("nointro=1&", ""), start: true },
  { name: "first-view", path: "/", query: DAY, look: [0, 23.5, 64, 0, 9.5, 0, 52] },
  { name: "overview", path: "/", query: DAY, look: [0, 23.5, 64, 0, 9.5, 0, 52], scene: true },
  { name: "overview-corner", path: "/", query: DAY, look: [58, 26, 46, 0, 8, 0, 50], scene: true },
  { name: "centre-circle", path: "/", query: DAY, look: [8.5, 2.3, 12.5, -0.5, 1.5, 0, 40], scene: true },
  { name: "number-eight", path: "/", query: DAY, look: [2.5, 1.45, 3.7, 0, 0.95, 0, 30], scene: true },
  { name: "number-eight-back", path: "/", query: DAY, look: [-2.4, 1.5, -3.6, 0, 1.0, 0, 30], scene: true },
  { name: "goal", path: "/", query: DAY, look: [33, 3.4, 10.5, 52.5, 1.9, -1.5, 42], scene: true },
  { name: "dugout", path: "/", query: DAY, look: [-8.5, 2.5, -29, -15.5, 1.5, -41, 42], scene: true },
  { name: "main-stand", path: "/", query: DAY, look: [0, 22, 40, 0, 15, -66, 56], scene: true },
  { name: "roof-and-screen", path: "/", query: DAY, look: [0, 5, 20, 0, 43, -40, 52], scene: true },
  { name: "pitch-level", path: "/", query: DAY, look: [-30, 1.7, 0, 40, 9, -6, 55], scene: true },
  { name: "night-overview", path: "/", query: NIGHT, look: [0, 23.5, 64, 0, 9.5, 0, 52], scene: true },
  { name: "night-pitch-level", path: "/", query: NIGHT, look: [-30, 1.7, 0, 40, 9, -6, 55], scene: true },
  { name: "day-roof-closed", path: "/", query: DAY.replace("roof=open", "roof=closed"), look: [58, 26, 46, 0, 8, 0, 50], scene: true },
  { name: "about-panel", path: "/about", query: DAY },
  { name: "projects-panel", path: "/projects", query: DAY },
  { name: "experience-panel", path: "/experience", query: DAY },
  { name: "skills-panel", path: "/skills", query: DAY },
  { name: "awards-panel", path: "/awards", query: DAY },
  { name: "news-panel", path: "/news", query: DAY },
  { name: "resume-panel", path: "/resume", query: DAY },
  { name: "contact-panel", path: "/contact", query: DAY },
  { name: "github-panel", path: "/github", query: DAY },
  { name: "live-panel", path: "/live", query: DAY },
  { name: "phone-match", path: "/match", query: "", viewport: PHONE, flat: true },
  { name: "phone-tour", path: "/", query: `view=tour&${DAY}`, viewport: PHONE },
];

const HIDE_PAGE = `body * { visibility: hidden !important; } canvas { visibility: visible !important; }`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  const [base, folder, only] = process.argv.slice(2);
  if (!base || !folder) {
    console.error("Usage: npm run shots -- <address> <folder> [name,name,...]");
    process.exit(1);
  }
  const executablePath = BROWSERS.find((p) => existsSync(p));
  if (!executablePath) {
    console.error("No Chrome or Edge found. Set SHOTS_BROWSER to the browser's path.");
    process.exit(1);
  }
  const wanted = only ? new Set(only.split(",")) : null;
  const list = SHOTS.filter((shot) => !wanted || wanted.has(shot.name));
  await mkdir(folder, { recursive: true });

  const launch = () =>
    puppeteer.launch({
      executablePath,
      headless: true,
      args: ["--ignore-gpu-blocklist", "--enable-gpu", "--hide-scrollbars", "--mute-audio"],
      defaultViewport: DESKTOP,
    });
  let browser = await launch();

  const problems = [];
  // A shot is tried twice: now and then the browser gives up part-way
  // through a long run, and a fresh one carries on
  const queue = list.map((shot) => ({ shot, tries: 0 }));
  while (queue.length) {
    const { shot, tries } = queue.shift();
    if (!browser.connected) browser = await launch();
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(String(error.message).slice(0, 200)));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text().slice(0, 200));
    });
    await page.setViewport({ ...(shot.viewport ?? DESKTOP), deviceScaleFactor: 1 });
    const url = `${base.replace(/\/$/, "")}${shot.path}${shot.query ? `?${shot.query}` : ""}`;
    const started = Date.now();
    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
      if (!shot.flat) {
        await page.waitForFunction((start) => window.__world && window.__world.getState().worldReady && (start || window.__world.getState().introDone), { timeout: Number(process.env.SHOTS_TIMEOUT ?? 90_000), polling: 250 }, Boolean(shot.start));
        // A slow first second can make the site lower its own quality; put it back
        await page.evaluate(() => window.__world.getState().setQuality("high"));
        // SHOTS_LOOK: try a different camera position, as x,y,z,targetX,targetY,targetZ,fieldOfView
        const look = process.env.SHOTS_LOOK ? process.env.SHOTS_LOOK.split(",").map(Number) : shot.look;
        if (look) await page.evaluate((pose) => window.__look(...pose), look);
        // SHOTS_EVAL: a line of code to run in the page first, for trying a setting out
        if (process.env.SHOTS_EVAL) await page.evaluate(process.env.SHOTS_EVAL);
        if (shot.scene) await page.addStyleTag({ content: HIDE_PAGE });
        await sleep(shot.settle ?? 3500);
        await page.evaluate(() => window.__world.getState().setQuality("high"));
        await sleep(1200);
      } else {
        await sleep(1500);
      }
      const file = path.join(folder, `${shot.name}.jpg`);
      await page.screenshot({ path: file, type: "jpeg", quality: 90 });
      const seconds = ((Date.now() - started) / 1000).toFixed(1);
      console.log(`${shot.name.padEnd(20)} ${seconds}s${errors.length ? `  (${errors.length} console errors)` : ""}`);
      if (errors.length) problems.push({ shot: shot.name, errors: [...new Set(errors)].slice(0, 4) });
    } catch (error) {
      if (tries === 0) {
        console.log(`${shot.name.padEnd(20)} trying again: ${String(error.message).slice(0, 80)}`);
        queue.unshift({ shot, tries: 1 });
      } else {
        console.log(`${shot.name.padEnd(20)} FAILED: ${String(error.message).slice(0, 160)}`);
        // what the page itself complained about usually explains the failure
        problems.push({ shot: shot.name, errors: [String(error.message).slice(0, 200), ...new Set(errors)].slice(0, 6) });
      }
    }
    await page.close().catch(() => {});
  }

  await browser.close().catch(() => {});
  if (problems.length) {
    console.log("\nProblems:");
    for (const problem of problems) console.log(` ${problem.shot}: ${problem.errors.join(" | ")}`);
  }
}

main();
