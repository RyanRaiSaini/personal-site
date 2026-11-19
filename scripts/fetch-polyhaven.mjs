// ------------------------------------------------------------------
// Fetches the free Poly Haven textures and sky the stadium uses.
//
//   npm run stadium:assets
//
// Poly Haven lists every file of every asset through its public API
// (https://github.com/Poly-Haven/Public-API). This asks it for the few
// files named below, saves the originals outside the repository (they
// are large), and writes small web copies into public/stadium/textures.
//
// Everything on Poly Haven is CC0: free for any use, no credit needed.
// The list of what was taken is kept in docs/redesign/ASSETS.md.
// ------------------------------------------------------------------

import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const API = "https://api.polyhaven.com";
const AGENT = "stadium-asset-fetch/1.0";

// Where the untouched originals are kept (override with STADIUM_WORK)
const WORK = process.env.STADIUM_WORK ?? path.resolve("..", "..", "..", "..", "stadium-work");
const ORIGINALS = path.join(WORK, "polyhaven");
const WEB = "public/stadium/textures";

// asset id, the maps wanted, and the size
//   diff = colour, nor = surface bumps, arm = occlusion / roughness / metalness packed together
const TEXTURES = [
  { id: "brushed_concrete", maps: ["diff", "nor", "arm"], size: "1k", use: "the steps and walkways" },
  { id: "painted_concrete_02", maps: ["diff", "nor", "arm"], size: "1k", use: "walls, tier fronts and undersides" },
  { id: "corrugated_iron_02", maps: ["nor", "arm"], size: "1k", use: "the roof's ceiling" },
  { id: "sparse_grass", maps: ["nor", "arm"], size: "1k", use: "fine relief on the pitch" },
];
const SKY = { id: "kloofendal_48d_partly_cloudy_puresky", size: "4k", use: "daylight and the sky seen through the roof" };

const MAP_KEYS = { diff: "Diffuse", nor: "nor_gl", arm: "arm" };

async function getJson(url) {
  const response = await fetch(url, { headers: { "User-Agent": AGENT } });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  return response.json();
}

async function download(url, file) {
  if (existsSync(file)) return false;
  const response = await fetch(url, { headers: { "User-Agent": AGENT } });
  if (!response.ok) throw new Error(`${url} answered ${response.status}`);
  await writeFile(file, Buffer.from(await response.arrayBuffer()));
  return true;
}

const mb = (bytes) => `${(bytes / 1048576).toFixed(1)} MB`;

async function main() {
  await mkdir(ORIGINALS, { recursive: true });
  await mkdir(WEB, { recursive: true });

  for (const texture of TEXTURES) {
    const files = await getJson(`${API}/files/${texture.id}`);
    for (const map of texture.maps) {
      const entry = files[MAP_KEYS[map]]?.[texture.size]?.jpg;
      if (!entry) throw new Error(`${texture.id} has no ${map} map at ${texture.size}`);
      const original = path.join(ORIGINALS, `${texture.id}_${map}_${texture.size}.jpg`);
      const fresh = await download(entry.url, original);
      const web = path.join(WEB, `${texture.id}_${map}.webp`);
      // surface-bump maps hold directions, not colour: keep them a little crisper
      await sharp(original).webp({ quality: map === "nor" ? 90 : 82, effort: 5 }).toFile(web);
      console.log(`${texture.id} ${map}: ${mb(entry.size)}${fresh ? " downloaded" : " (already had it)"} -> ${web}`);
    }
  }

  const sky = await getJson(`${API}/files/${SKY.id}`);
  const entry = sky.hdri?.[SKY.size]?.hdr;
  if (!entry) throw new Error(`${SKY.id} has no ${SKY.size} .hdr`);
  const original = path.join(ORIGINALS, `${SKY.id}_${SKY.size}.hdr`);
  const fresh = await download(entry.url, original);
  console.log(`${SKY.id}: ${mb(entry.size)}${fresh ? " downloaded" : " (already had it)"} -> ${original}`);
  console.log("\nNext: blender/sky.py turns the sky into the two small files the site loads.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
