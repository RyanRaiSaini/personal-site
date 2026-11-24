"use client";

import { Box } from "../rooms/common";
import { VIEW, WOMAN, type PersonLook } from "../rooms/clerk";
import Person from "../rooms/Person";
import { AD_BOARD, BOWL, DUGOUT, PITCH } from "./dims";

// ------------------------------------------------------------------
// The match-day people round the pitch who are not players (other
// players appear only in the Easter eggs, CLAUDE.md): coaching staff in
// both dugouts, the fourth official between them at halfway, and ball
// kids on stools along both touchlines. All are the crowd's rendered
// people (rooms/Person.tsx), facing the pitch.
//
// To move them, change BENCH_STAFF (metres from each dugout's middle,
// along the bench), FOURTH, and BALL_KIDS (metres along each touchline,
// clear of the dugouts, the flash interview, the TV cameras and the
// photographers).
// ------------------------------------------------------------------

// the bench seats: as built in PitchSide.tsx (floor 0.14 high, the seat 0.66 m in from the back)
const BENCH_Z = -BOWL.hz + DUGOUT.depth / 2 + 0.25;
const SEAT_Z = BENCH_Z - DUGOUT.depth / 2 + 0.78;
const BENCH_FLOOR = 0.14;
const TRACKSUIT = "#16203f";

// along the bench from each dugout's middle; clear of the shirt left on
// the south bench (eggs/BenchShirt.tsx), which hangs about 4 m towards the tunnel
const BENCH_STAFF: { dugout: 1 | -1; along: number; look: PersonLook; mirrored?: boolean }[] = [
  { dugout: -1, along: -2.52, look: { man: 0, trousers: TRACKSUIT, shirt: TRACKSUIT, skin: 0.3, hair: "#1a120c" } },
  { dugout: -1, along: -1.08, look: { man: 6, trousers: TRACKSUIT, shirt: TRACKSUIT, skin: 0.6, hair: "#0e0b09" }, mirrored: true },
  { dugout: -1, along: -0.36, look: { man: WOMAN.shirtAndTrousers, trousers: TRACKSUIT, shirt: TRACKSUIT, skin: 0.2, hair: "#4a2c16" } },
  { dugout: 1, along: -1.8, look: { man: 1, trousers: TRACKSUIT, shirt: "#e9e7e1", skin: 0.75, hair: "#0e0b09" } },
  { dugout: 1, along: -0.36, look: { man: WOMAN.jumper, trousers: TRACKSUIT, shirt: "#e9e7e1", skin: 0.35, hair: "#2a1c12" }, mirrored: true },
  { dugout: 1, along: 1.08, look: { man: 6, trousers: TRACKSUIT, shirt: "#e9e7e1", skin: 0.15, hair: "#5a3a1e" } },
];

// the fourth official, in black, standing between the dugouts: just off
// halfway, clear of the tunnel mouth the players walk out of
const FOURTH = { x: -5.5, z: -PITCH.halfWidth - 1.6 };

// ball kids, sitting just inside the boards (z is the touchline's side)
const BOARDS = PITCH.halfWidth + AD_BOARD.offsetZ;
const BALL_KIDS: { x: number; side: 1 | -1 }[] = [
  { x: -44, side: -1 },
  { x: -31, side: -1 },
  { x: 31, side: -1 },
  { x: 44, side: -1 },
  { x: -44, side: 1 },
  { x: -17.5, side: 1 },
  { x: 17.5, side: 1 },
  { x: 44, side: 1 },
];
const KID_TOPS = ["#1f4fd1", "#1f4fd1", "#d9ef2e"];

export default function MatchStaff() {
  return (
    <group>
      {BENCH_STAFF.map(({ dugout, along, look, mirrored }) => (
        <Person key={`${dugout}${along}`} look={look} position={[dugout * DUGOUT.x + along, BENCH_FLOOR, SEAT_Z]} lift={0.12} mirrored={mirrored} />
      ))}

      <Person look={{ sheet: "queue", man: 0, pose: VIEW.front, shirt: "#0b0c10", skin: 0.55, hair: "#0e0b09", trousers: "#0b0c10" }} position={[FOURTH.x, 0, FOURTH.z]} />

      {BALL_KIDS.map(({ x, side }, i) => (
        <group key={`${x}${side}`} position={[x, 0, side * (BOARDS - 0.9)]} rotation={[0, side > 0 ? Math.PI : 0, 0]}>
          {/* the stool */}
          <Box size={[0.32, 0.36, 0.3]} position={[0, 0.18, -0.1]} color="#1b1d22" roughness={0.6} />
          {/* a child: the same people, smaller */}
          <group scale={0.78}>
            <Person look={{ man: ([0, 3, 1, 2, 6, 5, 0, 4] as const)[i], shirt: KID_TOPS[i % KID_TOPS.length], skin: [0.2, 0.6, 0.35, 0.8, 0.1, 0.45, 0.7, 0.25][i], hair: "#1a120c" }} position={[0, -0.02, 0]} mirrored={i % 2 === 1} />
          </group>
        </group>
      ))}
    </group>
  );
}
