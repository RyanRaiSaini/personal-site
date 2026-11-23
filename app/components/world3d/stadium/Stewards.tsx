"use client";

import { Box } from "../rooms/common";
import Person from "../rooms/Person";
import { POSE } from "../rooms/clerk";
import { AD_BOARD, PITCH } from "./dims";

// ------------------------------------------------------------------
// Stewards along both touchlines: on chairs between the boards and the
// front wall, facing the crowd, in hi-vis vests, as at every match. Seen
// from the pitch, so from behind (the crowd's people drawn from the back).
//
// To move them, change MAIN and FAR (metres along each touchline). The
// main stand's side leaves room for the tunnel, the flash interview and
// both dugouts.
// ------------------------------------------------------------------

const MAIN = [-44, -30, 26, 32, 44];
const FAR = [-44, -31, -18, -6, 6, 18, 31, 44];
// between the back of the boards and the front wall
const OUT = PITCH.halfWidth + AD_BOARD.offsetZ + 1.3;
const VEST = "#e8f51c";
// they sit on a step, so they show over the boards from the pitch
const STEP = 0.5;

function Steward({ x, z, turn, i }: { x: number; z: number; turn: number; i: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, turn, 0]}>
      {/* a concrete step at the foot of the stand, and a plain folding chair on it */}
      <Box size={[0.9, STEP, 0.8]} position={[0, STEP / 2, 0.05]} color="#3a3d44" roughness={0.9} />
      <Box size={[0.42, 0.04, 0.4]} position={[0, STEP + 0.44, 0.02]} color="#2a2d33" roughness={0.6} />
      <Box size={[0.42, 0.4, 0.03]} position={[0, STEP + 0.66, 0.2]} color="#2a2d33" roughness={0.6} />
      <Person look={{ sheet: "crowd-back", man: (i % 2) as 0 | 1, pose: POSE.sit, shirt: VEST, skin: [0.15, 0.6, 0.35, 0.85, 0.25][i % 5], hair: ["#1a120c", "#0e0b09", "#4a3422", "#0e0b09", "#6b5030"][i % 5] }} position={[0, 0, 0]} lift={STEP} mirrored={i % 2 === 1} />
    </group>
  );
}

export default function Stewards() {
  return (
    <group>
      {/* the main stand's side (-Z): facing the stand, their backs to the pitch */}
      {MAIN.map((x, i) => (
        <Steward key={`m${x}`} x={x} z={-OUT} turn={0} i={i} />
      ))}
      {/* the far side (+Z) */}
      {FAR.map((x, i) => (
        <Steward key={`f${x}`} x={x} z={OUT} turn={Math.PI} i={i + 2} />
      ))}
    </group>
  );
}
