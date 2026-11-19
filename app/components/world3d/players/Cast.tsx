"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { DoubleSide, type Group, type Mesh, type MeshBasicMaterial } from "three";
import { useWorld } from "../../../lib/store";
import type { SectionId } from "../../../sections/registry";
import { atmo } from "../atmosphere/state";
import { rig } from "../camera/CameraRig";
import { clickable } from "../rooms/common";
import { PITCH } from "../stadium/dims";
import { netKick } from "../stadium/Goals";
import { canvasTexture } from "../textures/canvas";
import { KITS } from "./kits";
import Player, { type PlayerHandle } from "./Player";
import { ARMS_CROSSED, ease, FOOT_ON_BALL, HANDS_ON_HIPS, idle, kick, mix, run, STAND, type Pose } from "./poses";
import { BALL_FLIGHT, GOALS, goalLength, KICK_CONTACT, KICK_TIME, showLength, type Scorer } from "./shows";

// ------------------------------------------------------------------
// The players out on the pitch, and the director of every goal.
//
//   - Number 8 (me) stands wherever the open section is.
//   - Clicking the ball on the south penalty spot brings on Jude
//     Bellingham; clicking the south-east corner flag brings on
//     Kylian Mbappé. Each scores and celebrates.
//   - Opening a project replays a goal by number 8 at the north end.
//
// The scripts (positions, timings, celebrations) are in shows.ts.
// ------------------------------------------------------------------

const BALL_R = 0.11;

// Where number 8 waits in each section: [x, z], the way he faces, and his pose
const REST: Partial<Record<SectionId, { at: [number, number]; facing: number; pose: Pose }>> = {
  home: { at: [0, 0], facing: 0.4, pose: FOOT_ON_BALL },
  about: { at: [0, 0], facing: 0.62, pose: FOOT_ON_BALL },
  projects: { at: [PITCH.halfLength - 13.4, 3.6], facing: Math.PI * 0.42, pose: HANDS_ON_HIPS },
  experience: { at: [-15.2, -38.3], facing: 0.55, pose: ARMS_CROSSED },
};

function ballTexture() {
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
      <meshBasicMaterial color={[1.6, 1.3, 0.5]} transparent opacity={0.6} depthWrite={false} side={DoubleSide} toneMapped={false} />
    </mesh>
  );
}

