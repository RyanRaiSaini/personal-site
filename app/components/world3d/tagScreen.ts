// Where each place's name tag sits on the screen right now, in pixels.
// Written by the 3D world (Hotspots.tsx) every frame and read by the
// page (app/components/world/Tags.tsx). A plain object, because it
// changes 60 times a second and nothing should re-render for it.

export type TagSlot = { x: number; y: number; visible: boolean };

export const tagScreen: Record<string, TagSlot> = {};
