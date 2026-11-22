"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { DoubleSide, type Group, type Mesh, type MeshBasicMaterial } from "three";
import { useWorld } from "../../../lib/store";
import type { SectionId } from "../../../sections/registry";
import { atmo } from "../atmosphere/state";
import { rig } from "../camera/CameraRig";
import { clickable } from "../rooms/common";
import { PITCH } from "../stadium/dims";
import { netKick } from "../stadium/Goals";
import { canvasTexture } from "../textures/canvas";
import { KITS, type Kit } from "./kits";
import { blend, ease, playing, standing, type Layer, type Stance } from "./moves";
import { loadPlayerNotes, travelAt, type ClipNote, type PlayerNotes } from "./notes";
import Player, { type PlayerHandle } from "./Player";
import { AWAY_AFTER, BALL_FLIGHT, GOALS, goalLength, showLength, type GoalScript, type Scorer } from "./shows";

// ------------------------------------------------------------------
// The players out on the pitch, and the director of every goal.
//
//   - Number 8 (me) stands wherever the open section is.
//   - Clicking the ball on the south penalty spot brings on number 6;
//     clicking the south-east corner flag brings on number 10. Each
//     scores past a goalkeeper and celebrates. Neither is named.
//   - Opening a project replays a goal by number 8 at the north end,
//     past the same goalkeeper.
//
// The scripts (positions, timings, celebrations) are in shows.ts. The
// movements are motion capture that comes with the player model; this
// file only says which one to play when, and where the player is.
// ------------------------------------------------------------------

const BALL_R = 0.11;

// Where number 8 waits in each section: [x, z], the way he faces, and how he stands
const REST: Partial<Record<SectionId, { at: [number, number]; facing: number; stances: Stance[] }>> = {
  home: { at: [0, 0], facing: 0.4, stances: ["foot", "hips"] },
  about: { at: [0, 0], facing: 0.62, stances: ["foot", "hips"] },
  projects: { at: [PITCH.halfLength - 13.4, 3.6], facing: Math.PI * 0.42, stances: ["hips"] },
  experience: { at: [-15.2, -38.3], facing: 0.55, stances: ["folded"] },
};

// Where the ball under his foot is, measured from him: to his right and in front
// (the same place the "foot" pose was built for: blender/players/stances.py)
const UNDER_FOOT = { x: -0.11, z: 0.31 };

export function ballTexture() {
  return canvasTexture(
    256,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = "#f6f6f3";
      ctx.fillRect(0, 0, w, h);
      // dark five-sided patches, spread round the ball
      ctx.fillStyle = "#16181d";
      const spots: [number, number][] = [
        [0.08, 0.5],
        [0.33, 0.28],
        [0.33, 0.74],
        [0.58, 0.5],
        [0.83, 0.28],
        [0.83, 0.74],
        [0.2, 0.06],
        [0.7, 0.95],
      ];
      for (const [u, v] of spots) {
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
          const x = u * w + Math.cos(a) * 15;
          const y = v * h + Math.sin(a) * 13;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
      }
    },
    { repeat: false },
  );
}

function turnToward(dx: number, dz: number): number {
  return Math.atan2(dx, dz);
}

function mixAngle(a: number, b: number, t: number): number {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}

// From a player's own directions (to his left, in front of him) to the pitch's, for a player facing `facing`
function turned(facing: number, left: number, front: number): [number, number] {
  const c = Math.cos(facing);
  const s = Math.sin(facing);
  return [left * c + front * s, -left * s + front * c];
}

// A run that builds up, holds its pace and eases off: how far along he is, for u from 0 to 1
function glide(u: number): number {
  const k = Math.min(1, Math.max(0, u));
  const ramp = 0.2;
  const area = 1 - ramp;
  if (k < ramp) return (k * k) / (2 * ramp) / area;
  if (k > 1 - ramp) return 1 - ((1 - k) * (1 - k)) / (2 * ramp) / area;
  return (k - ramp / 2) / area;
}

function sizeOf(kit: Kit, notes: PlayerNotes) {
  return (kit.height ?? notes.height) / notes.height;
}

