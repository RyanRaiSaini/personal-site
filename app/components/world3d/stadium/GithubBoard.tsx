"use client";

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { MeshBasicMaterial, MeshStandardMaterial } from "three";
import { githubText, profile } from "../../../data/portfolio";
import type { Contributions } from "../../../lib/github";
import { useWorld } from "../../../lib/store";
import { canvasTexture, roundRect } from "../textures/canvas";
import { useDisplayFont } from "../textures/text";
import { BOWL, SECOND_TIER } from "./dims";

// ------------------------------------------------------------------
// The GitHub scoreboard: an LED board hung under the front edge of the
// main stand's second tier, the way grounds hang a board off a
// balcony. It shows the year's contributions, the best day, the days
// with a commit, and the last few weeks as a grid of gold squares.
//
// The figures come from the same data as the GitHub section
// (app/api/contributions/route.ts); the words from `githubText.board`
// in app/data/portfolio.ts.
// ------------------------------------------------------------------

const WIDTH = 20; // metres
const HEIGHT = 3;
const FRAME = 0.18; // the dark frame round the screen
const PIXELS = 120; // canvas pixels per metre

// From "nothing that day" to "a lot"
const LEVELS = ["#1a2236", "#5b4a1e", "#9a7a2c", "#d4ab48", "#ffd978"];
const GOLD = "#e3bb5a";
const INK = "#f4f6fb";
const SOFT = "#93a0bd";

function paint(ctx: CanvasRenderingContext2D, w: number, h: number, family: string, data: Contributions | null) {
  const text = githubText.board;
  // the screen
  const glow = ctx.createLinearGradient(0, 0, 0, h);
  glow.addColorStop(0, "#0b1224");
  glow.addColorStop(1, "#060a16");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);
  // a gold rule along the top and bottom
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 0, w, 6);
  ctx.fillRect(0, h - 6, w, 6);

  const pad = 70;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  // left: the title and the year's total
  ctx.fillStyle = GOLD;
  ctx.font = `700 54px ${family}`;
  ctx.fillText(`${text.title.toUpperCase()}  ·  @${profile.githubUser.toUpperCase()}`, pad, 92);

  if (!data) {
    ctx.fillStyle = SOFT;
    ctx.font = `700 64px ${family}`;
    ctx.fillText(text.loading.toUpperCase(), pad, 220);
    return;
  }

  const days = data.levels.flat();
  const active = days.filter((level) => level > 0).length;
  const best = Math.max(0, ...data.counts.flat());

  ctx.fillStyle = INK;
  ctx.font = `800 170px ${family}`;
  ctx.fillText(String(data.total), pad - 6, 268);
  const totalWidth = ctx.measureText(String(data.total)).width;
  ctx.fillStyle = SOFT;
  ctx.font = `700 50px ${family}`;
  ctx.fillText(text.total.toUpperCase(), pad + totalWidth + 30, 262);

  // middle: two smaller figures
  const middle = w * 0.47;
  const figure = (value: number, label: string, x: number) => {
    ctx.fillStyle = INK;
    ctx.font = `800 110px ${family}`;
    ctx.fillText(String(value), x, 232);
    ctx.fillStyle = SOFT;
    ctx.font = `700 46px ${family}`;
    ctx.fillText(label.toUpperCase(), x, 290);
  };
  figure(best, text.best, middle);
  figure(active, text.active, middle + 340);

  // right: the last few weeks, one column a week, Sunday at the top
  const weeks = data.levels.slice(-githubText.recentWeeks);
  const cell = 30;
  const gap = 8;
  const gridWidth = weeks.length * (cell + gap) - gap;
  const gridHeight = 7 * (cell + gap) - gap;
  const gx = w - pad - gridWidth;
  const gy = 70 + (h - 70 - gridHeight) / 2 + 6;
  ctx.fillStyle = SOFT;
  ctx.font = `700 44px ${family}`;
  ctx.textAlign = "right";
  ctx.fillText(text.recent.toUpperCase(), w - pad, 92);
  weeks.forEach((week, x) =>
    week.forEach((level, y) => {
      if (level < 0) return;
      ctx.fillStyle = LEVELS[Math.min(4, level)];
      roundRect(ctx, gx + x * (cell + gap), gy + y * (cell + gap), cell, cell, 5);
      ctx.fill();
    }),
  );
}

export default function GithubBoard() {
  const data = useWorld((s) => s.contributions);
  const family = useDisplayFont();
  const invalidate = useThree((s) => s.invalidate);

  const screen = useMemo(() => {
    if (!family) return null;
    const texture = canvasTexture(WIDTH * PIXELS, HEIGHT * PIXELS, (ctx, w, h) => paint(ctx, w, h, family, data), { repeat: false, anisotropy: 8 });
    // a lit screen: unaffected by the day's light, a little brighter than white
    const material = new MeshBasicMaterial({ map: texture, toneMapped: false });
    material.color.setScalar(1.05);
    return material;
  }, [family, data]);

  const frame = useMemo(() => new MeshStandardMaterial({ color: "#0c0f15", roughness: 0.55, metalness: 0.35 }), []);

  useEffect(() => {
    invalidate();
    return () => {
      screen?.map?.dispose();
      screen?.dispose();
    };
  }, [screen, invalidate]);
  useEffect(() => () => frame.dispose(), [frame]);

  // on the main stand (-Z), facing the pitch, its top just under the slab
  const z = -BOWL.hz - SECOND_TIER.d + 0.35;
  const y = SECOND_TIER.bottom - FRAME - HEIGHT / 2 - 0.05;

  return (
    <group position={[0, y, z]}>
      <mesh material={frame} position={[0, 0, -0.16]}>
        <boxGeometry args={[WIDTH + FRAME * 2, HEIGHT + FRAME * 2, 0.3]} />
      </mesh>
      {screen && (
        <mesh material={screen} position={[0, 0, 0.002]}>
          <planeGeometry args={[WIDTH, HEIGHT]} />
        </mesh>
      )}
    </group>
  );
}
