"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { DoubleSide, type CanvasTexture, type Group } from "three";
import { bench, squad } from "../../../data/portfolio";
import { atmo } from "../atmosphere/state";
import { ballTexture } from "../players/Cast";
import { canvasTexture } from "../textures/canvas";
import { useDisplayFont } from "../textures/text";
import { Box, CREAM, Glow, GOLD, NAVY, ROYAL, Shell, Sign } from "./common";

// The dressing room (Skills). A shirt hangs on every peg: the starting
// eleven along the back wall, the bench down the left. The names and
// numbers come from `squad` and `bench` in app/data/portfolio.ts.
// Boots wait under every locker, the match ball sits in a pool of light
// at the front of the crest, and a bag of balls is left in the corner.

const BAY = 1.04; // width of one locker bay
const WOOD = "#7a5a3c";
const WOOD_DARK = "#4d3724";

// A white shirt seen from the back, with a name and a number
export function shirtTexture(family: string, name: string, number: number | string): CanvasTexture {
  return canvasTexture(
    256,
    288,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      // body and sleeves (the canvas is 256 x 288)
      ctx.beginPath();
      ctx.moveTo(88, 14);
      ctx.quadraticCurveTo(128, 34, 168, 14);
      ctx.lineTo(206, 26);
      ctx.lineTo(250, 78);
      ctx.lineTo(214, 108);
      ctx.lineTo(196, 90);
      ctx.lineTo(198, 276);
      ctx.lineTo(58, 276);
      ctx.lineTo(60, 90);
      ctx.lineTo(42, 108);
      ctx.lineTo(6, 78);
      ctx.lineTo(50, 26);
      ctx.closePath();
      const cloth = ctx.createLinearGradient(0, 0, w, 0);
      cloth.addColorStop(0, "#dfe2e8");
      cloth.addColorStop(0.5, "#ffffff");
      cloth.addColorStop(1, "#dfe2e8");
      ctx.fillStyle = cloth;
      ctx.fill();
      // soft folds
      ctx.strokeStyle = "rgba(20,30,60,0.08)";
      ctx.lineWidth = 3;
      for (const x of [92, 128, 164]) {
        ctx.beginPath();
        ctx.moveTo(x, 110);
        ctx.quadraticCurveTo(x + 4, 190, x - 2, 272);
        ctx.stroke();
      }
      // gold trim on the collar and cuffs
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(88, 14);
      ctx.quadraticCurveTo(128, 34, 168, 14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8, 80);
      ctx.lineTo(42, 106);
      ctx.moveTo(248, 80);
      ctx.lineTo(214, 106);
      ctx.stroke();

      // name, shrunk to fit across the shoulders
      ctx.fillStyle = NAVY;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let size = 32;
      ctx.font = `700 ${size}px ${family}`;
      const label = name.toUpperCase();
      const wide = ctx.measureText(label).width;
      if (wide > 124) {
        size *= 124 / wide;
        ctx.font = `700 ${size}px ${family}`;
      }
      ctx.fillText(label, w / 2, 76);
      ctx.font = `800 132px ${family}`;
      ctx.fillText(String(number), w / 2, 176);
    },
    { repeat: false, anisotropy: 16 },
  );
}

function Shirt({ name, number, position, rotation, index }: { name: string; number: number | string; position: [number, number, number]; rotation?: [number, number, number]; index: number }) {
  const family = useDisplayFont();
  const group = useRef<Group>(null);
  const texture = useMemo(() => (family ? shirtTexture(family, name, number) : null), [family, name, number]);
  useEffect(() => () => texture?.dispose(), [texture]);

  // A slight sway, as if someone just walked past
  useFrame(() => {
    if (group.current) group.current.rotation.z = Math.sin(atmo.time * 0.9 + index * 1.7) * 0.025;
  });

  if (!texture) return null;
  return (
    <group position={position} rotation={rotation}>
      <group ref={group} position={[0, 0.46, 0]}>
        {/* the hanger hook */}
        <mesh position={[0, 0.03, 0]}>
          <torusGeometry args={[0.035, 0.008, 6, 12, Math.PI]} />
          <meshStandardMaterial color="#c9ccd2" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.46, 0]}>
          <planeGeometry args={[0.8, 0.9]} />
          <meshStandardMaterial map={texture} transparent alphaTest={0.4} side={DoubleSide} forceSinglePass roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

