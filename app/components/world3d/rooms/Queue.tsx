"use client";

import { useMemo } from "react";
import { canvasTexture } from "../textures/canvas";
import { LEONARD, VIEW, WOMAN, type PersonLook } from "./clerk";
import Person from "./Person";

// ------------------------------------------------------------------
// The people in the ticket office (Résumé): fans queuing for tickets, the
// crowd's people, standing (build_crowd.py --stand), in their own
// clothes, men and women, in single file, each facing the window,
// seen from behind; and a few others about the room (OTHERS).
//
// Each is a picture turned to face the room's camera (CAMERA, from the
// résumé's pose in spots.ts), with a soft shadow under the feet.
//
// To change a queue, change FANS (each fan's place in his line) or
// STEP, FRONT and LANES (metres, room coordinates: the windows are at
// z -4.4).
// ------------------------------------------------------------------

const CAMERA = { x: 0, z: 7 };

export type Fan = { at: [number, number]; look: PersonLook; mirrored?: boolean };

// each queue is one straight line down the middle of its lane, a step
// (STEP) between people, everyone facing the window
const STEP = 0.8;
const FRONT = -3.35; // the first in line, at the counter
const LANES = { left: -3.9, right: 3.9 };
const inLine = (lane: number, place: number): [number, number] => [lane, FRONT + place * STEP];

const JEANS = "#7d9fd6";
const DARK_JEANS = "#5470a3";

const FANS: Fan[] = [
  // the left queue, from the window back
  { at: inLine(LANES.left, 0), look: { sheet: "queue", man: 1, pose: VIEW.back, shirt: "#f2f2ee", skin: 0.15, hair: "#2a1c12" } },
  { at: inLine(LANES.left, 1), look: { sheet: "queue", man: WOMAN.teeAndJeans, pose: VIEW.back, shirt: "#f2f2ee", skin: 0.2, hair: "#4a2c16", trousers: JEANS } },
  { at: inLine(LANES.left, 2), look: { sheet: "queue", man: 0, pose: VIEW.back, shirt: "#1d2b57", skin: 0.55, hair: "#140f0c" } },
  { at: inLine(LANES.left, 3), look: { sheet: "queue", man: WOMAN.shirtAndTrousers, pose: VIEW.back, shirt: "#7a1626", skin: 0.6, hair: "#120d0a", trousers: "#1a1c22" }, mirrored: true },
  { at: inLine(LANES.left, 4), look: { sheet: "queue", man: LEONARD, pose: VIEW.back, shirt: "#9fb7d9", skin: 0.6, hair: "#120d0a", trousers: DARK_JEANS } },
  // the right queue
  { at: inLine(LANES.right, 0), look: { sheet: "queue", man: WOMAN.shirtAndTrousers, pose: VIEW.back, shirt: "#e9e6dc", skin: 0.1, hair: "#8a6a3e", trousers: DARK_JEANS } },
  { at: inLine(LANES.right, 1), look: { sheet: "queue", man: 0, pose: VIEW.back, shirt: "#26314a", skin: 0.25, hair: "#8a6a3e" }, mirrored: true },
  { at: inLine(LANES.right, 2), look: { sheet: "queue", man: WOMAN.teeAndJeans, pose: VIEW.back, shirt: "#15171c", skin: 0.8, hair: "#0e0b09", trousers: JEANS }, mirrored: true },
];

// the others in the room, out of the queues: a fan looking at the scarves
// in the club shop, a steward in a high-visibility vest by the barriers,
// and the programme seller beside her rack in the shop (TicketOffice.tsx)
const OTHERS: Fan[] = [
  { at: [5.55, 1.5], look: { sheet: "queue", man: WOMAN.teeAndJeans, pose: VIEW.backQuarter, shirt: "#2f4fb3", skin: 0.3, hair: "#3b2414", trousers: DARK_JEANS }, mirrored: true },
  { at: [2.55, -3.75], look: { sheet: "queue", man: 0, pose: VIEW.front, shirt: "#e8f51c", skin: 0.7, hair: "#0e0b09", trousers: "#1a1c22" } },
  { at: [5.2, -2.3], look: { sheet: "queue", man: WOMAN.topAndTrousers, pose: VIEW.frontQuarter, shirt: "#17244d", skin: 0.45, hair: "#1a120c", trousers: "#1a1c22" }, mirrored: true },
];

export default function Queue() {
  return <People people={[...FANS, ...OTHERS]} camera={CAMERA} />;
}

// Standing people in a room, each a picture turned to face the room's
// camera (`camera`: x and z in the room), with a soft shadow at the feet.
// The other rooms use it too (DressingRoom.tsx, TrophyRoom.tsx).
export function People({ people, camera }: { people: Fan[]; camera: { x: number; z: number } }) {
  // a soft round shadow, darkest under the feet
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
      {people.map(({ at: [x, z], look, mirrored }) => (
        <group key={`${x}${z}`}>
          <Person look={look} position={[x, 0, z]} mirrored={mirrored} turn={Math.atan2(camera.x - x, camera.z - z)} />
          <mesh position={[x, 0.016, z]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
            <planeGeometry args={[0.75, 0.5]} />
            <meshBasicMaterial map={shadow} transparent depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
