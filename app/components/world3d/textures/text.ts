"use client";

import { useEffect, useState } from "react";
import { displayFamily } from "../../../fonts";
import { canvasTexture } from "./canvas";

// Text in the 3D world (the big screen, the pitch-side boards, shirt
// names) is painted onto canvases with the site's heading font. The
// font has to finish loading before anything is painted with it.

export function useDisplayFont(): string | null {
  const [family, setFamily] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    const ready = () => alive && setFamily(displayFamily);
    if (typeof document === "undefined" || !document.fonts) {
      ready();
      return;
    }
    Promise.all([document.fonts.load(`700 64px ${displayFamily}`), document.fonts.load(`800 64px ${displayFamily}`)])
      .then(ready)
      .catch(ready);
    return () => {
      alive = false;
    };
  }, []);
  return family;
}

export type StripSegment = {
  text: string;
  color?: string;
};

// A long strip of text for a scrolling LED board. Returns the texture
// and how many pixels of it were used, so it can repeat seamlessly.
export function ledStrip(family: string, segments: StripSegment[], options: { height: number; pixelsPerUnit: number; background?: string; gap?: number; weight?: number }) {
  const { height, background = "#04070f", gap = 1.2, weight = 700 } = options;
  const fontSize = Math.round(height * 0.62);
  const font = `${weight} ${fontSize}px ${family}`;

  // Measure first, so the canvas is exactly one repeat wide
  const probe = document.createElement("canvas").getContext("2d");
  let width = 0;
  const widths: number[] = [];
  if (probe) {
    probe.font = font;
    for (const segment of segments) {
      const w = probe.measureText(segment.text).width;
      widths.push(w);
      width += w + fontSize * gap;
    }
  }
  const canvasWidth = Math.min(8192, Math.max(64, Math.ceil(width)));
  const scale = canvasWidth / Math.max(1, width);

  const texture = canvasTexture(
    canvasWidth,
    height,
    (ctx, w, h) => {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, w, h);
      ctx.font = font;
      ctx.textBaseline = "middle";
      let x = (fontSize * gap * scale) / 2;
      segments.forEach((segment, i) => {
        ctx.fillStyle = segment.color ?? "#ffffff";
        ctx.save();
        ctx.translate(x, h / 2 + fontSize * 0.04);
        ctx.scale(scale, 1);
        ctx.fillText(segment.text, 0, 0);
        ctx.restore();
        x += (widths[i] + fontSize * gap) * scale;
      });
    },
    { anisotropy: 16 },
  );

  // World length of one repeat, if `height` pixels cover `1 / pixelsPerUnit` units
  const worldLength = canvasWidth / options.pixelsPerUnit;
  return { texture, worldLength };
}
