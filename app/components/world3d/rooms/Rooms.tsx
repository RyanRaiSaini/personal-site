"use client";

import { useWorld } from "../../../lib/store";
import { ROOM_ORIGIN, sceneOf, type SceneId } from "../spots";

// The rooms inside the stadium. Each is built at its own far-away
// origin (spots.ts) and only the one being visited is drawn.

type RoomId = Exclude<SceneId, "bowl">;

function Placeholder({ color }: { color: string }) {
  return (
    <group>
      <ambientLight intensity={1.2} />
      <mesh position={[0, 1.8, -4]}>
        <boxGeometry args={[12, 3.6, 0.2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[12, 12]} />
        <meshStandardMaterial color="#1a1d26" />
      </mesh>
    </group>
  );
}

const ROOMS: { id: RoomId; color: string }[] = [
  { id: "dressing", color: "#12327e" },
  { id: "trophy", color: "#3a2a12" },
  { id: "press", color: "#1b3d92" },
  { id: "tickets", color: "#2a2d35" },
  { id: "mixed", color: "#0f1b3d" },
];

export default function Rooms() {
  const scene = useWorld((s) => sceneOf(s.section));
  return (
    <>
      {ROOMS.map(({ id, color }) => (
        <group key={id} position={ROOM_ORIGIN[id]} visible={scene === id}>
          {scene === id && <Placeholder color={color} />}
        </group>
      ))}
    </>
  );
}