// One locker bay: dividers, a shelf, a bench, a number plate and a shirt
function Bay({ x, name, number, index }: { x: number; name: string; number: number; index: number }) {
  return (
    <group position={[x, 0, 0]}>
      <Box size={[0.06, 2.35, 0.62]} position={[-BAY / 2, 1.175, 0.31]} color={WOOD} roughness={0.55} />
      <Box size={[BAY, 0.06, 0.62]} position={[0, 2.32, 0.31]} color={WOOD} roughness={0.55} />
      <Box size={[BAY, 0.07, 0.56]} position={[0, 0.46, 0.3]} color={WOOD} roughness={0.5} />
      <Box size={[BAY, 0.42, 0.5]} position={[0, 0.21, 0.27]} color={WOOD_DARK} roughness={0.6} />
      <Box size={[BAY - 0.06, 1.86, 0.03]} position={[0, 1.4, 0.03]} color={CREAM} roughness={0.8} />
      {/* light under the shelf */}
      <Glow size={[BAY - 0.2, 0.02, 0.04]} position={[0, 2.27, 0.5]} color={[2.2, 2.0, 1.6]} />
      {/* rail */}
      <mesh position={[0, 2.02, 0.3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, BAY - 0.1, 8]} />
        <meshStandardMaterial color="#c9ccd2" metalness={0.8} roughness={0.3} />
      </mesh>
      <Sign lines={[{ text: String(number), size: 0.9, color: NAVY, weight: 800 }]} width={0.3} height={0.2} position={[0, 2.5, 0.06]} background={CREAM} border={GOLD} />
      <Shirt name={name} number={number} position={[0, 1.5, 0.32]} index={index} />
    </group>
  );
}

// A pair of boots, left under a locker
function Boots({ x, z, turn }: { x: number; z: number; turn: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, turn, 0]}>
      {[-0.07, 0.07].map((side) => (
        <group key={side} position={[side, 0, side * 0.3]}>
          <Box size={[0.1, 0.022, 0.28]} position={[0, 0.011, 0]} color={GOLD} roughness={0.5} />
          <Box size={[0.095, 0.075, 0.26]} position={[0, 0.06, 0.01]} color="#16181d" roughness={0.35} metalness={0.1} />
          <Box size={[0.09, 0.06, 0.08]} position={[0, 0.12, 0.1]} color="#16181d" roughness={0.35} />
        </group>
      ))}
    </group>
  );
}

// The match ball, on the front edge of the crest in a pool of light
function MatchBall() {
  const ball = useRef<Group>(null);
  const leather = useMemo(() => ballTexture(), []);
  useEffect(() => () => leather.dispose(), [leather]);
  useFrame(() => {
    if (ball.current) ball.current.rotation.y = atmo.time * 0.3;
  });
  return (
    <group position={[0, 0, 2.75]}>
      <group ref={ball} position={[0, 0.115, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.115, 28, 20]} />
          <meshStandardMaterial map={leather} roughness={0.42} />
        </mesh>
      </group>
      <pointLight position={[0, 1.6, 0.2]} intensity={3} distance={2.6} decay={1.6} color="#fff3dc" />
    </group>
  );
}

// A mesh bag of training balls, slumped in the corner
function BallBag({ x, z }: { x: number; z: number }) {
  const balls: [number, number, number][] = [
    [0, 0.11, 0],
    [0.2, 0.11, 0.05],
    [0.09, 0.11, 0.2],
    [0.1, 0.3, 0.08],
  ];
  return (
    <group position={[x, 0, z]}>
      {balls.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.11, 18, 12]} />
          <meshStandardMaterial color={i % 2 ? "#f2f2ee" : "#d8b24e"} roughness={0.5} />
        </mesh>
      ))}
      {/* the net round them */}
      <mesh position={[0.1, 0.2, 0.08]}>
        <sphereGeometry args={[0.3, 12, 10]} />
        <meshStandardMaterial color="#10182e" wireframe transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function floorTexture(family: string | null) {
  return canvasTexture(
    1024,
    1024,
    (ctx, w, h) => {
      ctx.fillStyle = "#0e1a38";
      ctx.fillRect(0, 0, w, h);
      // a ring in the middle of the carpet, with my initials and number
      ctx.strokeStyle = CREAM;
      ctx.lineWidth = 14;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 250, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 222, 0, Math.PI * 2);
      ctx.stroke();
      if (family) {
        ctx.fillStyle = CREAM;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `800 250px ${family}`;
        ctx.fillText("RS", w / 2, h / 2 + 12);
      }
    },
    { repeat: false },
  );
}

