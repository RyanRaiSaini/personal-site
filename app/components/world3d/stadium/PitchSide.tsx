"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { AdditiveBlending, BoxGeometry, Color, CylinderGeometry, DoubleSide, Float32BufferAttribute, PlaneGeometry, type BufferGeometry, type Group, type MeshBasicMaterial } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { atmo } from "../atmosphere/state";
import { canvasTexture } from "../textures/canvas";
import { BOWL, DUGOUT, PITCH, TUNNEL } from "./dims";

// Things at the side of the pitch: the four corner flags, the two
// dugouts and the inside of the players' tunnel, all on the main-stand
// (west) side except the flags. The solid housing over the tunnel is
// part of the stadium model.

// ------------------------------------------------------------------
// Corner flags
// ------------------------------------------------------------------

export const CORNERS: [number, number][] = [
  [PITCH.halfLength, PITCH.halfWidth],
  [PITCH.halfLength, -PITCH.halfWidth],
  [-PITCH.halfLength, -PITCH.halfWidth],
  [-PITCH.halfLength, PITCH.halfWidth],
];

function CornerFlag({ x, z, index }: { x: number; z: number; index: number }) {
  const flag = useRef<Group>(null);
  useFrame(() => {
    if (flag.current) flag.current.rotation.y = Math.sin(atmo.time * 1.7 + index * 1.3) * 0.5 + index;
  });
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.76, 0]} castShadow>
        <cylinderGeometry args={[0.022, 0.022, 1.52, 8]} />
        <meshStandardMaterial color="#f5d04a" roughness={0.5} />
      </mesh>
      <group ref={flag} position={[0, 1.34, 0]}>
        <mesh position={[0.2, 0, 0]} castShadow>
          <planeGeometry args={[0.4, 0.3]} />
          <meshStandardMaterial color="#f7f7f5" side={DoubleSide} roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

// ------------------------------------------------------------------
// Dugouts
// ------------------------------------------------------------------

const WALL_Z = -BOWL.hz;

type Block = { size: [number, number, number]; at: [number, number, number]; lean?: number; color: string };

// Many plain blocks made into one shape, each keeping its own colour,
// so a whole bench costs the graphics card a single drawing step
function blocks(list: Block[]): BufferGeometry {
  const parts = list.map(({ size, at, lean = 0, color }) => {
    const part = new BoxGeometry(...size);
    if (lean) part.rotateX(lean);
    part.translate(...at);
    const shade = new Color(color);
    const count = part.attributes.position.count;
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) colors.set([shade.r, shade.g, shade.b], i * 3);
    part.setAttribute("color", new Float32BufferAttribute(colors, 3));
    return part;
  });
  const merged = mergeGeometries(parts, false);
  for (const part of parts) part.dispose();
  return merged;
}

const BENCH = {
  seats: 14,
  spacing: 0.72,
  floor: 0.14,
  leather: "#1b2750",
  headrest: "#e6e8ec",
  steel: "#d5d9de",
  ribs: 6,
};

