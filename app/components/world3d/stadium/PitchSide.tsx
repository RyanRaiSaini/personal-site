"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { DoubleSide, type Group } from "three";
import { atmo } from "../atmosphere/state";
import { canvasTexture } from "../textures/canvas";
import { BOWL, DUGOUT, PITCH, TUNNEL } from "./dims";

// Things at the side of the pitch: the four corner flags, the two
// dugouts and the mouth of the players' tunnel, all on the main-stand
// (west) side except the flags.

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
        <meshStandardMaterial color="#1b1e26" roughness={0.9} />
      </mesh>
      {/* back and end walls */}
      <mesh position={[0, height / 2, -depth / 2 + 0.05]}>
        <boxGeometry args={[width, height, 0.1]} />
        <meshStandardMaterial color="#10224a" roughness={0.6} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[(s * width) / 2, height / 2, 0]}>
          <boxGeometry args={[0.08, height, depth]} />
          <meshStandardMaterial color="#b9d4ff" transparent opacity={0.28} roughness={0.08} metalness={0.2} />
        </mesh>
      ))}
      {/* clear curved roof */}
      <mesh position={[0, height - 0.55, -depth / 2 + 0.6]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[depth * 0.72, depth * 0.72, width, 20, 1, true, Math.PI * 1.02, Math.PI * 0.46]} />
        <meshStandardMaterial color="#cfe2ff" transparent opacity={0.3} roughness={0.06} metalness={0.3} side={DoubleSide} />
      </mesh>
      {/* a row of seats */}
      {Array.from({ length: seats }, (_, i) => {
        const sx = (i - (seats - 1) / 2) * (width / (seats + 0.6));
        return (
          <group key={i} position={[sx, 0.12, -depth / 2 + 0.7]}>
            <mesh position={[0, 0.42, 0]} castShadow>
              <boxGeometry args={[0.62, 0.14, 0.6]} />
              <meshStandardMaterial color="#17337a" roughness={0.6} />
            </mesh>
            <mesh position={[0, 0.9, -0.26]} rotation={[-0.18, 0, 0]} castShadow>
              <boxGeometry args={[0.62, 0.9, 0.14]} />
              <meshStandardMaterial color="#1b3d92" roughness={0.6} />
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

function stripeTexture() {
  return canvasTexture(64, 128, (ctx, w, h) => {
    // white upper wall, royal blue lower wall, a gold line between
    ctx.fillStyle = "#e9ecf2";
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#12327e";
    ctx.fillRect(0, h * 0.52, w, h * 0.48);
    ctx.fillStyle = "#d9b85a";
    ctx.fillRect(0, h * 0.5, w, 4);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fillRect(0, 0, 2, h);
  });
}

function Tunnel() {
  const { halfWidth, height, length } = TUNNEL;
  const mouthZ = WALL_Z + 2.2; // the canopy reaches out past the wall
  const endZ = WALL_Z - length;
  const midZ = (mouthZ + endZ) / 2;
  const run = mouthZ - endZ;
  const walls = useMemo(() => {
    const t = stripeTexture();
    t.repeat.set(run / 2, 1);
    return t;
  }, [run]);

  return (
    <group>
      {/* inside: floor, walls, ceiling. Painted bright because no
          floodlight reaches in here. */}
      <mesh position={[0, 0.01, midZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[halfWidth * 2, run]} />
        <meshBasicMaterial color="#23262e" />
      </mesh>
      <mesh position={[0, 0.02, midZ]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.5, run]} />
        <meshBasicMaterial color="#c8a94a" />
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
          <meshBasicMaterial color={[2.4, 2.5, 2.8]} toneMapped={false} />
        </mesh>
      ))}
      {/* the far end: a lit doorway back toward the dressing rooms */}
      <mesh position={[0, height / 2, endZ]}>
        <planeGeometry args={[halfWidth * 2, height]} />
        <meshBasicMaterial color="#0c1838" />
      </mesh>
      <mesh position={[0, 1.15, endZ + 0.02]}>
        <planeGeometry args={[1.5, 2.3]} />
        <meshBasicMaterial color={[1.5, 1.25, 0.8]} toneMapped={false} />
      </mesh>

      {/* outside: the canopy over the mouth */}
      <mesh position={[0, height + 0.2, (mouthZ + WALL_Z) / 2 - 2.6]} castShadow>
        <boxGeometry args={[halfWidth * 2 + 0.8, 0.4, 7.6]} />
        <meshStandardMaterial color="#0f1b3d" roughness={0.6} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (halfWidth + 0.2), (height + 0.4) / 2, (mouthZ + WALL_Z) / 2 - 2.6]} castShadow>
          <boxGeometry args={[0.4, height + 0.4, 7.6]} />
          <meshStandardMaterial color="#0f1b3d" roughness={0.6} />
        </mesh>
      ))}
      {/* a gold line round the mouth */}
      <mesh position={[0, height + 0.2, mouthZ + 0.01]}>
        <boxGeometry args={[halfWidth * 2 + 0.8, 0.1, 0.04]} />
        <meshBasicMaterial color={[1.6, 1.3, 0.6]} toneMapped={false} />
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
