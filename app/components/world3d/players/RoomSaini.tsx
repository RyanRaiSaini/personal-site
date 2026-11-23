"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { atmo } from "../atmosphere/state";
import type { SceneId } from "../spots";
import { KITS } from "./kits";
import { playing, standing, type Layer } from "./moves";
import Player, { type PlayerHandle } from "./Player";

// Number 8 inside each room: looking over the shirts, admiring the
// trophies, sitting at the press desk, queueing for a programme, and
// stopping to talk in the mixed zone.

type Mark = { at: [number, number, number]; facing: number; doing: (time: number) => Layer[] };

const MARKS: Record<Exclude<SceneId, "bowl">, Mark> = {
  // back to the camera, so the name and number are on show
  dressing: { at: [-2.4, 0, 1.3], facing: Math.PI * 1.16, doing: (time) => standing(time, ["hips"]) },
  trophy: { at: [2.5, 0, 1.0], facing: Math.PI * 0.86, doing: (time) => standing(time, ["folded"]) },
  // behind the desk, on the little stage
  press: { at: [0, 0.22, -3.55], facing: 0, doing: (time) => playing("sit", time) },
  // in the left queue, looking across at the programme
  tickets: { at: [-2.55, 0, -0.5], facing: Math.PI * 0.86, doing: (time) => standing(time) },
  mixed: { at: [0.1, 0, -1.5], facing: 0.08, doing: (time) => standing(time, ["hips"]) },
};

export default function RoomSaini({ room }: { room: Exclude<SceneId, "bowl"> }) {
  const player = useRef<PlayerHandle>(null);
  const mark = MARKS[room];

  useFrame(() => {
    player.current?.play(mark.doing(atmo.time));
  });

  return (
    <group position={mark.at} rotation={[0, mark.facing, 0]}>
      <Player ref={player} kit={KITS.saini} shadow={false} />
    </group>
  );
}
