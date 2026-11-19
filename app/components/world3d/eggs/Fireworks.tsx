"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, type Points } from "three";
import { useWorld } from "../../../lib/store";
import { atmo } from "../atmosphere/state";
import { rig } from "../camera/CameraRig";
import { canvasTexture } from "../textures/canvas";

// The fireworks (type "hala" anywhere, or the old cheat code:
// up up down down left right left right B A). Rockets burst over the
// pitch: above the roof when it is open, under it when it is closed.
// The camera tips back to watch.

const BURSTS = 16;
const PER_BURST = 110;
const COUNT = BURSTS * PER_BURST;
const COLORS = ["#ffd76a", "#ffffff", "#8fb4ff", "#c9a2ff", "#ff9d6a"].map((hex) => new Color(hex));

function sparkTexture() {
  return canvasTexture(
    64,
    64,
    (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.25, "rgba(255,255,255,0.8)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    },
    { repeat: false },
  );
}

export default function Fireworks() {
  const show = useWorld((s) => s.show);
  const active = show?.kind === "fireworks";
  const points = useRef<Points>(null);
  const directing = useRef(false);

  const data = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const colors = new Float32Array(COUNT * 3);
    const velocity = new Float32Array(COUNT * 3);
    const base = new Float32Array(COUNT * 3); // each spark's own colour
    const born = new Float32Array(BURSTS).fill(-100);
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    return { positions, colors, velocity, base, born, geometry, sprite: sparkTexture(), next: 0, lastLaunch: -10 };
  }, []);

  useEffect(() => {
    return () => {
      data.geometry.dispose();
      data.sprite.dispose();
    };
  }, [data]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const time = atmo.time;

    if (active && show) {
      const elapsed = (performance.now() - show.startedAt) / 1000;
      const underRoof = atmo.roof > 0.5;

      // launch a new burst every so often, until near the end
      if (elapsed < 7.2 && time - data.lastLaunch > 0.34) {
        data.lastLaunch = time;
        const b = data.next;
        data.next = (data.next + 1) % BURSTS;
        data.born[b] = time;
        const cx = (Math.random() - 0.5) * 80;
        const cy = underRoof ? 24 + Math.random() * 14 : 58 + Math.random() * 26;
        const cz = (Math.random() - 0.5) * 44;
        const tint = COLORS[Math.floor(Math.random() * COLORS.length)];
        const speed = underRoof ? 9 : 15;
        for (let i = 0; i < PER_BURST; i++) {
          const p = (b * PER_BURST + i) * 3;
          // a random direction on a sphere
          const u = Math.random() * 2 - 1;
          const a = Math.random() * Math.PI * 2;
          const r = Math.sqrt(1 - u * u);
          const v = speed * (0.55 + Math.random() * 0.55);
          data.positions[p] = cx;
          data.positions[p + 1] = cy;
          data.positions[p + 2] = cz;
          data.velocity[p] = r * Math.cos(a) * v;
          data.velocity[p + 1] = u * v;
          data.velocity[p + 2] = r * Math.sin(a) * v;
          data.base[p] = tint.r;
          data.base[p + 1] = tint.g;
          data.base[p + 2] = tint.b;
        }
        if (b % 3 === 0) useWorld.getState().cheer();
      }

      // tip the camera back to watch
      directing.current = true;
      rig.overrideStiffness = 2.2;
      rig.override = underRoof ? { position: [0, 4, 38], target: [0, 30, -6], fov: 62 } : { position: [0, 3.5, 30], target: [0, 70, -4], fov: 66 };
    } else if (directing.current) {
      directing.current = false;
      rig.override = null;
    }

    // every spark drifts, falls and fades
    let alive = false;
    for (let b = 0; b < BURSTS; b++) {
      const age = time - data.born[b];
      if (age < 0 || age > 2.6) {
        if (age > 2.6 && age < 3) {
          for (let i = 0; i < PER_BURST; i++) {
            const p = (b * PER_BURST + i) * 3;
            data.colors[p] = data.colors[p + 1] = data.colors[p + 2] = 0;
          }
        }
        continue;
      }
      alive = true;
      const fade = Math.pow(Math.max(0, 1 - age / 2.6), 1.6) * 2.4;
      for (let i = 0; i < PER_BURST; i++) {
        const p = (b * PER_BURST + i) * 3;
        data.velocity[p] *= 1 - dt * 1.1;
        data.velocity[p + 1] = data.velocity[p + 1] * (1 - dt * 1.1) - 6.5 * dt;
        data.velocity[p + 2] *= 1 - dt * 1.1;
        data.positions[p] += data.velocity[p] * dt;
        data.positions[p + 1] += data.velocity[p + 1] * dt;
        data.positions[p + 2] += data.velocity[p + 2] * dt;
        const flicker = 0.75 + Math.random() * 0.25;
        data.colors[p] = data.base[p] * fade * flicker;
        data.colors[p + 1] = data.base[p + 1] * fade * flicker;
        data.colors[p + 2] = data.base[p + 2] * fade * flicker;
      }
    }
    if (points.current) {
      points.current.visible = alive;
      if (alive) {
        data.geometry.attributes.position.needsUpdate = true;
        data.geometry.attributes.color.needsUpdate = true;
      }
    }
  });

  return (
    <points ref={points} geometry={data.geometry} frustumCulled={false} visible={false}>
      <pointsMaterial map={data.sprite} size={1.5} sizeAttenuation vertexColors transparent depthWrite={false} blending={AdditiveBlending} toneMapped={false} fog={false} />
    </points>
  );
}