export default function Cast() {
  const show = useWorld((s) => s.show);
  const introDone = useWorld((s) => s.introDone);
  const saini = useRef<PlayerHandle>(null);
  const guest = useRef<PlayerHandle>(null);
  const centreBall = useRef<Group>(null);
  const northBall = useRef<Group>(null);
  const southBall = useRef<Group>(null);
  const scored = useRef(false);
  const directing = useRef(false);
  const leather = useMemo(() => ballTexture(), []);
  useEffect(() => () => leather.dispose(), [leather]);

  const guestWho: Scorer | null = show?.kind === "goal" && show.scorer !== "saini" ? show.scorer : null;
  const idleNow = !show && introDone;

  // A new show starts with nobody having scored yet
  useEffect(() => {
    scored.current = false;
  }, [show]);

  const start = (scorer: "jude" | "mbappe") => {
    const world = useWorld.getState();
    if (world.show || !world.introDone) return;
    world.findEgg(scorer);
    world.startShow({ kind: "goal", scorer, label: scorer === "jude" ? "BELLINGHAM  5" : "MBAPPÉ  10" });
  };

  // A click only counts if the pointer stayed put. Letting go at the end
  // of a drag that turned the camera should not set off a goal.
  const click = (event: ThreeEvent<MouseEvent>, scorer: "jude" | "mbappe") => {
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
        me.setPose(mix(rest.pose, idle(atmo.time, 2), 0.18));
        // The centre ball sits under his raised foot, or on the centre spot
        if (centreBall.current) {
          if (rest.pose === FOOT_ON_BALL) {
            const lx = -0.11;
            const lz = 0.31;
            const c = Math.cos(rest.facing);
            const s = Math.sin(rest.facing);
            centreBall.current.position.set(rest.at[0] + lx * c + lz * s, BALL_R, rest.at[1] - lx * s + lz * c);
          } else centreBall.current.position.set(0, BALL_R, 0);
        }
      }
    }

    const balls = { north: northBall.current, south: southBall.current };

    if (!goal) {
      // Everything back to its mark
      if (balls.north) balls.north.position.set(GOALS.saini.ball[0], BALL_R, GOALS.saini.ball[1]);
      if (balls.south) balls.south.position.set(GOALS.jude.ball[0], BALL_R, GOALS.jude.ball[1]);
      if (directing.current) {
        directing.current = false;
        rig.override = null;
      }
      // Other shows end on a timer
      if (current && (performance.now() - current.startedAt) / 1000 > showLength(current)) world.startShow(null);
      return;
    }

    const script = GOALS[goal.scorer];
    const player = goal.scorer === "saini" ? me : guest.current;
    const ball = balls[script.goal];
    const t = (performance.now() - goal.startedAt) / 1000;

    const tKick = script.runUp;
    const tContact = tKick + KICK_TIME * KICK_CONTACT;
    const tKickEnd = tKick + KICK_TIME;
    const tParty = tKickEnd + script.runOff;
    const tHold = tParty + 0.5;

    const goalX = script.goal === "south" ? -PITCH.halfLength : PITCH.halfLength;
    let x: number;
    let z: number;
    let facing: number;
    let pose: Pose;

    if (t < tKick) {
      // the run-up
      const u = ease(t / tKick);
      x = script.start[0] + (script.strike[0] - script.start[0]) * u;
      z = script.start[1] + (script.strike[1] - script.start[1]) * u;
      facing = turnToward(script.strike[0] - script.start[0], script.strike[1] - script.start[1]);
      const distance = Math.hypot(script.strike[0] - script.start[0], script.strike[1] - script.start[1]) * u;
      pose = mix(STAND, run(distance * 2.3), Math.min(1, t * 5));
    } else if (t < tKickEnd) {
      // the shot
      x = script.strike[0];
      z = script.strike[1];
      facing = turnToward(script.target[0] - script.ball[0], script.target[2] - script.ball[1]);
      pose = kick((t - tKick) / KICK_TIME);
    } else if (t < tParty) {
      // wheeling away
      const u = ease((t - tKickEnd) / script.runOff);
      x = script.strike[0] + (script.party[0] - script.strike[0]) * u;
      z = script.strike[1] + (script.party[1] - script.strike[1]) * u;
      const travel = turnToward(script.party[0] - script.strike[0], script.party[1] - script.strike[1]);
      const shotDir = turnToward(script.target[0] - script.ball[0], script.target[2] - script.ball[1]);
      facing = mixAngle(shotDir, travel, Math.min(1, (t - tKickEnd) * 3));
      const distance = Math.hypot(script.party[0] - script.strike[0], script.party[1] - script.strike[1]) * u;
      // already starting to open up near the end of the run
      pose = mix(run(distance * 2.1, 0.9), script.celebration, ease((u - 0.72) / 0.28) * 0.5);
    } else {
      // the celebration
      x = script.party[0];
      z = script.party[1];
      const travel = turnToward(script.party[0] - script.strike[0], script.party[1] - script.strike[1]);
      const settle = ease((t - tParty) / 0.5);
      facing = mixAngle(travel, script.partyFacing, settle);
      const breathing = Math.sin(atmo.time * 2.2) * 0.02;
      pose = mix(mix(run(0, 0.4), script.celebration, 0.5 + settle * 0.5), { ...script.celebration, lean: script.celebration.lean + breathing }, settle);
    }

    if (player) {
      player.group.position.set(x, 0, z);
      player.group.rotation.y = facing;
      player.setPose(pose);
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
      const toGoal = Math.sign(goalX - script.strike[0]);
      if (t < tContact + BALL_FLIGHT + 0.55) {
        // behind the taker, looking at the goal
        rig.override = {
          position: [script.strike[0] - toGoal * 8.5, 2.3, script.strike[1] + 3.4],
          target: [goalX, 1.5, script.target[2] * 0.4],
          fov: 40,
        };
      } else if (t < tHold) {
        // running alongside
        rig.override = {
          position: [x + toGoal * -5.5, 1.9, z + (script.party[1] > script.strike[1] ? -4.5 : 4.5) * 0.9],
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
      <group ref={southBall} position={[GOALS.jude.ball[0], BALL_R, GOALS.jude.ball[1]]}>
        <mesh castShadow>
          <sphereGeometry args={[BALL_R, 24, 16]} />
          <meshStandardMaterial map={leather} roughness={0.42} />
        </mesh>
        {/* a generous invisible target, so it is easy to hit from far away */}
        <mesh onClick={(e) => click(e, "jude")} {...clickable}>
          <sphereGeometry args={[2.2, 12, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
      {/* the south-east corner flag: click it. The target is much bigger than
          the flag, which is only a few pixels wide from across the stadium */}
      <mesh position={[-PITCH.halfLength, 2.4, PITCH.halfWidth]} onClick={(e) => click(e, "mbappe")} {...clickable}>
        <cylinderGeometry args={[3, 3, 4.8, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {idleNow && <HintRing x={GOALS.jude.ball[0]} z={GOALS.jude.ball[1]} />}
      {idleNow && <HintRing x={-PITCH.halfLength} z={PITCH.halfWidth} />}
    </group>
  );
}
