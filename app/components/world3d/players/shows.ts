import type { Show } from "../../../lib/store";
import { PITCH } from "../stadium/dims";
import type { Stance } from "./moves";

// ------------------------------------------------------------------
// The scripts for the shows: who scores, from where, into which goal,
// how they celebrate and where the camera sits. Times are in seconds.
//
// To change a celebration, change its `celebration`: a standing pose
// ("wide", "folded", "hips") or the motion-captured "victory".
// To move a goal, change the positions here: [x, z] in metres, with the
// pitch centred on 0, 0 and the south goal at x = -52.5.
//
// The movements are real motion capture, so the speeds must be ones a
// person could run: about 6 or 7 metres a second flat out. `runOff` is
// how long the run to the celebration takes; check it against the
// distance from the ball to `party`.
// ------------------------------------------------------------------

export type Scorer = "jude" | "mbappe" | "saini";

export type GoalScript = {
  goal: "north" | "south";
  ball: [number, number]; // where the ball is waiting
  target: [number, number, number]; // where it ends up, inside the net
  // How he comes to the ball: from a spot, jogging or running. Left out
  // for a penalty, where he stands over it and takes his own run-up.
  approach?: { from: [number, number]; gait: "jog" | "run" };
  kick: "penalty" | "strike"; // which motion-captured kick
  contact: number; // seconds from the start until boot meets ball
  party: [number, number]; // where he runs to celebrate
  partyFacing: number; // which way he faces there (radians, 0 = toward +Z)
  runOff: number; // seconds from turning away to the celebration spot
  hold: number; // seconds the celebration is held
  celebration: { stance: Stance } | { clip: "victory" };
  directed: boolean; // true = the camera follows the scorer
  // The goalkeeper he beats: "wrong" dives the wrong way, "late" dives
  // the right way and is beaten anyway. Left out for no goalkeeper.
  keeper?: "wrong" | "late";
};

const SOUTH = -PITCH.halfLength;
const NORTH = PITCH.halfLength;

export const GOALS: Record<Scorer, GoalScript> = {
  // A penalty at the south end, then off to the corner with his arms out
  jude: {
    goal: "south",
    ball: [SOUTH + PITCH.penaltySpot, 0],
    target: [SOUTH - 1.5, 1.7, 2.7],
    kick: "penalty",
    contact: 1.6,
    party: [SOUTH + 9, -19],
    partyFacing: Math.PI * 1.1,
    runOff: 3.0,
    hold: 4.6,
    celebration: { stance: "wide" },
    directed: true,
    keeper: "wrong",
  },
  // In from the left wing, a shot across the keeper, then toward the
  // corner flag with his arms folded
  mbappe: {
    goal: "south",
    ball: [SOUTH + 12, 7],
    target: [SOUTH - 1.6, 0.7, -2.9],
    approach: { from: [SOUTH + 23, 17], gait: "run" },
    kick: "strike",
    contact: 2.5,
    party: [SOUTH + 5, 26],
    partyFacing: Math.PI * 0.42,
    runOff: 3.1,
    hold: 4.6,
    celebration: { stance: "folded" },
    directed: true,
    keeper: "late",
  },
  // Number 8, at the north end: the replay for each project
  saini: {
    goal: "north",
    ball: [NORTH - PITCH.penaltySpot, 0],
    target: [NORTH + 1.5, 1.5, -2.5],
    approach: { from: [NORTH - 16.5, 2.6], gait: "run" },
    kick: "strike",
    contact: 1.3,
    party: [NORTH - 14, 5.5],
    partyFacing: Math.PI * 0.72,
    runOff: 1.4,
    hold: 3.2,
    celebration: { clip: "victory" },
    directed: false,
  },
};

export const AWAY_AFTER = 0.42; // seconds after the strike before he turns away to celebrate
export const BALL_FLIGHT = 0.5; // seconds from boot to net

export function goalLength(script: GoalScript): number {
  return script.contact + AWAY_AFTER + script.runOff + 0.5 + script.hold;
}

// Number 66's long pass from the touchline (eggs/TrentShirt.tsx)
export const LONG_PASS = { contact: 1.9, flight: 2.5, length: 5.6 };

// How long each kind of show lasts before the world goes back to normal
export function showLength(show: Show): number {
  if (show.kind === "goal") return goalLength(GOALS[show.scorer]);
  if (show.kind === "fireworks") return 9;
  if (show.kind === "fifteen") return 8;
  // number 66's pass: long enough for the ball to land
  return LONG_PASS.length;
}
