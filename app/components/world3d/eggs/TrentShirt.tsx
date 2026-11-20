"use client";

import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { DoubleSide, Vector3, type Group } from "three";
import { useWorld } from "../../../lib/store";
import { rig } from "../camera/CameraRig";
import { clickable } from "../rooms/common";
import { shirtTexture } from "../rooms/DressingRoom";
import { BOWL, DUGOUT } from "../stadium/dims";
import { useDisplayFont } from "../textures/text";

// ------------------------------------------------------------------
// Number 66's Easter egg. A shirt has been left over the back of a seat
// in the dugout. Click it and a ball is hit from the bench right across
// the pitch to the far corner, the way he hits them, with the camera
// watching it go.
//
// To move the shirt, change SEAT (which seat of the bench, counted from
// the end nearest the tunnel). To change the pass, change LANDING,
// HEIGHT and FLIGHT.
// ------------------------------------------------------------------

const SEAT = 1;
const SEAT_SPACING = 0.72;
const SEATS = 14;

// The bench on the south side of the tunnel (the one the Experience view looks at)
const BENCH_X = -DUGOUT.x;
const BENCH_Z = -BOWL.hz + DUGOUT.depth / 2 + 0.25;
const SHIRT: [number, number, number] = [BENCH_X + ((SEATS - 1) / 2 - SEAT) * SEAT_SPACING, 1.05, BENCH_Z - DUGOUT.depth / 2 + 0.47];

const LANDING: [number, number, number] = [36, 0.11, 25];
const HEIGHT = 14; // how high the pass climbs, in metres
const WIND_UP = 0.35; // seconds before the ball leaves
const FLIGHT = 2.5; // seconds in the air

const ball = new Vector3();

export default function TrentShirt() {
  const family = useDisplayFont();
  const pass = useRef<Group>(null);
  const directing = useRef(false);
  const texture = useMemo(() => (family ? shirtTexture(family, "Alexander-Arnold", 66) : null), [family]);
  useEffect(() => () => texture?.dispose(), [texture]);

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
    const show = useWorld.getState().show;
    if (show?.kind !== "trent") {
      if (pass.current) pass.current.visible = false;
      if (directing.current) {
        directing.current = false;
        rig.override = null;
      }
      return;
    }
    const t = (performance.now() - show.startedAt) / 1000;
    const u = Math.min(1, Math.max(0, (t - WIND_UP) / FLIGHT));
    // a long, high arc from the bench to the far corner
    ball.set(SHIRT[0] + (LANDING[0] - SHIRT[0]) * u, SHIRT[1] + (LANDING[1] - SHIRT[1]) * u + HEIGHT * 4 * u * (1 - u), SHIRT[2] + 1.2 + (LANDING[2] - SHIRT[2] - 1.2) * u);
    if (pass.current) {
      pass.current.visible = t > WIND_UP;
      pass.current.position.copy(ball);
      pass.current.rotation.set(t * 7, t * 3, 0);
    }
    // the camera stands behind the bench and follows the ball out
    directing.current = true;
    rig.overrideStiffness = 3.4;
    rig.override = {
      position: [SHIRT[0] - 7.5, 6.2, SHIRT[2] - 7.5],
      target: [ball.x, Math.max(1.2, ball.y * 0.8), ball.z],
      fov: 40,
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
      <group ref={pass} visible={false}>
        <mesh castShadow>
          <sphereGeometry args={[0.11, 20, 14]} />
          <meshStandardMaterial color="#f4f4f1" roughness={0.45} />
        </mesh>
      </group>
    </>
  );
}
