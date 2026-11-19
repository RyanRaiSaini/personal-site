"use client";

import { useEffect, useMemo } from "react";
import { DoubleSide, type CanvasTexture } from "three";
import { canvasTexture, grain } from "../textures/canvas";
import { useDisplayFont } from "../textures/text";

// Pieces every room is built from: a painted box, a flat sign with
// text on it, and the shell of the room itself (floor, walls, ceiling).

export const NAVY = "#10224a";
export const ROYAL = "#12327e";
export const GOLD = "#d9b85a";
export const CREAM = "#ece9e1";

type BoxProps = {
  size: [number, number, number];
  position: [number, number, number];
  rotation?: [number, number, number];
  color?: string;
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  opacity?: number;
  shadow?: boolean;
};

export function Box({ size, position, rotation, color = "#888", roughness = 0.7, metalness = 0, emissive, emissiveIntensity = 1, opacity, shadow = false }: BoxProps) {
  return (
    <mesh position={position} rotation={rotation} castShadow={shadow} receiveShadow={shadow}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={roughness} metalness={metalness} emissive={emissive ?? "#000000"} emissiveIntensity={emissive ? emissiveIntensity : 0} transparent={opacity !== undefined} opacity={opacity ?? 1} />
    </mesh>
  );
}

// A bar of light: bright enough to glow, and not shaded by anything
export function Glow({ size, position, rotation, color = [2.4, 2.3, 2.1] }: { size: [number, number, number]; position: [number, number, number]; rotation?: [number, number, number]; color?: [number, number, number] }) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  );
}

export type SignLine = {
  text: string;
  size: number; // share of the sign's height, 0 to 1
  color?: string;
  weight?: number;
  spacing?: number; // letter spacing in em
};

type SignProps = {
  lines: SignLine[];
  width: number; // metres
  height: number;
  position: [number, number, number];
  rotation?: [number, number, number];
  background?: string | null; // null = see-through
  border?: string;
  glow?: number; // above 1 makes it shine like a lit sign
  align?: "center" | "left";
};

// A flat sign with lines of text, painted with the site's heading font
export function Sign({ lines, width, height, position, rotation, background = NAVY, border, glow, align = "center" }: SignProps) {
  const family = useDisplayFont();
  const key = JSON.stringify(lines);

  const texture = useMemo<CanvasTexture | null>(() => {
    if (!family) return null;
    const parsed = JSON.parse(key) as SignLine[];
    const scale = Math.min(1024 / width, 512 / height, 220);
    const w = Math.max(16, Math.round(width * scale));
    const h = Math.max(16, Math.round(height * scale));
    return canvasTexture(
      w,
      h,
      (ctx) => {
        if (background) {
          ctx.fillStyle = background;
          ctx.fillRect(0, 0, w, h);
        } else ctx.clearRect(0, 0, w, h);
        if (border) {
          ctx.strokeStyle = border;
          ctx.lineWidth = Math.max(2, h * 0.02);
          ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, w - ctx.lineWidth * 2, h - ctx.lineWidth * 2);
        }
        const total = parsed.reduce((sum, line) => sum + line.size, 0);
        let y = (h * (1 - total)) / 2;
        ctx.textBaseline = "middle";
        ctx.textAlign = align;
        for (const line of parsed) {
          let px = line.size * h * 0.82;
          ctx.font = `${line.weight ?? 700} ${px}px ${family}`;
          if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${(line.spacing ?? 0.04) * px}px`;
          // shrink a line that would not fit
          const measured = ctx.measureText(line.text).width;
          const room = w * 0.9;
          if (measured > room) {
            px *= room / measured;
            ctx.font = `${line.weight ?? 700} ${px}px ${family}`;
            if ("letterSpacing" in ctx) (ctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${(line.spacing ?? 0.04) * px}px`;
          }
          ctx.fillStyle = line.color ?? "#ffffff";
          ctx.fillText(line.text, align === "center" ? w / 2 : w * 0.06, y + (line.size * h) / 2);
          y += line.size * h;
        }
      },
      { repeat: false, anisotropy: 16 },
    );
  }, [family, key, width, height, background, border, align]);

  useEffect(() => {
    return () => texture?.dispose();
  }, [texture]);

  if (!texture) return null;
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      {glow ? <meshBasicMaterial map={texture} toneMapped={false} color={[glow, glow, glow]} transparent={!background} side={DoubleSide} forceSinglePass /> : <meshStandardMaterial map={texture} roughness={0.6} transparent={!background} side={DoubleSide} forceSinglePass />}
    </mesh>
  );
}

type ShellProps = {
  width: number;
  depth: number; // the back wall is at z = -back, the room runs forward from there
  back: number;
  height: number;
  floor: string;
  wall: string;
  ceiling: string;
  floorRoughness?: number;
  floorMetalness?: number;
  floorMap?: CanvasTexture | null;
};

// The empty room: floor, four walls and a ceiling, seen from inside
export function Shell({ width, depth, back, height, floor, wall, ceiling, floorRoughness = 0.8, floorMetalness = 0, floorMap = null }: ShellProps) {
  const centreZ = -back + depth / 2;
  const plaster = useMemo(
    () =>
      canvasTexture(128, 128, (ctx, w, h) => {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        grain(ctx, w, h, 9, 61);
      }),
    [],
  );
  useEffect(() => () => plaster.dispose(), [plaster]);

  return (
    <group>
      <mesh position={[0, 0, centreZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={floorMap ? "#ffffff" : floor} map={floorMap ?? undefined} roughness={floorRoughness} metalness={floorMetalness} />
      </mesh>
      <mesh position={[0, height, centreZ]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color={ceiling} roughness={0.9} />
      </mesh>
      {/* back, front, left, right */}
      <mesh position={[0, height / 2, -back]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={wall} map={plaster} roughness={0.85} />
      </mesh>
      <mesh position={[0, height / 2, -back + depth]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[width, height]} />
        <meshStandardMaterial color={wall} map={plaster} roughness={0.85} />
      </mesh>
      <mesh position={[-width / 2, height / 2, centreZ]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color={wall} map={plaster} roughness={0.85} />
      </mesh>
      <mesh position={[width / 2, height / 2, centreZ]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[depth, height]} />
        <meshStandardMaterial color={wall} map={plaster} roughness={0.85} />
      </mesh>
    </group>
  );
}

// Changes the mouse pointer over something clickable in the 3D world
export const clickable = {
  onPointerOver: () => {
    document.body.style.cursor = "pointer";
  },
  onPointerOut: () => {
    document.body.style.cursor = "";
  },
};