export default function DressingRoom() {
  const family = useDisplayFont();
  const carpet = useMemo(() => floorTexture(family), [family]);
  useEffect(() => () => carpet.dispose(), [carpet]);

  // Bench players wear the numbers after the starting eleven
  const benchNumbers = [12, 14, 15, 17, 18, 19, 20];
  // eleven bays along the back wall, centred
  const startX = -((squad.length - 1) * BAY) / 2;

  return (
    <group>
      <hemisphereLight intensity={0.6} color="#e6ecff" groundColor="#121a30" />
      <pointLight position={[0, 2.7, 1.5]} intensity={18} distance={16} decay={1.6} color="#fff1dc" />
      <pointLight position={[0, 2.4, -2.6]} intensity={10} distance={10} decay={1.8} color="#ffe2b8" />

      <Shell width={13.4} depth={11.5} back={4.5} height={3.6} floor="#0e1a38" wall={ROYAL} ceiling="#0a0f1e" />
      {/* the carpet ring */}
      <mesh position={[0, 0.012, 1.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7, 7]} />
        <meshStandardMaterial map={carpet} roughness={0.95} />
      </mesh>

      {/* the ring light in the ceiling */}
      <mesh position={[0, 3.52, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.3, 0.04, 8, 64]} />
        <meshBasicMaterial color={[0.8, 0.78, 0.72]} toneMapped={false} />
      </mesh>

      {/* a gold line and my name above the lockers */}
      <Glow size={[13.4, 0.03, 0.02]} position={[0, 2.82, -4.47]} color={[1.6, 1.3, 0.6]} />
      <Sign lines={[{ text: "THE STARTING ELEVEN", size: 1, color: CREAM, spacing: 0.3 }]} width={6} height={0.36} position={[0, 3.14, -4.46]} background={null} />

      {/* back wall: the starting eleven */}
      <group position={[0, 0, -4.48]}>
        {squad.map((player, i) => (
          <Bay key={player.number} x={startX + i * BAY} name={player.name} number={player.number} index={i} />
        ))}
        <Box size={[0.06, 2.35, 0.62]} position={[startX + (squad.length - 0.5) * BAY, 1.175, 0.31]} color={WOOD} roughness={0.55} />
      </group>

      {/* left wall: the bench */}
      <group position={[-6.68, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        {bench.map((name, i) => (
          <Bay key={name} x={-3.4 + i * BAY} name={name} number={benchNumbers[i] ?? 20 + i} index={i + 11} />
        ))}
        <Box size={[0.06, 2.35, 0.62]} position={[-3.4 + (bench.length - 0.5) * BAY, 1.175, 0.31]} color={WOOD} roughness={0.55} />
      </group>
      <Sign lines={[{ text: "THE BENCH", size: 1, color: CREAM, spacing: 0.3 }]} width={3.4} height={0.34} position={[-6.66, 3.14, -0.4]} rotation={[0, Math.PI / 2, 0]} background={null} />

      <MatchBall />
      {/* boots under every locker, toes out */}
      {squad.map((player, i) => (
        <Boots key={player.number} x={startX + i * BAY} z={-3.55} turn={((i * 37) % 7) * 0.05 - 0.15} />
      ))}
      {bench.map((name, i) => (
        <Boots key={name} x={-5.75} z={3.4 - i * BAY} turn={Math.PI / 2 + ((i * 23) % 5) * 0.06 - 0.12} />
      ))}
      <BallBag x={-5.4} z={4.6} />
    </group>
  );
}
