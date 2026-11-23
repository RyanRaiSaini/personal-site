"use client";

import { Box } from "../rooms/common";
import Person from "../rooms/Person";
import { PITCH } from "./dims";

// ------------------------------------------------------------------
// The photographers behind each goal line, as at every televised match:
// on low stools either side of the goal, in hi-vis bibs, long lenses on
// the pitch. They are the crowd's rendered people (rooms/Person.tsx).
//
// To move them or change how many, change SPOTS (metres along the goal
// line, either side of the goal).
// ------------------------------------------------------------------

const SPOTS = [-17.5, -14, -10.5, -7.2, 7.2, 10.8, 14.5, 18];
// how far behind the goal line they sit
const BACK = 2.6;
const BIBS = ["#ffb347", "#d9ef2e", "#ffb347", "#d9ef2e"];

function Photographer({ x, z, turn, i }: { x: number; z: number; turn: number; i: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, turn, 0]}>
      {/* the stool */}
      <Box size={[0.36, 0.42, 0.32]} position={[0, 0.21, -0.12]} color="#1b1d22" roughness={0.6} />
      <Person look={{ man: (i % 2) as 0 | 1, shirt: BIBS[i % BIBS.length], skin: [0.2, 0.55, 0.35, 0.8, 0.1, 0.45][i % 6] }} position={[0, -0.02, 0]} mirrored={i % 3 === 0} />
      {/* the camera body and its long lens, held at the knees */}
      <Box size={[0.14, 0.12, 0.1]} position={[0.05, 0.72, 0.24]} color="#121316" roughness={0.4} />
      <mesh position={[0.05, 0.72, 0.42]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.055, 0.045, 0.3, 14]} />
        <meshStandardMaterial color="#e7e5df" roughness={0.45} />
      </mesh>
    </group>
  );
}

export default function Photographers() {
  return (
    <group>
      {[1, -1].map((end) =>
        SPOTS.map((along, i) => (
          // north end (+X) faces back toward the pitch (-X), the south end the other way
          <Photographer key={`${end}${along}`} x={end * (PITCH.halfLength + BACK)} z={along * end} turn={(-end * Math.PI) / 2} i={i + (end > 0 ? 0 : 3)} />
        )),
      )}
    </group>
  );
}
