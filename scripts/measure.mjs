// ------------------------------------------------------------------
// Measures what the 3D stadium costs to run, on this computer.
//
//   npm run measure -- <address> [seconds per reading]
//
//   npm run measure -- http://localhost:3000
//   npm run measure -- https://ryansaini.vercel.app 8
//
// It opens the site with no window, in a copy of Chrome or Edge that is
// already installed, and reads for each situation:
//
//   drawn     pictures of the stadium drawn per second (a screen shows 60 at most)
//   busy      share of the time the page's main thread was working
//   script    the part of that spent running the site's own code
//   style     the part spent working out styles and layout
//   draws     separate drawing steps sent to the graphics card per picture
//   triangles drawn per picture
//
// The numbers belong to the machine they were taken on and to whatever
// else it was doing at the time, so compare runs made the same way.
// For a production reading, run `npm run build && npm run start` and
// point this at that; the development server is slower.
//
// Other window sizes: MEASURE_WIDTH, MEASURE_HEIGHT and MEASURE_DPR
// (the screen's scale, 1.25 or 1.5 on many laptops).
// ------------------------------------------------------------------

import { existsSync } from "node:fs";
import os from "node:os";
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

const [base, secondsArg] = process.argv.slice(2);
if (!base) {
  console.error("Usage: npm run measure -- <address> [seconds per reading]");
  process.exit(1);
}
const SECONDS = Number(secondsArg ?? 6);
const VIEWPORT = { width: Number(process.env.MEASURE_WIDTH ?? 1280), height: Number(process.env.MEASURE_HEIGHT ?? 720), deviceScaleFactor: Number(process.env.MEASURE_DPR ?? 1) };
const EXTRA = process.env.MEASURE_QUERY ? `&${process.env.MEASURE_QUERY}` : "";
const DAY = `nointro=1&roof=open&time=14:00&weather=clear${EXTRA}`;
const NIGHT = `nointro=1&roof=closed&time=22:00&weather=clear${EXTRA}`;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// what: a label. path + query: the page.
// pointer: keep the pointer moving, as someone looking around does.
// rest: leave the page alone for this many seconds first.
const ALL = [
  { what: "overview, pointer moving", path: "/", query: DAY, pointer: true },
  { what: "overview at night, pointer moving", path: "/", query: NIGHT, pointer: true },
  { what: "overview, hands off", path: "/", query: DAY },
  { what: "overview, left alone 60 s", path: "/", query: DAY, rest: 60 },
  { what: "About, pointer moving", path: "/about", query: DAY, pointer: true },
  { what: "About, left alone 25 s", path: "/about", query: DAY, rest: 25 },
  { what: "flat view (no 3D)", path: "/match", query: "", flat: true },
];
// MEASURE_ONLY="overview, pointer;About" picks the situations whose label starts that way
const only = process.env.MEASURE_ONLY?.split(";");
const SITUATIONS = only ? ALL.filter((s) => only.some((o) => s.what.startsWith(o))) : ALL;

const browser = await puppeteer.launch({
  executablePath: BROWSERS.find((p) => existsSync(p)),
  headless: true,
  args: ["--ignore-gpu-blocklist", "--enable-gpu", "--hide-scrollbars", "--mute-audio"],
  defaultViewport: VIEWPORT,
});

