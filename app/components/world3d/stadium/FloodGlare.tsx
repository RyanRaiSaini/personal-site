"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Points, PointsMaterial } from "three";
import { atmo } from "../atmosphere/state";
import { canvasTexture } from "../textures/canvas";
import { outline } from "./path";

// ------------------------------------------------------------------
// The floodlights' glare: a soft halo round every lamp in the ring under
// the roof, as a camera sees a lamp at night (blazing, its light
// spilling into the haze round it). One set of points, drawn added to
// the picture, at every quality level; the glow pass at "high" adds to
// it. By day it fades to almost nothing.
//
// The lamp bar is FLOODS in blender/stadium/params.py, the same line the
// beams start from (FloodBeams.tsx). To make the glare bigger or
// stronger, change GLARE.
// ------------------------------------------------------------------

const BAR = { d: -2.4, y: 42.0 };
const GLARE = { spacing: 3.4, size: 9, strength: 0.9 };

function lampPositions(): Float32Array {
  const ring = outline(BAR.d, 16);
  const points: number[] = [];
  let carried = 0;
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i];
    const b = ring[(i + 1) % ring.length];
    const length = Math.hypot(b.x - a.x, b.z - a.z);
    let at = GLARE.spacing - carried;
    while (at <= length) {
      const t = at / length;
      points.push(a.x + (b.x - a.x) * t, BAR.y, a.z + (b.z - a.z) * t);
      at += GLARE.spacing;
    }
    carried = length - (at - GLARE.spacing);
  }
  return new Float32Array(points);
}

// a round glow: a hot centre, a soft spill, and faint streaks
function glareTexture() {
  return canvasTexture(
    128,
    128,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      glow.addColorStop(0, "rgba(255,255,255,1)");
      glow.addColorStop(0.08, "rgba(255,252,240,0.9)");
      glow.addColorStop(0.3, "rgba(220,230,255,0.22)");
      glow.addColorStop(1, "rgba(200,215,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = "rgba(230,238,255,0.18)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(4, h / 2);
      ctx.lineTo(w - 4, h / 2);
      ctx.stroke();
    },
    { repeat: false },
  );
}

export default function FloodGlare() {
  const { points, material } = useMemo(() => {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(lampPositions(), 3));
    const material = new PointsMaterial({ map: glareTexture(), size: GLARE.size, sizeAttenuation: true, transparent: true, depthWrite: false, blending: AdditiveBlending, toneMapped: false, opacity: 0 });
    const points = new Points(geometry, material);
    points.name = "FloodGlare";
    points.renderOrder = 6;
    points.frustumCulled = false;
    return { points, material };
  }, []);

  useEffect(
    () => () => {
      points.geometry.dispose();
      material.map?.dispose();
      material.dispose();
    },
    [points, material],
  );

  useFrame(() => {
    // strong under the floodlights, a faint glint by day
    const night = Math.min(1, atmo.floodlights);
    material.opacity = GLARE.strength * (0.12 + 0.88 * night) * (1 - 0.6 * Math.min(1, atmo.outdoor));
    points.visible = material.opacity > 0.01;
  });

  return <primitive object={points} />;
}
