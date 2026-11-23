"use client";

import FlashZone from "./stadium/FlashZone";
import Photographers from "./stadium/Photographers";
import { Suspense, useEffect } from "react";
import { useWorld } from "../../lib/store";
import Lights from "./atmosphere/Lights";
import Precipitation from "./atmosphere/Precipitation";
import Cast from "./players/Cast";
import Sky from "./atmosphere/Sky";
import BenchShirt from "./eggs/BenchShirt";
import { sceneOf } from "./spots";
import AdBoards from "./stadium/AdBoards";
import Goals from "./stadium/Goals";
import GroundLit from "./stadium/GroundLit";
import Pitch from "./stadium/Pitch";
import PitchSide from "./stadium/PitchSide";
import StadiumModel from "./stadium/StadiumModel";

// Everything out in the open: the stands, the pitch, the roof and the
// seats. Hidden (and so not drawn at all) while the camera is in one
// of the rooms.

// The stadium model is a download, so the page needs to know when it
// has arrived before it lifts the loading screen (see World3D.tsx).
export const stadium = { loaded: false };

function Loaded() {
  useEffect(() => {
    stadium.loaded = true;
  }, []);
  return null;
}

export default function Bowl({ children }: { children?: React.ReactNode }) {
  const inBowl = useWorld((s) => sceneOf(s.section) === "bowl");
  return (
    <group visible={inBowl}>
      <Sky />
      <Lights />
      <Suspense fallback={null}>
        <StadiumModel />
        <Loaded />
      </Suspense>
      <Pitch />
      <GroundLit>
        <Goals />
        <PitchSide />
        <AdBoards />
        <Cast />
        <BenchShirt />
        <FlashZone />
        <Photographers />
      </GroundLit>
      <Precipitation />
      {children}
    </group>
  );
}
