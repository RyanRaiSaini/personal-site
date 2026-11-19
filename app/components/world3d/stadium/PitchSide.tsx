"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { DoubleSide, type Group } from "three";
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

function Dugout({ x }: { x: number }) {
  const { width, depth, height } = DUGOUT;
  const z = WALL_Z + depth / 2 + 0.25;
  const seats = 9;
  return (
    <group position={[x, 0, z]}>
      {/* floor */}
      <mesh position={[0, 0.06, 0]} receiveShadow>
        <boxGeometry args={[width, 0.12, depth]} />
        <meshStandardMaterial color="#24272d" roughness={0.9} />
      </mesh>
      {/* back and end walls */}
      <mesh position={[0, height / 2, -depth / 2 + 0.05]}>
        <boxGeometry args={[width, height, 0.1]} />
        <meshStandardMaterial color="#14171d" roughness={0.7} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * width) / 2, height / 2, 0]}>
          <boxGeometry args={[0.08, height, depth]} />
          <meshStandardMaterial color="#9fb0c4" transparent opacity={0.22} roughness={0.08} metalness={0.1} />
        </mesh>
      ))}
      {/* clear curved roof */}
      <mesh position={[0, height - 0.55, -depth / 2 + 0.6]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[depth * 0.72, depth * 0.72, width, 20, 1, true, Math.PI * 1.02, Math.PI * 0.46]} />
        <meshStandardMaterial color="#a9b8ca" transparent opacity={0.2} roughness={0.06} metalness={0.1} side={DoubleSide} />
      </mesh>
      {/* a row of seats */}
      {Array.from({ length: seats }, (_, i) => {
        const sx = (i - (seats - 1) / 2) * (width / (seats + 0.6));
        return (
          <group key={i} position={[sx, 0.12, -depth / 2 + 0.7]}>
            <mesh position={[0, 0.42, 0]} castShadow>
              <boxGeometry args={[0.62, 0.14, 0.6]} />
              <meshStandardMaterial color="#161a26" roughness={0.55} />
            </mesh>
            <mesh position={[0, 0.9, -0.26]} rotation={[-0.18, 0, 0]} castShadow>
              <boxGeometry args={[0.62, 0.9, 0.14]} />
              <meshStandardMaterial color="#1a2030" roughness={0.55} />
            </mesh>
          </group>
        );
      })}
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
    paint.addColorStop(0, "#8b9099");
    paint.addColorStop(1, "#5d626b");
    ctx.fillStyle = paint;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#151924";
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
