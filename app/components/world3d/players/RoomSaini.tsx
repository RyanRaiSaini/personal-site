"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { atmo } from "../atmosphere/state";
import type { SceneId } from "../spots";
import { KITS } from "./kits";
import Player, { type PlayerHandle } from "./Player";
import { ARMS_CROSSED, HANDS_ON_HIPS, idle, mix, SEATED, STAND, type Pose } from "./poses";

// Number 8 inside each room: looking over the shirts, admiring the
// silverware, sitting at the press desk, queueing for a programme, and
// stopping to talk in the mixed zone.

type Mark = { at: [number, number, number]; facing: number; pose: Pose };

const MARKS: Record<Exclude<SceneId, "bowl">, Mark> = {
  // back to the camera, so the name and number are on show
  dressing: { at: [-2.4, 0, 1.3], facing: Math.PI * 1.16, pose: HANDS_ON_HIPS },
  trophy: { at: [2.5, 0, 1.0], facing: Math.PI * 0.86, pose: ARMS_CROSSED },
  // behind the desk, on the little stage
  press: { at: [0, 0.22, -3.55], facing: 0, pose: SEATED },
  tickets: { at: [-1.5, 0, -1.6], facing: Math.PI * 0.94, pose: STAND },
  mixed: { at: [0.1, 0, -1.5], facing: 0.08, pose: HANDS_ON_HIPS },
};

export default function RoomSaini({ room }: { room: Exclude<SceneId, "bowl"> }) {
  const player = useRef<PlayerHandle>(null);
  const mark = MARKS[room];

  useFrame(() => {
    player.current?.setPose(mix(mark.pose, idle(atmo.time, 5), 0.16));
  });

  return (
    <group position={mark.at} rotation={[0, mark.facing, 0]}>
      <Player ref={player} kit={KITS.saini} shadow={false} />
    </group>
  );
}
