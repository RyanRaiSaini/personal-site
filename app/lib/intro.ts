"use client";

import { useWorld } from "./store";

// ------------------------------------------------------------------
// The start of a first visit, in three steps:
//
//   start   the visitor is standing in the tunnel with my name in front
//           of them and a "Start the tour" button
//   play    they pressed it: the camera is walking out onto the pitch
//   done    everything else, and every later page
//
// The step is written on the page itself (`data-intro` on <html>) by
// the small script in app/layout.tsx before anything is painted, so the
// right things are hidden from the first frame. The functions here move
// it on, and keep the shared store in step.
// ------------------------------------------------------------------

// The visitor pressed "Start the tour"
export function startIntro() {
  document.documentElement.dataset.intro = "play";
  useWorld.getState().setIntroStarted(true);
}

// The walk-out finished, was skipped, or was never offered
export function finishIntro() {
  try {
    sessionStorage.setItem("intro", "1");
  } catch {
    // Private browsing: it will just be offered again next time
  }
  document.documentElement.dataset.intro = "done";
  useWorld.getState().setIntroDone(true);
}
