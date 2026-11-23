"use client";

import { useMemo } from "react";
import { canvasTexture } from "../textures/canvas";
import { VIEW, type PersonLook } from "./clerk";
import Person from "./Person";

// ------------------------------------------------------------------
// The fans queuing for tickets in the ticket office (Résumé): the
// crowd's people, standing (build_crowd.py --stand), in their own
// clothes, in single file, each facing his window, seen from behind.
//
// Each is a picture turned to face the room's camera (CAMERA, from the
// résumé's pose in spots.ts), with a soft shadow under his feet.
//
// To change a queue, change FANS (each fan's place in his line) or
// STEP, FRONT and LANES (metres, room coordinates: the windows are at
// z -4.4).
// ------------------------------------------------------------------

const CAMERA = { x: 0, z: 7 };

type Fan = { at: [number, number]; look: PersonLook; mirrored?: boolean };

// each queue is one straight line down the middle of its lane, a step
// (STEP) between people, everyone facing the window
const STEP = 0.8;
const FRONT = -3.35; // the first in line, at the counter
const LANES = { left: -3.9, right: 3.9 };
const inLine = (lane: number, place: number): [number, number] => [lane, FRONT + place * STEP];

const FANS: Fan[] = [
  // the left queue, from the window back
  { at: inLine(LANES.left, 0), look: { sheet: "queue", man: 1, pose: VIEW.back, shirt: "#f2f2ee", skin: 0.15, hair: "#2a1c12" } },
  { at: inLine(LANES.left, 1), look: { sheet: "queue", man: 0, pose: VIEW.back, shirt: "#1d2b57", skin: 0.55, hair: "#140f0c" } },
  { at: inLine(LANES.left, 2), look: { sheet: "queue", man: 1, pose: VIEW.back, shirt: "#7a1626", skin: 0.35, hair: "#3b2414" }, mirrored: true },
  { at: inLine(LANES.left, 3), look: { sheet: "queue", man: 0, pose: VIEW.back, shirt: "#4a5a3a", skin: 0.8, hair: "#0e0b09" }, mirrored: true },
  { at: inLine(LANES.left, 4), look: { sheet: "queue", man: 1, pose: VIEW.back, shirt: "#9fb7d9", skin: 0.6, hair: "#120d0a" } },
  // the right queue
  { at: inLine(LANES.right, 0), look: { sheet: "queue", man: 0, pose: VIEW.back, shirt: "#26314a", skin: 0.25, hair: "#8a6a3e" } },
  { at: inLine(LANES.right, 1), look: { sheet: "queue", man: 1, pose: VIEW.back, shirt: "#f2f2ee", skin: 0.65, hair: "#120d0a" }, mirrored: true },
  { at: inLine(LANES.right, 2), look: { sheet: "queue", man: 0, pose: VIEW.back, shirt: "#15171c", skin: 0.1, hair: "#5a3a1e" } },
  { at: inLine(LANES.right, 3), look: { sheet: "queue", man: 1, pose: VIEW.back, shirt: "#7a1626", skin: 0.45, hair: "#1a120c" } },
];

export default function Queue() {
  // a soft round shadow, darkest under his feet
  const shadow = useMemo(
    () =>
      canvasTexture(
        64,
        64,
        (ctx, w, h) => {
          const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
          g.addColorStop(0, "rgba(0,0,0,0.55)");
          g.addColorStop(0.6, "rgba(0,0,0,0.2)");
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = g;
          ctx.fillRect(0, 0, w, h);
        },
        { repeat: false, anisotropy: 1 },
      ),
    [],
  );
  return (
    <group>
      {FANS.map(({ at: [x, z], look, mirrored }) => (
        <group key={`${x}${z}`}>
          <Person look={look} position={[x, 0, z]} mirrored={mirrored} turn={Math.atan2(CAMERA.x - x, CAMERA.z - z)} />
          <mesh position={[x, 0.016, z]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
            <planeGeometry args={[0.75, 0.5]} />
            <meshBasicMaterial map={shadow} transparent depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
