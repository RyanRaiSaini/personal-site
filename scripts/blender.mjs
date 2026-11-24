// ------------------------------------------------------------------
// Runs Blender for the npm build scripts (stadium:build, players:build,
// crowd:build and the rest), finding two things they need:
//
//   Blender     $BLENDER if set, else `blender` if it is on the path, else
//               the newest copy under C:/Program Files/Blender Foundation
//   {work}      the folder of source files kept out of the repo (the scan,
//               the Mixamo downloads): $STADIUM_WORK if set, else the first
//               of ../stadium-work or ~/stadium-work that exists
//
// Every "{work}" in the arguments is replaced by that folder.
// ------------------------------------------------------------------

import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

function findWork() {
  const candidates = [process.env.STADIUM_WORK, path.resolve("../stadium-work"), path.join(os.homedir(), "stadium-work")].filter(Boolean);
  const found = candidates.find((dir) => existsSync(dir));
  if (!found) {
    console.error(`No stadium-work folder found (tried ${candidates.join(", ")}). Set STADIUM_WORK to its path.`);
    process.exit(1);
  }
  return found;
}

function findBlender() {
  if (process.env.BLENDER) return process.env.BLENDER;
  const onPath = spawnSync(process.platform === "win32" ? "where" : "which", ["blender"], { encoding: "utf8" });
  if (onPath.status === 0 && onPath.stdout.trim()) return onPath.stdout.trim().split(/\r?\n/)[0];
  const root = "C:/Program Files/Blender Foundation";
  if (existsSync(root)) {
    const versions = readdirSync(root)
      .filter((name) => existsSync(path.join(root, name, "blender.exe")))
      .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }));
    if (versions.length) return path.join(root, versions[0], "blender.exe");
  }
  console.error("Blender not found. Install it, or set BLENDER to its path.");
  process.exit(1);
}

const args = process.argv.slice(2);
const work = args.some((a) => a.includes("{work}")) ? findWork() : "";
const run = spawnSync(
  findBlender(),
  args.map((a) => a.replaceAll("{work}", work)),
  { stdio: "inherit" },
);
process.exit(run.status ?? 1);