// Everything about a goal that follows from its script and the kick's
// motion capture: where the scorer must stand for his boot to meet the
// ball, and when each part of the move begins.
type Plan = {
  clip: ClipNote;
  size: number;
  facing: number; // the way the shot goes
  origin: [number, number]; // where he is when the kick's own movement begins
  away: [number, number]; // where he is when he turns away to celebrate
  tClip: number;
  tAway: number;
  tParty: number;
  tHold: number;
};

function planOf(script: GoalScript, notes: PlayerNotes, kit: Kit): Plan | null {
  const clip = notes.clips[script.kick];
  if (!clip?.kick) return null;
  const size = sizeOf(kit, notes);
  const dx = script.target[0] - script.ball[0];
  const dz = script.target[2] - script.ball[1];
  const reach = Math.hypot(dx, dz);
  const facing = turnToward(dx, dz);
  // stand so that the kicking foot arrives just behind the ball
  const [footX, footZ] = turned(facing, clip.kick.where[0] * size, clip.kick.where[2] * size);
  const origin: [number, number] = [script.ball[0] - (dx / reach) * 0.14 - footX, script.ball[1] - (dz / reach) * 0.14 - footZ];
  const gone = travelAt(clip, clip.kick.at + AWAY_AFTER);
  const [goneX, goneZ] = turned(facing, gone[0] * size, gone[1] * size);
  const tAway = script.contact + AWAY_AFTER;
  const tParty = tAway + script.runOff;
  return { clip, size, facing, origin, away: [origin[0] + goneX, origin[1] + goneZ], tClip: script.contact - clip.kick.at, tAway, tParty, tHold: tParty + 0.5 };
}

// As recorded the goalkeeper dives to his right. Which way that is on
// the pitch depends on which goal he is in; when the script wants the
// other way he is shown as in a mirror, and his shirt is printed to suit.
function keeperMirrored(script: GoalScript): boolean {
  const look = turnToward(script.goal === "south" ? 1 : -1, 0);
  const recorded = turned(look, -1, 0)[1];
  const wanted = (script.keeper === "wrong" ? -1 : 1) * Math.sign(script.target[2] || 1);
  return Math.sign(recorded) !== wanted;
}

// A gold ring on the grass that hints something can be clicked
function HintRing({ x, z }: { x: number; z: number }) {
  const ring = useRef<Mesh>(null);
  useFrame(() => {
    if (!ring.current) return;
    const pulse = (atmo.time * 0.6) % 1;
    ring.current.scale.setScalar(0.7 + pulse * 1.1);
    (ring.current.material as MeshBasicMaterial).opacity = (1 - pulse) * 0.75;
  });
  return (
    <mesh ref={ring} position={[x, 0.03, z]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.62, 0.72, 40]} />
      <meshBasicMaterial color={[1.6, 1.3, 0.5]} transparent opacity={0.6} depthWrite={false} side={DoubleSide} forceSinglePass toneMapped={false} />
    </mesh>
  );
}

