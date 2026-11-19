"use client";

import { useWorld } from "../../lib/store";
import Lights from "./atmosphere/Lights";
import Precipitation from "./atmosphere/Precipitation";
import Cast from "./players/Cast";
import Sky from "./atmosphere/Sky";
import { sceneOf } from "./spots";
import AdBoards from "./stadium/AdBoards";
import Crowd from "./stadium/Crowd";
import Goals from "./stadium/Goals";
import Halo from "./stadium/Halo";
import Pitch from "./stadium/Pitch";
import PitchSide from "./stadium/PitchSide";
import Roof from "./stadium/Roof";
import Stands from "./stadium/Stands";

// Everything out in the open: the stands, the pitch, the roof and the
// crowd. Hidden (and so not drawn at all) while the camera is in one
// of the rooms.

export default function Bowl({ children }: { children?: React.ReactNode }) {
  const inBowl = useWorld((s) => sceneOf(s.section) === "bowl");
  return (
    <group visible={inBowl}>
      <Sky />
      <Lights />
      <Stands />
      <Crowd />
      <Pitch />
      <Goals />
      <PitchSide />
      <AdBoards />
      <Roof />
      <Halo />
      <Precipitation />
      <Cast />
      {children}
    </group>
  );
}
