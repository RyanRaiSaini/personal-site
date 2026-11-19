// ------------------------------------------------------------------
// How a player stands and moves. A pose is a set of joint angles (in
// radians); the functions here return the pose for a moment in time.
// Player.tsx bends the figure to match.
//
// Angle conventions, for a player facing +Z:
//   swing  : arm or leg forward (+) or back (-)
//   spread : arm or leg out to the side, away from the body (+)
//   bend   : elbow or knee folded (+)
//   roll   : arm turned inward (+), so a bent elbow folds across the body
// ------------------------------------------------------------------

export type Limb = { swing: number; spread: number; bend: number; roll?: number };

export type Pose = {
  lift: number; // how far the whole body is raised, metres
  lean: number; // torso tipped forward (+) or back (-)
  twist: number; // torso turned left (+) or right (-)
  head: number; // head tipped up (-) or down (+)
  armL: Limb;
  armR: Limb;
  legL: Limb;
  legR: Limb;
};

const limb = (swing = 0, spread = 0, bend = 0, roll = 0): Limb => ({ swing, spread, bend, roll });

export const STAND: Pose = {
  lift: 0,
  lean: 0,
  twist: 0,
  head: 0,
  armL: limb(0, 0.12, 0.15),
  armR: limb(0, 0.12, 0.15),
  legL: limb(0, 0.04, 0),
  legR: limb(0, 0.04, 0),
};

function mixLimb(a: Limb, b: Limb, t: number): Limb {
  const rollA = a.roll ?? 0;
  const rollB = b.roll ?? 0;
  return { swing: a.swing + (b.swing - a.swing) * t, spread: a.spread + (b.spread - a.spread) * t, bend: a.bend + (b.bend - a.bend) * t, roll: rollA + (rollB - rollA) * t };
}

// Part-way between two poses. t = 0 gives a, t = 1 gives b.
export function mix(a: Pose, b: Pose, t: number): Pose {
  const k = Math.min(1, Math.max(0, t));
  return {
    lift: a.lift + (b.lift - a.lift) * k,
    lean: a.lean + (b.lean - a.lean) * k,
    twist: a.twist + (b.twist - a.twist) * k,
    head: a.head + (b.head - a.head) * k,
    armL: mixLimb(a.armL, b.armL, k),
    armR: mixLimb(a.armR, b.armR, k),
    legL: mixLimb(a.legL, b.legL, k),
    legR: mixLimb(a.legR, b.legR, k),
  };
}

export function ease(t: number): number {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
}

// Standing still, breathing, shifting weight a little
export function idle(time: number, seed = 0): Pose {
  const breathe = Math.sin(time * 1.6 + seed) * 0.015;
  const sway = Math.sin(time * 0.6 + seed * 2) * 0.02;
  return {
    ...STAND,
    lean: 0.02 + breathe,
    twist: sway,
    head: Math.sin(time * 0.4 + seed) * 0.05,
    armL: limb(sway * 0.5, 0.12 + breathe, 0.18),
    armR: limb(-sway * 0.5, 0.12 + breathe, 0.18),
  };
}

// Running. `phase` advances by 2 * PI for every two steps.
export function run(phase: number, effort = 1): Pose {
  const s = Math.sin(phase);
  const c = Math.cos(phase);
  const stride = 0.95 * effort;
  return {
    lift: Math.abs(c) * 0.06 * effort,
    lean: 0.2 * effort,
    twist: s * 0.12,
    head: -0.1,
    armL: limb(-s * 0.9 * effort, 0.08, 1.45),
    armR: limb(s * 0.9 * effort, 0.08, 1.45),
    // the knee folds while its leg swings through from behind
    legL: limb(s * stride, 0.02, Math.max(0, -c) * 1.5 * effort + 0.15),
    legR: limb(-s * stride, 0.02, Math.max(0, c) * 1.5 * effort + 0.15),
  };
}

// A right-footed shot. u runs 0 to 1: wind up, strike, follow through.
export function kick(u: number): Pose {
  const windUp: Pose = {
    lift: 0,
    lean: 0.18,
    twist: 0.35,
    head: 0.15,
    armL: limb(0.5, 0.9, 0.3),
    armR: limb(-0.7, 0.5, 0.5),
    legL: limb(0.25, 0.06, 0.25),
    legR: limb(-0.95, 0.1, 1.5),
  };
  const strike: Pose = {
    lift: 0.02,
    lean: -0.12,
    twist: -0.3,
    head: 0.1,
    armL: limb(-0.5, 1.0, 0.3),
    armR: limb(0.6, 0.5, 0.4),
    legL: limb(-0.2, 0.06, 0.2),
    legR: limb(1.15, 0.02, 0.1),
  };
  const through: Pose = {
    lift: 0.08,
    lean: -0.05,
    twist: -0.45,
    head: 0,
    armL: limb(-0.7, 0.9, 0.4),
    armR: limb(0.8, 0.4, 0.5),
    legL: limb(-0.35, 0.05, 0.5),
    legR: limb(1.45, -0.1, 0.5),
  };
  if (u < 0.45) return mix(run(Math.PI * 0.5), windUp, ease(u / 0.45));
  if (u < 0.62) return mix(windUp, strike, ease((u - 0.45) / 0.17));
  return mix(strike, through, ease((u - 0.62) / 0.38));
}

// Arms flung wide, chest out, chin up
export const ARMS_WIDE: Pose = {
  lift: 0,
  lean: -0.1,
  twist: 0,
  head: -0.22,
  armL: limb(0.05, 1.62, 0.06),
  armR: limb(0.05, 1.62, 0.06),
  legL: limb(0, 0.16, 0),
  legR: limb(0, 0.16, 0),
};

// Arms folded across the chest, hands tucked in, standing tall
export const ARMS_CROSSED: Pose = {
  lift: 0,
  lean: -0.04,
  twist: 0,
  head: -0.12,
  armL: limb(0.5, 0.05, 1.75, 1.35),
  armR: limb(0.38, 0.05, 1.75, 1.35),
  legL: limb(0, 0.2, 0),
  legR: limb(0, 0.2, 0),
};

// One fist in the air
export const FIST_UP: Pose = {
  lift: 0.03,
  lean: -0.06,
  twist: 0.1,
  head: -0.15,
  armL: limb(0, 0.15, 0.3),
  armR: limb(2.75, 0.2, 0.25),
  legL: limb(0, 0.12, 0),
  legR: limb(0, 0.12, 0),
};

// Hands on hips, for standing about
export const HANDS_ON_HIPS: Pose = {
  lift: 0,
  lean: 0.02,
  twist: 0,
  head: 0,
  armL: limb(-0.25, 0.7, 1.7, 0.9),
  armR: limb(-0.25, 0.7, 1.7, 0.9),
  legL: limb(0, 0.12, 0),
  legR: limb(0, 0.12, 0),
};

// One foot resting on a ball
export const FOOT_ON_BALL: Pose = {
  lift: 0,
  lean: 0.03,
  twist: 0,
  head: 0,
  armL: limb(-0.1, 0.5, 1.35),
  armR: limb(0, 0.12, 0.2),
  legL: limb(0, 0.08, 0),
  legR: limb(1.0, 0.06, 1.25),
};

// Sitting on a bench
export const SEATED: Pose = {
  lift: -0.46,
  lean: 0.12,
  twist: 0,
  head: 0,
  armL: limb(0.55, 0.1, 0.7),
  armR: limb(0.55, 0.1, 0.7),
  legL: limb(1.5, 0.12, 1.5),
  legR: limb(1.5, 0.12, 1.5),
};
