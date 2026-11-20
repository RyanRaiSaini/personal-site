"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { useWorld } from "../../../lib/store";
import { atmo } from "../atmosphere/state";
import type { Pose } from "../spots";
import { BOWL, TUNNEL } from "../stadium/dims";
import { rig } from "./CameraRig";

// The start of a first visit, as the camera sees it.
//
// First the start screen: the camera stands still deep in the players'
// tunnel, looking down it at the lit pitch. My name and a "Start the
// tour" button are drawn over that (app/components/world/StartScreen.tsx).
//
// Then the walk-out: when the button is pressed the camera walks to the
// light, steps out onto the pitch and looks up at the stands. After
// that the tour opens its first section, About.
//
// Timings are in seconds; the path is along the tunnel (the Z axis).

const WALK = 3.6; // down the tunnel
const EMERGE = 2.3; // out onto the grass, looking up
const TOTAL = WALK + EMERGE;

const MOUTH = -BOWL.hz + 2.2;
const START = -BOWL.hz - TUNNEL.length + 3.5;

// Where the camera waits on the start screen. The walk begins from exactly here.
const WAITING: Pose = { position: [0, 1.72, START], target: [0, 1.85, START + 22], fov: 58 };

function ease(t: number) {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
}

export default function Intro() {
  const startedAt = useRef<number | null>(null);
  const steering = useRef(false);

  useFrame(() => {
    const world = useWorld.getState();
    if (world.introDone || world.section !== "home") {
      if (steering.current) {
        steering.current = false;
        rig.holdStill = false;
        rig.override = null;
      }
      return;
    }
    if (!world.worldReady) return;

    if (!steering.current) {
      // straight to the tunnel: no flying in from the sky
      steering.current = true;
      rig.snapOverride = true;
    }

    if (!world.introStarted) {
      // the start screen: a still picture
      rig.holdStill = true;
      rig.override = WAITING;
      return;
    }

    if (startedAt.current === null) startedAt.current = atmo.time;
    const t = atmo.time - startedAt.current;
    rig.holdStill = false;
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
      // out on the pitch: hand the camera back and open the first section.
      // The section is set here as well as in the address bar, so the
      // camera flies straight there and does not start for the overview
      // first. The intro itself is marked finished when the new page
      // arrives (WorldShell.tsx), so the home screen never flashes up
      // in between.
      steering.current = false;
      rig.override = null;
      world.setSection("about");
      world.navigate("/about");
    }
  });

  return null;
}
