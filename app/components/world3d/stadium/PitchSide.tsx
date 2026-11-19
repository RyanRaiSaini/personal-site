"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BoxGeometry, Color, CylinderGeometry, DoubleSide, Float32BufferAttribute, type BufferGeometry, type Group } from "three";
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
    paint.addColorStop(0, "#636872");
    paint.addColorStop(1, "#3d4149");
    ctx.fillStyle = paint;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#10131b";
    ctx.fillRect(0, h * 0.62, w, h * 0.38);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(0, 0, 2, h);
  });
}

function Tunnel() {
  const { halfWidth, height, length } = TUNNEL;
  const mouthZ = WALL_Z; // level with the front of the housing that the stadium model provides
  const endZ = WALL_Z - length;
  const midZ = (mouthZ + endZ) / 2;
  const run = mouthZ - endZ;
  const walls = useMemo(() => {
    const t = wallTexture();
    t.repeat.set(run / 2, 1);
    return t;
  }, [run]);

  return (
    <group>
      {/* inside: floor, walls, ceiling. They carry their own light,
          because no lamp reaches in here; kept dim, so the tunnel reads
          as indoors against the daylight on the pitch. */}
      <mesh position={[0, 0.01, midZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[halfWidth * 2, run]} />
        <meshBasicMaterial color="#2a2d33" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * halfWidth, height / 2, midZ]} rotation={[0, (-s * Math.PI) / 2, 0]}>
          <planeGeometry args={[run, height]} />
          <meshBasicMaterial map={walls} />
        </mesh>
      ))}
      <mesh position={[0, height, midZ]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[halfWidth * 2, run]} />
        <meshBasicMaterial color="#14161c" />
      </mesh>
      {/* strip lights along the ceiling */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (halfWidth - 0.5), height - 0.02, midZ]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.16, run - 1]} />
          <meshBasicMaterial color={[1.9, 1.95, 2.05]} toneMapped={false} />
        </mesh>
      ))}
      {/* the far end: a lit doorway back toward the dressing rooms */}
      <mesh position={[0, height / 2, endZ]}>
        <planeGeometry args={[halfWidth * 2, height]} />
        <meshBasicMaterial color="#12151c" />
      </mesh>
      <mesh position={[0, 1.15, endZ + 0.02]}>
        <planeGeometry args={[1.5, 2.3]} />
        <meshBasicMaterial color={[1.25, 1.2, 1.1]} toneMapped={false} />
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
