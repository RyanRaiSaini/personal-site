import type { Show } from "../../../lib/store";
import { PITCH } from "../stadium/dims";
import { ARMS_CROSSED, ARMS_WIDE, FIST_UP, type Pose } from "./poses";

// ------------------------------------------------------------------
// The scripts for the shows: who scores, from where, into which goal,
// how they celebrate and where the camera sits. Times are in seconds.
//
// To change a celebration, change its `celebration` pose (poses.ts).
// To move one, change the positions here: [x, z] in metres, with the
// pitch centred on 0, 0 and the south goal at x = -52.5.
// ------------------------------------------------------------------

export type Scorer = "jude" | "mbappe" | "saini";

export type GoalScript = {
  goal: "north" | "south";
  start: [number, number]; // where the scorer starts his run
  strike: [number, number]; // where he hits it from
  ball: [number, number]; // where the ball is waiting
  target: [number, number, number]; // where it ends up, inside the net
  party: [number, number]; // where he runs to celebrate
  partyFacing: number; // which way he faces there (radians, 0 = toward +Z)
  runUp: number; // seconds from start to strike
  runOff: number; // seconds from the shot to the celebration spot
  hold: number; // seconds the celebration is held
  celebration: Pose;
  directed: boolean; // true = the camera follows the scorer
};

const SOUTH = -PITCH.halfLength;
const NORTH = PITCH.halfLength;

export const GOALS: Record<Scorer, GoalScript> = {
  // A penalty at the south end, then off to the corner with his arms out
  jude: {
    goal: "south",
    start: [SOUTH + 21, 1.8],
    strike: [SOUTH + 11.7, 0.25],
    ball: [SOUTH + PITCH.penaltySpot, 0],
    target: [SOUTH - 1.5, 1.7, 2.7],
    party: [SOUTH + 9, -19],
    partyFacing: Math.PI * 1.1,
    runUp: 1.5,
    runOff: 2.6,
    hold: 4.6,
    celebration: ARMS_WIDE,
    directed: true,
  },
  // In from the left wing, a shot across the keeper, then to the corner
  // flag with his arms folded
  mbappe: {
    goal: "south",
    start: [SOUTH + 30, 24],
    strike: [SOUTH + 12.6, 7.4],
    ball: [SOUTH + 12, 7],
    target: [SOUTH - 1.6, 0.7, -2.9],
    party: [SOUTH + 3.4, 30.5],
    partyFacing: Math.PI * 0.42,
    runUp: 2.1,
    runOff: 2.9,
    hold: 4.6,
    celebration: ARMS_CROSSED,
    directed: true,
  },
  // Number 8, at the north end: the replay for each project
  saini: {
    goal: "north",
    start: [NORTH - 17.5, 3.2],
    strike: [NORTH - 11.7, 0.3],
    ball: [NORTH - PITCH.penaltySpot, 0],
    target: [NORTH + 1.5, 1.5, -2.5],
    party: [NORTH - 14, 5.5],
    partyFacing: Math.PI * 0.72,
    runUp: 1.05,
    runOff: 1.3,
    hold: 1.9,
    celebration: FIST_UP,
    directed: false,
  },
};

export const KICK_TIME = 0.55; // how long the swing of the leg takes
export const KICK_CONTACT = 0.3; // when, within that, boot meets ball
export const BALL_FLIGHT = 0.5;

export function goalLength(script: GoalScript): number {
  return script.runUp + KICK_TIME + script.runOff + 0.5 + script.hold;
}

// How long each kind of show lasts before the world goes back to normal
export function showLength(show: Show): number {
  if (show.kind === "goal") return goalLength(GOALS[show.scorer]);
  if (show.kind === "fireworks") return 9;
  if (show.kind === "fifteen") return 8;
  // number 66's pass: long enough for the ball to land
  return 4.4;
}
