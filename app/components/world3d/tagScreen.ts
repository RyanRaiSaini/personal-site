// Where each place's name tag sits on the screen right now, in pixels.
// Written by the 3D world (Hotspots.tsx) each time it draws a frame and
// read by the page (app/components/world/Tags.tsx). A plain object,
// because it changes many times a second and nothing should re-render
// for it.

export type TagSlot = { x: number; y: number; visible: boolean };

export const tagScreen: Record<string, TagSlot> = {};

// The page leaves a function here; the 3D world calls it after each
// frame it draws, so the tags move exactly when the picture does and
// cost nothing while it is still.
export const tagFrame = { drawn: null as null | (() => void) };
