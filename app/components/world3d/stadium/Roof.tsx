"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BoxGeometry, Color, MeshStandardMaterial, type Group, type MeshBasicMaterial } from "three";
import { atmo } from "../atmosphere/state";
import { canvasTexture, grain } from "../textures/canvas";
import { BACK_WALL, BOWL, ROOF } from "./dims";
import { sweepBand, sweepBands } from "./path";

// The roof: a fixed ring over the stands and ten sliding panels that
// close the opening above the pitch. Closing the roof is the site's
// dark mode; the panels follow `atmo.roof` (0 open, 1 closed).

const OPEN_HX = BOWL.hx + ROOF.openingInset; // half-length of the opening
const OPEN_HZ = BOWL.hz + ROOF.openingInset;
const PANEL_WIDTH = (OPEN_HX * 2 + 3) / ROOF.panelCount;
const PANEL_DEPTH = OPEN_HZ * 2 + 5;
const PANEL_Y = ROOF.innerY + 1.1;
// Open panels park in a stack over the south end of the fixed roof
const PARKED_X = -OPEN_HX - PANEL_WIDTH / 2 - 2.5;

// Steel underside with ribs running from the back wall to the opening
function undersideTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#8f959e";
    ctx.fillRect(0, 0, w, h);
    // purlins, running round the ring
    ctx.fillStyle = "rgba(20,24,32,0.35)";
    for (let y = 0; y < h; y += 32) ctx.fillRect(0, y, w, 3);
    // a deep rib
    const rib = ctx.createLinearGradient(w / 2 - 14, 0, w / 2 + 14, 0);
    rib.addColorStop(0, "rgba(10,12,18,0)");
    rib.addColorStop(0.5, "rgba(10,12,18,0.75)");
    rib.addColorStop(1, "rgba(10,12,18,0)");
    ctx.fillStyle = rib;
    ctx.fillRect(w / 2 - 14, 0, 28, h);
    grain(ctx, w, h, 8, 31);
  });
}

// Thin light strips between the ribs, lit when the floodlights are on
function stripTexture() {
  return canvasTexture(256, 256, (ctx, w, h) => {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(8, 0, 5, h);
    ctx.fillRect(w - 13, 0, 5, h);
  });
}

function panelTexture() {
  return canvasTexture(128, 256, (ctx, w, h) => {
    ctx.fillStyle = "#e8ecf2";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(60,70,90,0.5)";
    ctx.fillRect(0, 0, w, 4);
    for (let y = 32; y < h; y += 32) ctx.fillRect(0, y, w, 2);
    ctx.fillRect(0, 0, 3, h);
    ctx.fillRect(w - 3, 0, 3, h);
    grain(ctx, w, h, 5, 41);
  });
}

// A row of floodlight lamps: bright dots on a dark bar
function lampTexture() {
  return canvasTexture(64, 32, (ctx, w, h) => {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);
    const dot = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, 13);
    dot.addColorStop(0, "#ffffff");
    dot.addColorStop(0.5, "#dfe9ff");
    dot.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = dot;
    ctx.fillRect(0, 0, w, h);
  });
}

function easeInOut(t: number) {
  return t * t * (3 - 2 * t);
}