// The team bench: a raised floor, a low padded wall, a row of
// high-backed seats and a clear canopy on white steel ribs
function Dugout({ x }: { x: number }) {
  const { width, depth, height } = DUGOUT;
  const z = WALL_Z + depth / 2 + 0.25;

  const geometry = useMemo(() => {
    const back = -depth / 2;
    const solid: Block[] = [
      { size: [width, BENCH.floor, depth], at: [0, BENCH.floor / 2, 0], color: "#2a2d33" },
      { size: [width, 1.0, 0.1], at: [0, BENCH.floor + 0.5, back + 0.05], color: "#151921" },
    ];
    for (let i = 0; i < BENCH.seats; i++) {
      const sx = (i - (BENCH.seats - 1) / 2) * BENCH.spacing;
      const seatY = BENCH.floor + 0.42;
      solid.push(
        // the pedestal, the cushion, the tall back and its headrest
        { size: [0.12, 0.36, 0.3], at: [sx, BENCH.floor + 0.18, back + 0.62], color: "#0f1218" },
        { size: [0.6, 0.13, 0.52], at: [sx, seatY, back + 0.66], color: BENCH.leather },
        { size: [0.6, 0.72, 0.12], at: [sx, seatY + 0.42, back + 0.38], lean: -0.2, color: BENCH.leather },
        { size: [0.4, 0.2, 0.13], at: [sx, seatY + 0.86, back + 0.29], lean: -0.2, color: BENCH.headrest },
      );
    }
    for (let i = 0; i < BENCH.ribs; i++) {
      const rx = -width / 2 + (width * i) / (BENCH.ribs - 1);
      solid.push(
        { size: [0.07, height - BENCH.floor, 0.07], at: [rx, BENCH.floor + (height - BENCH.floor) / 2, back + 0.14], color: BENCH.steel },
        { size: [0.07, 0.07, depth + 0.1], at: [rx, height - 0.2, 0.12], lean: 0.17, color: BENCH.steel },
      );
    }

    // the clear parts: a curved roof and a pane at each end
    const roof = new CylinderGeometry(depth * 0.72, depth * 0.72, width, 20, 1, true, Math.PI * 1.02, Math.PI * 0.46);
    roof.rotateZ(Math.PI / 2);
    roof.translate(0, height - 0.55, back + 0.6);
    const ends = [-1, 1].map((s) => {
      const pane = new BoxGeometry(0.05, height - BENCH.floor - 0.1, depth);
      pane.translate((s * width) / 2, BENCH.floor + (height - BENCH.floor - 0.1) / 2, 0);
      return pane;
    });
    const clear = mergeGeometries([roof, ...ends], false);
    roof.dispose();
    for (const pane of ends) pane.dispose();
    return { solid: blocks(solid), clear };
  }, [width, depth, height]);

  useEffect(() => {
    return () => {
      geometry.solid.dispose();
      geometry.clear.dispose();
    };
  }, [geometry]);

  return (
    <group position={[x, 0, z]}>
      <mesh geometry={geometry.solid} castShadow receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.62} />
      </mesh>
      <mesh geometry={geometry.clear}>
        <meshStandardMaterial color="#a9b8ca" transparent opacity={0.2} roughness={0.06} metalness={0.1} side={DoubleSide} forceSinglePass depthWrite={false} />
      </mesh>
    </group>
  );
}

// ------------------------------------------------------------------
// The tunnel
// ------------------------------------------------------------------

function wallTexture() {
  return canvasTexture(64, 128, (ctx, w, h) => {
    // grey painted wall above a dark lower band, with a joint every two
    // metres; brighter toward the ceiling, where the strip lights are
    const paint = ctx.createLinearGradient(0, 0, 0, h * 0.62);
    paint.addColorStop(0, "#6a6f79");
    paint.addColorStop(1, "#3d4149");
    ctx.fillStyle = paint;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#10131b";
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
    // a pale line where the two paints meet
    ctx.fillStyle = "rgba(214,220,232,0.5)";
    ctx.fillRect(0, h * 0.62 - 1, w, 2);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(0, 0, 2, h);
  });
}

// A soft round glow, bright in the middle
function glowTexture() {
  return canvasTexture(
    128,
    128,
    (ctx, w, h) => {
      const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      glow.addColorStop(0, "rgba(255,255,255,0.85)");
      glow.addColorStop(0.35, "rgba(255,255,255,0.3)");
      glow.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
    },
    { repeat: false },
  );
}

// How much daylight reaches a spot `metres` back from the tunnel's
// mouth: all of it at the opening, very little by the far end. This is
// what makes the tunnel dark and the pitch bright at the end of it.
const DEEP = 0.2;
function spill(metres: number) {
  return DEEP + (1 - DEEP) * Math.exp(-Math.max(0, metres) / 6.5);
}

