// Turns original photos into small web images.
//
//   node scripts/optimize-photos.mjs "<folder with the originals>"
//
// For every entry in PHOTOS below it writes
//   public/photos/<slug>.webp          (up to 1600 px on the long edge)
//   public/photos/thumbs/<slug>.webp   (up to 640 px)
// and records each photo's size and a tiny blurred placeholder in
// app/data/photos.generated.json. Location data and other metadata in
// the originals are stripped. The originals stay out of the repo.
//
// To add a photo: put the original in the folder, add a line here, run
// the script, then give it a caption in app/data/photos.ts.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const PHOTOS = [
  // All-Star 2026 team photos
  { file: "7744a9af-cc91-43b6-9225-819fb58ddec1.jpg", slug: "allstar-team-stars" },
  { file: "bfeafe21-e92e-4b67-9353-51d673963c96.jpg", slug: "allstar-team-world" },
  { file: "e2a0aa36-ffa6-4b70-828b-ea1ae2bb65d1.jpg", slug: "allstar-team-stripes" },
  // Media Day
  { file: "IMG_4112.JPG", slug: "media-day-autograph" },
  { file: "IMG_4199.JPG", slug: "media-day-1" },
  { file: "IMG_4237.JPG", slug: "media-day-2" },
  { file: "IMG_4247.JPEG", slug: "media-day-3" },
  // In the arena
  { file: "IMG_0073.JPEG", slug: "arena" },
  // Meeting the Rising Stars
  { file: "IMG_5462.JPEG", slug: "rising-stars-1" },
  { file: "IMG_5488.JPEG", slug: "rising-stars-2" },
  { file: "IMG_5499.JPEG", slug: "rising-stars-3" },
  { file: "IMG_5528.JPEG", slug: "rising-stars-4" },
  // All-Star weekend
  { file: "714c35be-f618-471a-8286-77a76bbfe32f.jpg", slug: "allstar-lounge" },
  // Portraits (downloaded separately, see docs/DEVLOG.md)
  { file: "headshot.png", slug: "headshot", optional: true },
  { file: "starboard-ryan.png", slug: "starboard-ryan", optional: true },
];

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = process.argv[2];
if (!source) {
  console.error('Usage: node scripts/optimize-photos.mjs "<folder with the originals>"');
  process.exit(1);
}

const outDir = path.join(root, "public", "photos");
const thumbDir = path.join(outDir, "thumbs");
await mkdir(thumbDir, { recursive: true });

const manifest = {};
for (const { file, slug, optional } of PHOTOS) {
  const input = path.join(source, file);
  let image;
  try {
    // .rotate() with no angle applies the camera's orientation tag
    image = sharp(input).rotate();
    await image.metadata();
  } catch (error) {
    if (optional) {
      console.warn(`skipped ${file} (not found)`);
      continue;
    }
    throw new Error(`Could not read ${input}: ${error.message}`);
  }

  const full = await image
    .clone()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(path.join(outDir, `${slug}.webp`));

  await image
    .clone()
    .resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 74 })
    .toFile(path.join(thumbDir, `${slug}.webp`));

  const blur = await image.clone().resize({ width: 16, height: 16, fit: "inside" }).webp({ quality: 40 }).toBuffer();

  manifest[slug] = {
    width: full.width,
    height: full.height,
    blur: `data:image/webp;base64,${blur.toString("base64")}`,
  };
  console.log(`${slug}: ${full.width}x${full.height}, ${(full.size / 1024).toFixed(0)} KB`);
}

await writeFile(path.join(root, "app", "data", "photos.generated.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`\nWrote ${Object.keys(manifest).length} photos and app/data/photos.generated.json`);
