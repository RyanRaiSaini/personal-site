"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { useWorld } from "../../lib/store";
import { activity, type Pace } from "./activity";
import { rig } from "./camera/CameraRig";

// ------------------------------------------------------------------
// Decides how often the 3D picture is redrawn, so the stadium does not
// keep a laptop's fan running while nothing on screen is changing.
//
//   full     every frame the screen can show: while the visitor moves
//            the pointer, drags, types or scrolls, and while something
//            is in motion (a camera flight, the roof, the walk-out, a
//            goal celebration)
//   ambient  30 pictures a second, for a while after that: enough for
//            the slow drift round the stadium and the players' idling
//   rest     nothing is drawn at all until the visitor does something.
//            Also whenever the tab is hidden.
//
// It also watches the frame rate while at "full", and steps the quality
// level down if the machine cannot keep up: high, medium, low, and
// last a smaller picture (`lean` in the store).
//
// To change how long the stadium keeps moving when left alone, change
// REST_AFTER.
// ------------------------------------------------------------------

// ms at full rate after the visitor last did something
const FULL_FOR = 1500;
const AMBIENT_GAP = 1000 / 30;
// ms after the last input before the picture stops altogether
const REST_AFTER = { home: 45_000, section: 15_000, reducedMotion: 4_000, start: 4_000 };
// Under this many frames a second at full rate, step the quality down.
// (Some laptops cap browsers at 30 to save battery, so 30 must not count as slow.)
const SLOW = 24;

function paceNow(now: number): Pace {
  if (document.hidden) return "rest";
  const state = useWorld.getState();
  // On the start screen the camera stands still in the tunnel: a picture, not a film
  const atStart = !state.introDone && !state.introStarted;
  if (!state.worldReady || (!state.introDone && !atStart) || state.show || state.curtain) return "full";
  if (rig.dragging || (rig.override && !rig.holdStill) || now < activity.busyUntil) return "full";
  const since = now - activity.lastInput;
  if (since < FULL_FOR) return "full";
  const limit = atStart ? REST_AFTER.start : state.reducedMotion ? REST_AFTER.reducedMotion : state.section === "home" ? REST_AFTER.home : REST_AFTER.section;
  return since < limit ? "ambient" : "rest";
}

export default function FrameGovernor() {
  const invalidate = useThree((s) => s.invalidate);

  // one more picture drawn
  useFrame(() => {
    activity.frames += 1;
  });

  useEffect(() => {
    let frame = 0;
    let lastDrawn = 0;
    // For judging the frame rate. Only unbroken stretches at full rate
    // count, and not the first seconds, when the page is still loading.
    let lastFull = 0;
    let fullFrames = 0;
    let fullTime = 0;
    let slowSpells = 0;
    let judgeAfter = performance.now() + 4000;

    const judge = (now: number) => {
      if (lastFull && now - lastFull < 250 && now > judgeAfter) {
        fullFrames += 1;
        fullTime += now - lastFull;
      }
      lastFull = now;
      if (fullTime < 2000) return;
      const rate = (fullFrames * 1000) / fullTime;
      fullFrames = 0;
      fullTime = 0;
      slowSpells = rate < SLOW ? slowSpells + 1 : 0;
      if (slowSpells < 2) return;
      slowSpells = 0;
      const { quality, lean, setQuality, setLean } = useWorld.getState();
      if (quality === "low") {
        if (lean) return;
        setLean(true);
      } else setQuality(quality === "high" ? "medium" : "low");
      // changing level makes the picture stutter for a moment; do not count that
      judgeAfter = now + 4000;
    };

    const loop = (now: number) => {
      frame = 0;
      const pace = paceNow(now);
      activity.pace = pace;
      if (pace === "rest") {
        // stop altogether: nothing runs until `wake` is called
        lastFull = 0;
        return;
      }
      if (pace === "full") judge(now);
      else lastFull = 0;
      if (pace === "full" || now - lastDrawn >= AMBIENT_GAP - 1) {
        lastDrawn = now;
        invalidate();
      }
      frame = requestAnimationFrame(loop);
    };

    const wake = () => {
      if (!frame) frame = requestAnimationFrame(loop);
    };
    const input = () => {
      activity.lastInput = performance.now();
      wake();
    };

    activity.wake = wake;
    const events = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart", "scroll"] as const;
    // `capture` also catches scrolling inside a panel, which does not bubble
    for (const name of events) window.addEventListener(name, input, { passive: true, capture: true });
    window.addEventListener("resize", input);
    document.addEventListener("visibilitychange", input);
    // Anything the page changes (a new section, the roof, a goal) may
    // set something moving: draw at full rate while it gets going
    const unsubscribe = useWorld.subscribe(() => {
      activity.busyUntil = Math.max(activity.busyUntil, performance.now() + 1200);
      wake();
    });
    input();

    return () => {
      activity.wake = null;
      cancelAnimationFrame(frame);
      for (const name of events) window.removeEventListener(name, input, { capture: true });
      window.removeEventListener("resize", input);
      document.removeEventListener("visibilitychange", input);
      unsubscribe();
    };
  }, [invalidate]);

  return null;
}
