"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Color, type DirectionalLight, type HemisphereLight, type SpotLight } from "three";
import { useWorld } from "../../../lib/store";
import { tune } from "./daylight";
import { atmo } from "./state";

// The stadium's lamps: the sun (or the moon), a little fill light, and
// two banks of floodlights on the roof. The broad light of the sky is
// not a lamp; it comes from the photographed sky (World3D.tsx). The
// strengths follow the shared `atmo` state, so the look changes
// smoothly between day and night and as the roof moves.
//
// To make the picture brighter or darker, change the numbers marked
// "strength" below.

const SKY_NIGHT = new Color("#3d4f8f");
const SKY_DAY = new Color("#cfe2ff");
const GROUND_NIGHT = new Color("#0e1a12");
const GROUND_DAY = new Color("#3f5a36");
// Under floodlights the stray light is the lamps' own white, thrown
// about by the roof and the pitch, not the blue of the night sky
const SKY_FLOODLIT = new Color("#c4cfec");
const GROUND_FLOODLIT = new Color("#66776a");
const FLOOD = new Color("#f1f5ff");

const SUN_DISTANCE = 260;

export default function Lights() {
  const quality = useWorld((s) => s.quality);
  const hemi = useRef<HemisphereLight>(null);
  const sun = useRef<DirectionalLight>(null);
  const floodWest = useRef<SpotLight>(null);
  const floodEast = useRef<SpotLight>(null);
  const scene = useThree((s) => s.scene);

  // Live shadows are only for what stands on the pitch (players, the
  // ball, the goals). The stadium's own shadows were worked out in
  // Blender, so the shadow area can be small and sharp.
  const shadows = quality !== "low";
  const shadowSize = 2048;

  // The floodlights are aimed at points on the pitch
  useEffect(() => {
    const west = floodWest.current;
    const east = floodEast.current;
    if (!west || !east) return;
    west.target.position.set(0, 0, 9);
    east.target.position.set(0, 0, -9);
    scene.add(west.target, east.target);
    return () => {
      scene.remove(west.target, east.target);
    };
  }, [scene]);

  useFrame(() => {
    if (hemi.current) {
      const floodlit = atmo.floodlights * (1 - atmo.outdoor);
      hemi.current.color.copy(SKY_NIGHT).lerp(SKY_FLOODLIT, floodlit).lerp(SKY_DAY, atmo.outdoor);
      hemi.current.groundColor.copy(GROUND_NIGHT).lerp(GROUND_FLOODLIT, floodlit).lerp(GROUND_DAY, atmo.outdoor);
      // strength of the fill light: low by day (the sky does the work), more under floodlights
      hemi.current.intensity = tune.fill * (0.12 + 0.42 * atmo.outdoor + 1.15 * floodlit);
    }
    if (sun.current) {
      sun.current.position.copy(atmo.sunDirection).multiplyScalar(SUN_DISTANCE);
      sun.current.color.copy(atmo.sunColor);
      // strength of the sun
      const day = tune.sun * 4.6 * atmo.daylight * (1 - 0.85 * atmo.overcast);
      const moon = 0.28 * (1 - atmo.daylight) * (1 - 0.7 * atmo.overcast);
      sun.current.intensity = day + moon;
    }
    // strength of the floodlights
    const flood = tune.floods * 150 * atmo.floodlights;
    if (floodWest.current) floodWest.current.intensity = flood;
    if (floodEast.current) floodEast.current.intensity = flood;
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={["#3d4f8f", "#0e1a12", 0.4]} />
      <directionalLight
        ref={sun}
        castShadow={shadows}
        shadow-mapSize-width={shadowSize}
        shadow-mapSize-height={shadowSize}
        shadow-camera-left={-74}
        shadow-camera-right={74}
        shadow-camera-top={64}
        shadow-camera-bottom={-64}
        shadow-camera-near={150}
        shadow-camera-far={400}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <spotLight ref={floodWest} position={[0, 47, -41]} color={FLOOD} angle={1.02} penumbra={0.75} decay={1} distance={0} />
      <spotLight ref={floodEast} position={[0, 47, 41]} color={FLOOD} angle={1.02} penumbra={0.75} decay={1} distance={0} />
    </>
  );
}
