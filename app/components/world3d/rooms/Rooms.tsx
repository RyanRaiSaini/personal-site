"use client";

import { useWorld } from "../../../lib/store";
import { ROOM_ORIGIN, sceneOf, type SceneId } from "../spots";
import DressingRoom from "./DressingRoom";
import PressRoom from "./PressRoom";
import TicketOffice from "./TicketOffice";
import TrophyRoom from "./TrophyRoom";

// The rooms inside the stadium. Each is built at its own far-away
// origin (spots.ts), and only the one being visited exists at all:
// the others are not even built until the camera goes there.

type RoomId = Exclude<SceneId, "bowl">;

const ROOMS: { id: RoomId; Room: () => React.ReactNode }[] = [
  { id: "dressing", Room: DressingRoom },
  { id: "trophy", Room: TrophyRoom },
  { id: "press", Room: PressRoom },
  { id: "tickets", Room: TicketOffice },
];

export default function Rooms({ children }: { children?: (room: RoomId) => React.ReactNode }) {
  const scene = useWorld((s) => sceneOf(s.section));
  return (
    <>
      {ROOMS.map(({ id, Room }) =>
        scene === id ? (
          <group key={id} position={ROOM_ORIGIN[id]}>
            <Room />
            {children?.(id)}
          </group>
        ) : null,
      )}
    </>
  );
}