export default function Cast() {
  const show = useWorld((s) => s.show);
  const introDone = useWorld((s) => s.introDone);
  const saini = useRef<PlayerHandle>(null);
  const guest = useRef<PlayerHandle>(null);
  const keeper = useRef<PlayerHandle>(null);
  const centreBall = useRef<Group>(null);
  const northBall = useRef<Group>(null);
  const southBall = useRef<Group>(null);
  const scored = useRef(false);
  const directing = useRef(false);
  const leather = useMemo(() => ballTexture(), []);
  useEffect(() => () => leather.dispose(), [leather]);

  // the numbers that come with the player model
  const [notes, setNotes] = useState<PlayerNotes | null>(null);
  useEffect(() => {
    let alive = true;
    loadPlayerNotes()
      .then((loaded) => alive && setNotes(loaded))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const guestWho: Exclude<Scorer, "saini"> | null = show?.kind === "goal" && show.scorer !== "saini" ? show.scorer : null;
  const section = useWorld((s) => s.section);
  // The goalkeeper is in goal for any goal whose script has one. While
  // Projects is open he waits in the north goal, ready for number 8's.
  const keeperIn: Scorer | null = show?.kind === "goal" ? (GOALS[show.scorer].keeper ? show.scorer : null) : section === "projects" ? "saini" : null;
  const idleNow = !show && introDone;

  // A new show starts with nobody having scored yet
  useEffect(() => {
    scored.current = false;
  }, [show]);

  const plans = useMemo(() => {
    if (!notes) return null;
    return { saini: planOf(GOALS.saini, notes, KITS.saini), six: planOf(GOALS.six, notes, KITS.six), ten: planOf(GOALS.ten, notes, KITS.ten) };
  }, [notes]);

  const start = (scorer: "six" | "ten") => {
    const world = useWorld.getState();
    if (world.show || !world.introDone) return;
    world.findEgg(scorer === "six" ? "penalty" : "corner");
    world.startShow({ kind: "goal", scorer, label: `NUMBER ${KITS[scorer].number}` });
  };

  // A click only counts if the pointer stayed put. Letting go at the end
  // of a drag that turned the camera should not set off a goal.
  const click = (event: ThreeEvent<MouseEvent>, scorer: "six" | "ten") => {
    if (event.delta > 6) return;
    start(scorer);
  };

  useFrame((frame) => {
    const world = useWorld.getState();
    const current = world.show;
    const goal = current?.kind === "goal" ? current : null;
    const me = saini.current;

    // Number 8 waits at the open section's spot, unless he is the scorer
    if (me && !(goal && goal.scorer === "saini")) {
      const rest = REST[world.section] ?? REST.home;
      if (rest) {
        me.group.position.set(rest.at[0], 0, rest.at[1]);
        me.group.rotation.y = rest.facing;
        me.play(standing(atmo.time, rest.stances));
        // The centre ball sits under his raised foot, or on the centre spot
        if (centreBall.current) {
          if (rest.stances.includes("foot")) {
            const [bx, bz] = turned(rest.facing, UNDER_FOOT.x, UNDER_FOOT.z);
            centreBall.current.position.set(rest.at[0] + bx, BALL_R, rest.at[1] + bz);
          } else centreBall.current.position.set(0, BALL_R, 0);
        }
      }
    }

    const balls = { north: northBall.current, south: southBall.current };
    const plan = goal && plans ? plans[goal.scorer] : null;

    if (!goal || !plan || !notes) {
      // Everything back to its mark
      if (balls.north) balls.north.position.set(GOALS.saini.ball[0], BALL_R, GOALS.saini.ball[1]);
      if (balls.south) balls.south.position.set(GOALS.six.ball[0], BALL_R, GOALS.six.ball[1]);
      if (directing.current) {
        directing.current = false;
        rig.override = null;
      }
      // With Projects open the goalkeeper stands on his line in the north goal
      const waiting = keeper.current;
      if (waiting && !goal && world.section === "projects") {
        const look = turnToward(-1, 0);
        waiting.group.position.set(PITCH.halfLength - 0.7, 0, 0);
        waiting.group.rotation.y = look;
        waiting.group.scale.x = keeperMirrored(GOALS.saini) ? -1 : 1;
        waiting.play(playing("keeper-ready", atmo.time));
      }
      // Shows end on a timer
      if (current && (performance.now() - current.startedAt) / 1000 > showLength(current)) world.startShow(null);
      return;
    }

    const script = GOALS[goal.scorer];
    const player = goal.scorer === "saini" ? me : guest.current;
    const ball = balls[script.goal];
    const t = (performance.now() - goal.startedAt) / 1000;
    const { clip, size, tClip, tAway, tParty, tHold } = plan;
    const tContact = script.contact;
    const goalX = script.goal === "south" ? -PITCH.halfLength : PITCH.halfLength;
    const runSpeed = (notes.clips.run.speed ?? 4.3) * size;

    const celebrating = (since: number): Layer[] => ("stance" in script.celebration ? standing(atmo.time, [script.celebration.stance]) : playing(script.celebration.clip, Math.max(0, since)));

    let x: number;
    let z: number;
    let facing: number;
    let layers: Layer[];

    if (t < tClip) {
      // coming to the ball
      const into = ease((t - (tClip - 0.14)) / 0.14);
      if (script.approach) {
        const from = script.approach.from;
        const u = Math.max(0, t / tClip);
        x = from[0] + (plan.origin[0] - from[0]) * u;
        z = from[1] + (plan.origin[1] - from[1]) * u;
        const far = Math.hypot(plan.origin[0] - from[0], plan.origin[1] - from[1]);
        const pace = (notes.clips[script.approach.gait].speed ?? 3) * size;
        facing = mixAngle(turnToward(plan.origin[0] - from[0], plan.origin[1] - from[1]), plan.facing, ease((t - (tClip - 0.35)) / 0.35));
        layers = blend(playing(script.approach.gait, (far * u) / pace), playing(script.kick, 0), into);
      } else {
        // a penalty: he stands over it first
        x = plan.origin[0];
        z = plan.origin[1];
        facing = plan.facing;
        layers = blend(standing(atmo.time), playing(script.kick, 0), into);
      }
    } else if (t < tAway) {
      // the kick: the motion capture carries him through the ball
      const [left, front] = travelAt(clip, t - tClip);
      const [mx, mz] = turned(plan.facing, left * size, front * size);
      x = plan.origin[0] + mx;
      z = plan.origin[1] + mz;
      facing = plan.facing;
      layers = playing(script.kick, t - tClip);
    } else {
      const far = Math.hypot(script.party[0] - plan.away[0], script.party[1] - plan.away[1]);
      const travel = turnToward(script.party[0] - plan.away[0], script.party[1] - plan.away[1]);
      if (t < tParty) {
        // wheeling away
        const u = (t - tAway) / script.runOff;
        const along = glide(u);
        x = plan.away[0] + (script.party[0] - plan.away[0]) * along;
        z = plan.away[1] + (script.party[1] - plan.away[1]) * along;
        facing = mixAngle(plan.facing, travel, Math.min(1, (t - tAway) * 3));
        const running = blend(playing(script.kick, t - tClip), playing("run", (far * along) / runSpeed), Math.min(1, (t - tAway) / 0.28));
        // already starting to open up near the end of the run
        layers = blend(running, celebrating(t - tParty + 0.35), ease((u - 0.8) / 0.2) * 0.5);
      } else {
        // the celebration
        x = script.party[0];
        z = script.party[1];
        const settle = ease((t - tParty) / 0.5);
        facing = mixAngle(travel, script.partyFacing, settle);
        layers = blend(playing("run", far / runSpeed), celebrating(t - tParty + 0.35), 0.5 + settle * 0.5);
      }
    }

    if (player) {
      player.group.position.set(x, 0, z);
      player.group.rotation.y = facing;
      player.play(layers);
    }

    // The goalkeeper: set, then a full-stretch dive
    const stopper = keeper.current;
    const dive = notes.clips["keeper-dive"];
    if (stopper && script.keeper && dive) {
      const tall = sizeOf(KITS.keeper, notes);
      const out = -Math.sign(goalX); // from the goal line toward the pitch
      const lineX = goalX + out * 0.7;
      const look = turnToward(out, 0);
      const flip = keeperMirrored(script);
      // "wrong": at full stretch as the ball goes in the other side. "late": the right way, a moment too slow.
      const tDive = tContact + BALL_FLIGHT - (script.keeper === "wrong" ? 0.95 : 0.6);
      const into = ease((t - (tDive - 0.15)) / 0.15);
      const [left, front] = t > tDive ? travelAt(dive, t - tDive) : [0, 0];
      const [mx, mz] = turned(look, (flip ? -left : left) * tall, front * tall);
      stopper.group.position.set(lineX + mx, 0, mz);
      stopper.group.rotation.y = look;
      stopper.group.scale.x = flip ? -1 : 1;
      stopper.play(blend(playing("keeper-ready", atmo.time), playing("keeper-dive", Math.max(0, t - tDive)), into));
    }

    // The ball: waiting, flying, then lying in the net
    if (ball) {
      if (t < tContact) ball.position.set(script.ball[0], BALL_R, script.ball[1]);
      else {
        const v = (t - tContact) / BALL_FLIGHT;
        if (v < 1) {
          ball.position.set(script.ball[0] + (script.target[0] - script.ball[0]) * v, BALL_R + (script.target[1] - BALL_R) * v + Math.sin(Math.PI * v) * 0.35, script.ball[1] + (script.target[2] - script.ball[1]) * v);
          ball.rotation.x += 0.5;
          ball.rotation.z += 0.3;
        } else {
          const fall = Math.min(1, (v - 1) * 1.6);
          ball.position.set(script.target[0], BALL_R + (script.target[1] - BALL_R) * (1 - fall) * (1 - fall), script.target[2]);
        }
      }
    }

    if (!scored.current && t >= tContact + BALL_FLIGHT) {
      scored.current = true;
      netKick[script.goal] = frame.clock.elapsedTime;
      world.cheer();
    }

    // The camera, for the two guest stars
    if (script.directed) {
      directing.current = true;
      rig.overrideStiffness = 3.2;
      const toGoal = Math.sign(goalX - script.ball[0]);
      if (t < tContact + BALL_FLIGHT + 0.55) {
        // behind the taker, looking at the goal
        rig.override = {
          position: [script.ball[0] - toGoal * 9.5, 2.3, script.ball[1] + 3.6],
          target: [goalX, 1.5, script.target[2] * 0.4],
          fov: 40,
        };
      } else if (t < tHold) {
        // running alongside
        rig.override = {
          position: [x + toGoal * -5.5, 1.9, z + (script.party[1] > script.ball[1] ? -4.5 : 4.5) * 0.9],
          target: [x, 1.25, z],
          fov: 42,
        };
      } else {
        // a slow turn round him, ending behind so the name can be read
        const angle = script.partyFacing - 0.3 + (t - tHold) * (2.9 / script.hold);
        rig.override = {
          position: [x + Math.sin(angle) * 4.3, 1.5, z + Math.cos(angle) * 4.3],
          target: [x, 1.28, z],
          fov: 38,
        };
      }
    }

    if (t >= goalLength(script)) world.startShow(null);
  });

  return (
    <group>
      <Player ref={saini} kit={KITS.saini} />
      {guestWho && <Player key={guestWho} ref={guest} kit={KITS[guestWho]} />}
      {keeperIn && <Player key={keeperIn} ref={keeper} kit={KITS.keeper} mirrored={keeperMirrored(GOALS[keeperIn])} />}

      {/* the ball under number 8's foot at the centre spot */}
      <group ref={centreBall} position={[-0.14, BALL_R, 0.27]}>
        <mesh castShadow>
          <sphereGeometry args={[BALL_R, 24, 16]} />
          <meshStandardMaterial map={leather} roughness={0.42} />
        </mesh>
      </group>
      {/* the ball on the north penalty spot, for the project replays */}
      <group ref={northBall} position={[GOALS.saini.ball[0], BALL_R, GOALS.saini.ball[1]]}>
        <mesh castShadow>
          <sphereGeometry args={[BALL_R, 24, 16]} />
          <meshStandardMaterial map={leather} roughness={0.42} />
        </mesh>
      </group>
      {/* the ball on the south penalty spot: click it */}
      <group ref={southBall} position={[GOALS.six.ball[0], BALL_R, GOALS.six.ball[1]]}>
        <mesh castShadow>
          <sphereGeometry args={[BALL_R, 24, 16]} />
          <meshStandardMaterial map={leather} roughness={0.42} />
        </mesh>
        {/* a generous invisible target, so it is easy to hit from far away */}
        <mesh onClick={(e) => click(e, "six")} {...clickable}>
          <sphereGeometry args={[2.2, 12, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
      {/* the south-east corner flag: click it. The target is much bigger than
          the flag, which is only a few pixels wide from across the stadium */}
      <mesh position={[-PITCH.halfLength, 2.4, PITCH.halfWidth]} onClick={(e) => click(e, "ten")} {...clickable}>
        <cylinderGeometry args={[3, 3, 4.8, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {idleNow && <HintRing x={GOALS.six.ball[0]} z={GOALS.six.ball[1]} />}
      {idleNow && <HintRing x={-PITCH.halfLength} z={PITCH.halfWidth} />}
    </group>
  );
}
