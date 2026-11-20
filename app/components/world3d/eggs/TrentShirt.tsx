"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { DoubleSide, Vector3, type Group } from "three";
import { useWorld } from "../../../lib/store";
import { atmo } from "../atmosphere/state";
import { rig } from "../camera/CameraRig";
import { KITS } from "../players/kits";
import { blend, ease, playing, standing } from "../players/moves";
import { loadPlayerNotes, travelAt, type PlayerNotes } from "../players/notes";
import Player, { type PlayerHandle } from "../players/Player";
import { LONG_PASS } from "../players/shows";
import { clickable } from "../rooms/common";
import { shirtTexture } from "../rooms/DressingRoom";
import { BOWL, DUGOUT, PITCH } from "../stadium/dims";
import { useDisplayFont } from "../textures/text";

// ------------------------------------------------------------------
// Number 66's Easter egg. A shirt has been left over the back of a seat
// in the dugout. Click it and he is out on the touchline, hitting a
// ball right across the pitch to the far corner, the way he hits them,
// with the camera watching it go.
//
// To move the shirt, change SEAT (which seat of the bench, counted from
// the end nearest the tunnel). To change the pass, change BALL (where
// it is hit from), LANDING and HEIGHT; its timing is LONG_PASS in
// players/shows.ts.
// ------------------------------------------------------------------

const SEAT = 1;
const SEAT_SPACING = 0.72;
const SEATS = 14;

// The bench on the south side of the tunnel (the one the Experience view looks at)
const BENCH_X = -DUGOUT.x;
const BENCH_Z = -BOWL.hz + DUGOUT.depth / 2 + 0.25;
const SHIRT: [number, number, number] = [BENCH_X + ((SEATS - 1) / 2 - SEAT) * SEAT_SPACING, 1.05, BENCH_Z - DUGOUT.depth / 2 + 0.47];

const BALL_R = 0.11;
// Where the pass is hit from: on the grass, just inside the touchline in front of the bench
const BALL: [number, number] = [SHIRT[0] + 2.6, -PITCH.halfWidth + 1.6];
const LANDING: [number, number, number] = [36, BALL_R, 25];
const HEIGHT = 14; // how high the pass climbs, in metres
// Where the camera stands: behind him and to one side, so the number on his back can be read
const VIEW: [number, number, number] = [BALL[0] - 4.6, 2.2, BALL[1] - 5.4];

const ball = new Vector3();

function turned(facing: number, left: number, front: number): [number, number] {
  const c = Math.cos(facing);
  const s = Math.sin(facing);
  return [left * c + front * s, -left * s + front * c];
}

export default function TrentShirt() {
  const family = useDisplayFont();
  const show = useWorld((s) => s.show);
  const pass = useRef<Group>(null);
  const passer = useRef<PlayerHandle>(null);
  const directing = useRef(false);
  const texture = useMemo(() => (family ? shirtTexture(family, "Alexander-Arnold", 66) : null), [family]);
  useEffect(() => () => texture?.dispose(), [texture]);

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

  // Where he must stand for his boot to meet the ball, and which way he faces
  const plan = useMemo(() => {
    const clip = notes?.clips["long-pass"];
    if (!notes || !clip?.kick) return null;
    const size = (KITS.trent.height ?? notes.height) / notes.height;
    const dx = LANDING[0] - BALL[0];
    const dz = LANDING[2] - BALL[1];
    const reach = Math.hypot(dx, dz);
    const facing = Math.atan2(dx, dz);
    const [footX, footZ] = turned(facing, clip.kick.where[0] * size, clip.kick.where[2] * size);
    return { clip, size, facing, origin: [BALL[0] - (dx / reach) * 0.14 - footX, BALL[1] - (dz / reach) * 0.14 - footZ] as [number, number], tClip: LONG_PASS.contact - clip.kick.at };
  }, [notes]);

  const trigger = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    // the end of a drag is not a click
    if (event.delta > 6) return;
    const world = useWorld.getState();
    if (world.show) return;
    world.findEgg("trent");
    world.startShow({ kind: "trent" });
  };

  useFrame(() => {
    const current = useWorld.getState().show;
    if (current?.kind !== "trent") {
      if (pass.current) pass.current.visible = false;
      if (directing.current) {
        directing.current = false;
        rig.override = null;
      }
      return;
    }
    const t = (performance.now() - current.startedAt) / 1000;

    // the passer: a moment standing over it, then the motion capture carries him through the ball
    if (plan && passer.current) {
      const into = t - plan.tClip;
      const [left, front] = into > 0 ? travelAt(plan.clip, into) : [0, 0];
      const [mx, mz] = turned(plan.facing, left * plan.size, front * plan.size);
      passer.current.group.position.set(plan.origin[0] + mx, 0, plan.origin[1] + mz);
      passer.current.group.rotation.y = plan.facing;
      passer.current.play(blend(standing(atmo.time), playing("long-pass", Math.max(0, into)), ease((into + 0.15) / 0.15)));
    }

    // a long, high arc from his boot to the far corner
    const u = Math.min(1, Math.max(0, (t - LONG_PASS.contact) / LONG_PASS.flight));
    ball.set(BALL[0] + (LANDING[0] - BALL[0]) * u, BALL_R + HEIGHT * 4 * u * (1 - u), BALL[1] + (LANDING[2] - BALL[1]) * u);
    if (pass.current) {
      pass.current.visible = true;
      pass.current.position.copy(ball);
      if (u > 0) pass.current.rotation.set(t * 7, t * 3, 0);
    }

    // the camera watches him hit it, then follows the ball out
    directing.current = true;
    rig.overrideStiffness = 3.4;
    rig.override = {
      position: VIEW,
      target: [ball.x, Math.max(1.1, ball.y * 0.8), ball.z],
      fov: 42,
    };
  });

  if (!texture) return null;
  return (
    <>
      {/* the shirt, leaning on the seat's back */}
      <group position={SHIRT} rotation={[-0.2, 0, 0]}>
        <mesh>
          <planeGeometry args={[0.66, 0.74]} />
          <meshStandardMaterial map={texture} transparent alphaTest={0.4} side={DoubleSide} forceSinglePass roughness={0.9} />
        </mesh>
        {/* a larger, unseen target, so it is not a fiddly thing to hit */}
        <mesh onClick={trigger} {...clickable}>
          <boxGeometry args={[1.1, 1.2, 0.5]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
      {/* he is only here while the pass is being hit */}
      {show?.kind === "trent" && <Player ref={passer} kit={KITS.trent} />}
      <group ref={pass} visible={false}>
        <mesh castShadow>
          <sphereGeometry args={[BALL_R, 20, 14]} />
          <meshStandardMaterial color="#f4f4f1" roughness={0.45} />
        </mesh>
      </group>
    </>
  );
}
