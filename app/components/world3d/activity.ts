// ------------------------------------------------------------------
// Shared notes on how busy the 3D picture is right now. The frame
// governor (FrameGovernor.tsx) reads them to decide how often to
// redraw; anything that is moving the picture writes them.
//
// Plain data with no 3D code in it, so it is safe to import anywhere.
// ------------------------------------------------------------------

export type Pace = "full" | "ambient" | "rest";

export const activity = {
  // when the visitor last moved the pointer, clicked, typed or scrolled
  lastInput: 0,
  // until when something in the scene needs every frame drawn
  busyUntil: 0,
  // what the governor decided for the current frame
  pace: "full" as Pace,
  // starts the drawing loop again if it has stopped (set by the governor)
  wake: null as null | (() => void),
  // how many pictures have been drawn since the page opened (for measuring)
  frames: 0,
};

// For measuring from outside (scripts/measure.mjs) and from the console
if (typeof window !== "undefined") (window as unknown as { __activity: typeof activity }).__activity = activity;

// "Something is moving: keep drawing every frame for a little longer."
// Called each frame by whatever is in motion (a camera flight, the roof).
export function stir(ms = 300) {
  const until = performance.now() + ms;
  if (until > activity.busyUntil) activity.busyUntil = until;
  activity.wake?.();
}
