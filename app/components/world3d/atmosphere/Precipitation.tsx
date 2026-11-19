"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, type LineBasicMaterial, type LineSegments, type Points, type PointsMaterial } from "three";
import { useWorld } from "../../../lib/store";
import { canvasTexture, seeded } from "../textures/canvas";
import { BOWL, ROOF } from "../stadium/dims";
import { atmo } from "./state";

// Rain and snow. When it is raining or snowing in Brampton and the
// roof is open, it comes down through the opening onto the pitch.
// Closing the roof shuts it out.

const TOP = ROOF.innerY + 6;
const HALF_X = BOWL.hx + ROOF.openingInset - 2; // the footprint of the roof opening
const HALF_Z = BOWL.hz + ROOF.openingInset - 2;
const STREAK = 1.1; // length of a raindrop's streak, metres

const COUNT = { low: 500, medium: 1300, high: 2400 } as const;

function flakeTexture() {
  return canvasTexture(
    32,
    32,
    (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.5, "rgba(255,255,255,0.6)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    { repeat: false },
  );
}

export default function Precipitation() {
  const quality = useWorld((s) => s.quality);
  const count = COUNT[quality];
  const rain = useRef<LineSegments>(null);
  const snow = useRef<Points>(null);

  const data = useMemo(() => {
    const rand = seeded(4242);
    const drops = new Float32Array(count * 3); // x, y, z of each drop
    const speed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      drops[i * 3] = (rand() * 2 - 1) * HALF_X;
      drops[i * 3 + 1] = rand() * TOP;
      drops[i * 3 + 2] = (rand() * 2 - 1) * HALF_Z;
      speed[i] = 0.75 + rand() * 0.5;
    }
    const streaks = new BufferGeometry();
    streaks.setAttribute("position", new BufferAttribute(new Float32Array(count * 6), 3));
    const flakes = new BufferGeometry();
    flakes.setAttribute("position", new BufferAttribute(new Float32Array(count * 3), 3));
    return { drops, speed, streaks, flakes, sprite: flakeTexture() };
  }, [count]);

  useEffect(() => {
    return () => {
      data.streaks.dispose();
      data.flakes.dispose();
      data.sprite.dispose();
    };
  }, [data]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    // nothing falls through a closed roof
    const open = 1 - atmo.roof * atmo.roof * (3 - 2 * atmo.roof);
    const amount = atmo.precipitation * open;
    const snowing = atmo.snow > 0.5;
    if (rain.current) rain.current.visible = amount > 0.02 && !snowing;
    if (snow.current) snow.current.visible = amount > 0.02 && snowing;
    if (amount <= 0.02) return;

    const fall = snowing ? 2.6 : 30;
    const { drops, speed } = data;
    const streak = data.streaks.getAttribute("position") as BufferAttribute;
    const flake = data.flakes.getAttribute("position") as BufferAttribute;
    const line = streak.array as Float32Array;
    const dot = flake.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const p = i * 3;
      drops[p + 1] -= fall * speed[i] * dt;
      if (snowing) {
        // snow wanders on the way down
        drops[p] += Math.sin(atmo.time * 0.9 + i) * 0.4 * dt;
        drops[p + 2] += Math.cos(atmo.time * 0.7 + i * 1.3) * 0.4 * dt;
      }
      if (drops[p + 1] < 0) drops[p + 1] += TOP;
      if (snowing) {
        dot[p] = drops[p];
        dot[p + 1] = drops[p + 1];
        dot[p + 2] = drops[p + 2];
      } else {
        const q = i * 6;
        line[q] = drops[p];
        line[q + 1] = drops[p + 1];
        line[q + 2] = drops[p + 2];
        line[q + 3] = drops[p] + 0.06;
        line[q + 4] = drops[p + 1] + STREAK;
        line[q + 5] = drops[p + 2];
      }
    }

    // brighter under floodlights, so it glitters at night
    const glint = 0.25 + 0.5 * atmo.floodlights + 0.25 * atmo.outdoor;
    if (snowing) {
      flake.needsUpdate = true;
      if (snow.current) (snow.current.material as PointsMaterial).opacity = Math.min(1, amount * 1.2) * 0.9;
    } else {
      streak.needsUpdate = true;
      if (rain.current) (rain.current.material as LineBasicMaterial).opacity = Math.min(1, amount * 1.1) * glint * 0.55;
    }
  });

  return (
    <group>
      <lineSegments ref={rain} geometry={data.streaks} frustumCulled={false} visible={false}>
        <lineBasicMaterial color="#cfe0ff" transparent opacity={0.3} depthWrite={false} blending={AdditiveBlending} fog={false} />
      </lineSegments>
      <points ref={snow} geometry={data.flakes} frustumCulled={false} visible={false}>
        <pointsMaterial map={data.sprite} color="#ffffff" size={0.34} sizeAttenuation transparent opacity={0.9} depthWrite={false} fog={false} />
      </points>
    </group>
  );
}