export default function Roof() {
  const panels = useRef<Group>(null);
  const stripMaterial = useRef<MeshStandardMaterial>(null);
  const lampMaterial = useRef<MeshBasicMaterial>(null);

  const assets = useMemo(() => {
    const underside = undersideTexture();
    const strips = stripTexture();
    const panelMap = panelTexture();
    const lamps = lampTexture();
    panelMap.repeat.set(1, 6);

    const inner = { d: ROOF.openingInset, y: ROOF.innerY };
    const outer = { d: BACK_WALL.d, y: ROOF.outerY };
    const span = Math.hypot(outer.d - inner.d, outer.y - inner.y);

    // The ceiling over the stands (facing down)
    const ceiling = sweepBand(outer, inner, { uSize: 8.4, vSize: span, cornerSegments: 18, segmentLength: 8.4 });
    // Its top and edges, seen from outside and by the sun
    const shell = sweepBands(
      [
        { a: { d: inner.d, y: inner.y + 0.7 }, b: { d: outer.d + 2.5, y: outer.y + ROOF.thickness } },
        { a: inner, b: { d: inner.d, y: inner.y + 0.7 } },
        { a: { d: outer.d + 2.5, y: outer.y + ROOF.thickness }, b: { d: outer.d + 2.5, y: BACK_WALL.y } },
      ],
      { uSize: 8, vSize: 8, cornerSegments: 18 },
    );
    // The bar of floodlights round the edge of the opening
    const lampBar = sweepBand({ d: inner.d + 0.35, y: inner.y - 0.95 }, { d: inner.d + 0.05, y: inner.y - 0.1 }, { uSize: 1.3, vSize: 0.9, cornerSegments: 18 });

    const panel = new BoxGeometry(PANEL_WIDTH, 0.5, PANEL_DEPTH);
    const panelMaterial = new MeshStandardMaterial({ map: panelMap, emissive: "#f3f7ff", emissiveMap: panelMap, emissiveIntensity: 0.1, roughness: 0.7, metalness: 0.05 });
    return { underside, strips, panelMap, lamps, ceiling, shell, lampBar, panel, panelMaterial };
  }, []);

  useEffect(() => {
    return () => {
      assets.underside.dispose();
      assets.strips.dispose();
      assets.panelMap.dispose();
      assets.lamps.dispose();
      assets.ceiling.dispose();
      assets.shell.dispose();
      assets.lampBar.dispose();
      assets.panel.dispose();
      assets.panelMaterial.dispose();
    };
  }, [assets]);

  const lampColor = useMemo(() => new Color(), []);

  useFrame(() => {
    // Panels leave the stack one after another, the far one first
    const group = panels.current;
    if (group) {
      const n = ROOF.panelCount;
      group.children.forEach((panel, k) => {
        const closedX = -OPEN_HX - 1.5 + PANEL_WIDTH * (k + 0.5);
        const start = ((n - 1 - k) / n) * 0.55;
        const local = easeInOut(Math.min(1, Math.max(0, (atmo.roof - start) / 0.45)));
        panel.position.x = PARKED_X + (closedX - PARKED_X) * local;
        // Stacked panels sit a little above one another
        panel.position.y = PANEL_Y + (1 - local) * (k * 0.3);
      });
    }
    // Closed panels glow softly with the daylight behind them
    assets.panelMaterial.emissiveIntensity = 0.04 + 0.6 * atmo.daylight * (1 - 0.45 * atmo.overcast);
    if (stripMaterial.current) stripMaterial.current.emissiveIntensity = 0.25 + 2.2 * atmo.floodlights;
    if (lampMaterial.current) {
      const power = 0.35 + 3.4 * atmo.floodlights;
      lampMaterial.current.color.copy(lampColor.setRGB(power, power, power * 1.06));
    }
  });

  return (
    <group>
      <mesh geometry={assets.ceiling} castShadow>
        <meshStandardMaterial ref={stripMaterial} map={assets.underside} emissiveMap={assets.strips} emissive="#dfe8ff" emissiveIntensity={1} roughness={0.55} metalness={0.35} />
      </mesh>
      <mesh geometry={assets.shell} castShadow>
        <meshStandardMaterial color="#b9bfc8" roughness={0.45} metalness={0.6} />
      </mesh>
      <mesh geometry={assets.lampBar}>
        <meshBasicMaterial ref={lampMaterial} map={assets.lamps} toneMapped={false} />
      </mesh>
      <group ref={panels}>
        {Array.from({ length: ROOF.panelCount }, (_, k) => (
          <mesh key={k} geometry={assets.panel} material={assets.panelMaterial} position={[PARKED_X, PANEL_Y, 0]} castShadow />
        ))}
      </group>
    </group>
  );
}