// A flat strip running the length of the tunnel, shaded by how far each
// part of it is from the mouth. `run` is the tunnel's length, `width`
// the strip's own width; `toMouth` says which end of the strip is at
// the mouth once it has been turned into place (+1 or -1).
function shadedStrip(run: number, width: number, lengthwise: "x" | "y", toMouth: 1 | -1, tint: [number, number, number] = [1, 1, 1]) {
  const steps = 26;
  const geometry = lengthwise === "x" ? new PlaneGeometry(run, width, steps, 1) : new PlaneGeometry(width, run, 1, steps);
  const position = geometry.attributes.position;
  const colours = new Float32Array(position.count * 3);
  for (let i = 0; i < position.count; i++) {
    const along = lengthwise === "x" ? position.getX(i) : position.getY(i);
    const light = spill(run / 2 - along * toMouth);
    colours.set([tint[0] * light, tint[1] * light, tint[2] * light], i * 3);
  }
  geometry.setAttribute("color", new Float32BufferAttribute(colours, 3));
  return geometry;
}

function Tunnel() {
  const { halfWidth, height, length } = TUNNEL;
  const mouthZ = WALL_Z; // level with the front of the housing that the stadium model provides
  const endZ = WALL_Z - length;
  const midZ = (mouthZ + endZ) / 2;
  const run = mouthZ - endZ;
  const glow = useRef<MeshBasicMaterial>(null);

  const made = useMemo(() => {
    const walls = wallTexture();
    walls.repeat.set(run / 2, 1);
    return {
      walls,
      glow: glowTexture(),
      // each wall is turned to face inward, which puts the mouth at opposite ends of the two
      wall: { 1: shadedStrip(run, height, "x", 1), [-1]: shadedStrip(run, height, "x", -1) } as Record<number, BufferGeometry>,
      floor: shadedStrip(run, halfWidth * 2, "y", -1, [1.25, 1.3, 1.4]),
      ceiling: shadedStrip(run, halfWidth * 2, "y", 1),
    };
  }, [run, height, halfWidth]);

  useEffect(() => {
    return () => {
      made.walls.dispose();
      made.glow.dispose();
      made.wall[1].dispose();
      made.wall[-1].dispose();
      made.floor.dispose();
      made.ceiling.dispose();
    };
  }, [made]);

  // the haze of light in the mouth follows the day: strong at noon, softer under the floodlights
  useFrame(() => {
    if (glow.current) glow.current.opacity = 0.16 + 0.34 * Math.max(atmo.daylight, atmo.floodlights * 0.55);
  });

  return (
    <group>
      {/* inside: floor, walls, ceiling. They carry their own light,
          because no lamp reaches in here: dim at the back, lit by the
          day (or the floodlights) toward the mouth. */}
      <mesh geometry={made.floor} position={[0, 0.01, midZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#2a2d33" vertexColors />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={made.wall[s]} position={[s * halfWidth, height / 2, midZ]} rotation={[0, (-s * Math.PI) / 2, 0]}>
          <meshBasicMaterial map={made.walls} vertexColors />
        </mesh>
      ))}
      <mesh geometry={made.ceiling} position={[0, height, midZ]} rotation={[Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="#1b1e25" vertexColors />
      </mesh>
      {/* strip lights along the ceiling */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (halfWidth - 0.55), height - 0.02, midZ]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.09, run - 1]} />
          <meshBasicMaterial color={[1.15, 1.2, 1.32]} toneMapped={false} />
        </mesh>
      ))}
      {/* the far end: a lit doorway back toward the dressing rooms */}
      <mesh position={[0, height / 2, endZ]}>
        <planeGeometry args={[halfWidth * 2, height]} />
        <meshBasicMaterial color="#0b0d12" />
      </mesh>
      <mesh position={[0, 1.15, endZ + 0.02]}>
        <planeGeometry args={[1.5, 2.3]} />
        <meshBasicMaterial color={[0.7, 0.67, 0.6]} toneMapped={false} />
      </mesh>
      {/* a haze of light in the mouth, seen only from inside */}
      <mesh position={[0, height / 2, mouthZ - 0.4]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[halfWidth * 2 + 5, height + 3.2]} />
        <meshBasicMaterial ref={glow} map={made.glow} transparent opacity={0.4} blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

export default function PitchSide() {
  return (
    <group>
      {CORNERS.map(([x, z], i) => (
        <CornerFlag key={i} x={x} z={z} index={i} />
      ))}
      <Dugout x={DUGOUT.x} />
      <Dugout x={-DUGOUT.x} />
      <Tunnel />
    </group>
  );
}
