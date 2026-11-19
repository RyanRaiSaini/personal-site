"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useWorld } from "../../../lib/store";
import { atmo } from "../atmosphere/state";
import { BOWL, TUNNEL } from "../stadium/dims";
import { rig } from "./CameraRig";

// The walk-out. On a first visit to the home page the camera starts
// deep in the players' tunnel, walks to the light, steps out onto the
// pitch and looks up at the stands. Then the camera rig takes over and
// flies up to the view of the whole stadium.
//
// Timings are in seconds; the path is along the tunnel (the Z axis).

const WALK = 3.6; // down the tunnel
const EMERGE = 2.3; // out onto the grass, looking up
const TOTAL = WALK + EMERGE;

const MOUTH = -BOWL.hz + 2.2;
const START = -BOWL.hz - TUNNEL.length + 3.5;

function ease(t: number) {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
}

export function finishIntro() {
  try {
    sessionStorage.setItem("intro", "1");
  } catch {
    // Private browsing: it will just play again next time
  }
  document.documentElement.dataset.intro = "done";
  useWorld.getState().setIntroDone(true);
}

export default function Intro() {
  const startedAt = useRef<number | null>(null);
  const steering = useRef(false);

  useFrame(() => {
    const world = useWorld.getState();
    if (world.introDone || world.section !== "home") {
      if (steering.current) {
        steering.current = false;
        rig.override = null;
      }
      return;
    }
    if (!world.worldReady) return;

    if (startedAt.current === null) {
      startedAt.current = atmo.time;
      rig.snapOverride = true;
    }
    const t = atmo.time - startedAt.current;
    steering.current = true;
    rig.overrideStiffness = 7;

    if (t < WALK) {
      // walking: a slow start, a steady pace, a little bob with each step
      const u = ease(t / WALK) * 0.55 + (t / WALK) * 0.45;
      const z = START + (MOUTH - START) * u;
      const step = t * 6.4;
      rig.override = {
        position: [Math.sin(step * 0.5) * 0.05, 1.72 + Math.abs(Math.sin(step)) * 0.035, z],
        target: [0, 1.85, z + 22],
        fov: 58,
      };
    } else if (t < TOTAL) {
      // out into the open: a few more steps while the eyes go up to the stands
      const u = ease((t - WALK) / EMERGE);
      const z = MOUTH + 9 * u;
      rig.override = {
        position: [0, 1.72 + u * 0.9, z],
        target: [0, 1.85 + u * 17, z + 22 + u * 30],
        fov: 58 + u * 4,
      };
    } else {
      steering.current = false;
      rig.override = null;
      finishIntro();
    }
  });

  return null;
}