async function reading(page, client, situation) {
  const metrics = async () => Object.fromEntries((await client.send("Performance.getMetrics")).metrics.map((m) => [m.name, m.value]));

  // a pointer wandering round the middle of the window
  let moving = Boolean(situation.pointer);
  const wander = (async () => {
    let step = 0;
    while (moving) {
      step += 1;
      await page.mouse.move(VIEWPORT.width * (0.5 + 0.2 * Math.cos(step / 5)), VIEWPORT.height * (0.4 + 0.15 * Math.sin(step / 7))).catch(() => {});
      await sleep(120);
    }
  })();
  if (moving) await sleep(800);

  // The site counts the pictures it draws (window.__activity.frames);
  // the graphics counters are left running across them.
  const start = await page.evaluate(() => {
    const gl = window.__gl;
    if (gl) {
      gl.info.autoReset = false;
      gl.info.reset();
    }
    return window.__activity?.frames ?? 0;
  });
  const before = await metrics();
  const started = Date.now();
  await sleep(SECONDS * 1000);
  const after = await metrics();
  const wall = (Date.now() - started) / 1000;
  const end = await page.evaluate(() => {
    const gl = window.__gl;
    if (!gl) return null;
    const context = gl.getContext();
    const info = context.getExtension("WEBGL_debug_renderer_info");
    const result = {
      frames: window.__activity?.frames ?? 0,
      pace: window.__activity?.pace ?? "-",
      calls: gl.info.render.calls,
      triangles: gl.info.render.triangles,
      chip: info ? context.getParameter(info.UNMASKED_RENDERER_WEBGL) : "not reported",
      quality: window.__world.getState().quality,
      pixels: `${gl.domElement.width} x ${gl.domElement.height}`,
    };
    gl.info.autoReset = true;
    return result;
  });
  moving = false;
  await wander;

  const drawn = end ? end.frames - start : 0;
  return {
    drawn: end ? drawn / wall : null,
    busy: ((after.TaskDuration - before.TaskDuration) / wall) * 100,
    script: ((after.ScriptDuration - before.ScriptDuration) / wall) * 100,
    style: ((after.LayoutDuration + after.RecalcStyleDuration - before.LayoutDuration - before.RecalcStyleDuration) / wall) * 100,
    draws: end && drawn ? Math.round(end.calls / drawn) : null,
    triangles: end && drawn ? Math.round(end.triangles / drawn) : null,
    pace: end?.pace,
    chip: end?.chip,
    quality: end?.quality,
    pixels: end?.pixels,
  };
}

console.log(`Computer: ${os.cpus()[0].model.trim()}, ${os.cpus().length} threads, ${Math.round(os.totalmem() / 2 ** 30)} GB memory, ${os.type()} ${os.release()}`);
console.log(`Window:   ${VIEWPORT.width} x ${VIEWPORT.height} at ${VIEWPORT.deviceScaleFactor}x, ${SECONDS} s per reading`);

let chip = null;
const rows = [];
for (const situation of SITUATIONS) {
  const page = await browser.newPage();
  const client = await page.createCDPSession();
  await client.send("Performance.enable");
  const url = `${base.replace(/\/$/, "")}${situation.path}${situation.query ? `?${situation.query}` : ""}`;
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    if (!situation.flat) await page.waitForFunction(() => window.__world && window.__world.getState().worldReady && window.__world.getState().introDone, { timeout: 90_000, polling: 250 });
    // let the first flight and any loading finish
    await sleep(6000);
    if (situation.rest) await sleep(situation.rest * 1000);
    const r = await reading(page, client, situation);
    if (r.chip && !chip) chip = r.chip;
    rows.push({ what: situation.what, ...r });
  } catch (error) {
    rows.push({ what: situation.what, failed: String(error.message).slice(0, 120) });
  }
  await page.close();
}
await browser.close();

console.log(`Graphics: ${chip ?? "not reported"}\n`);
const pad = (text, n) => String(text).padEnd(n);
const pct = (v) => `${v.toFixed(0)}%`;
console.log(`${pad("situation", 36)}${pad("drawn/s", 9)}${pad("busy", 7)}${pad("script", 8)}${pad("style", 7)}${pad("draws", 7)}${pad("triangles", 11)}${pad("pace", 9)}${pad("quality", 9)}pixels`);
for (const r of rows) {
  if (r.failed) {
    console.log(`${pad(r.what, 36)}FAILED: ${r.failed}`);
    continue;
  }
  console.log(
    `${pad(r.what, 36)}${pad(r.drawn === null ? "-" : r.drawn.toFixed(1), 9)}${pad(pct(r.busy), 7)}${pad(pct(r.script), 8)}${pad(pct(r.style), 7)}${pad(r.draws ?? "-", 7)}${pad(r.triangles?.toLocaleString() ?? "-", 11)}${pad(r.pace ?? "-", 9)}${pad(r.quality ?? "-", 9)}${r.pixels ?? "-"}`,
  );
}
