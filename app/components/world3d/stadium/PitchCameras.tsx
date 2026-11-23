"use client";

import { Box, TvCamera } from "../rooms/common";
import Person from "../rooms/Person";
import { AD_BOARD, PITCH } from "./dims";

// ------------------------------------------------------------------
// The television cameras along the far touchline, as at every televised
// match: on tripods just behind the boards, each with its operator on a
// stool behind it, aimed across the pitch. The operators are the crowd's
// rendered people (rooms/Person.tsx), in dark crew shirts.
//
// To move them, change ALONG (metres along the far touchline).
// ------------------------------------------------------------------

const ALONG = [-26, -9, 9, 26];
const OUT = PITCH.halfWidth + AD_BOARD.offsetZ + 0.9;

export default function PitchCameras() {
  return (
    <group>
      {ALONG.map((x, i) => (
        <group key={x} position={[x, 0, OUT]}>
          {/* aimed across the pitch (-Z), a little toward the middle */}
          <TvCamera position={[0, 0, 0]} turn={-x * 0.006} low={-0.35} />
          <Box size={[0.36, 0.5, 0.32]} position={[0.05, 0.25, 0.72]} color="#1b1d22" roughness={0.6} />
          <Person look={{ man: (i % 2) as 0 | 1, shirt: "#15171c", skin: [0.3, 0.7, 0.15, 0.5][i] }} position={[0.05, 0, 0.62]} lift={0.08} turn={Math.PI} mirrored={i % 2 === 1} />
        </group>
      ))}
    </group>
  );
}
