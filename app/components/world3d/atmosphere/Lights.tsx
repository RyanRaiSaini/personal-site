"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Color, type DirectionalLight, type HemisphereLight, type SpotLight } from "three";
import { useWorld } from "../../../lib/store";
import { atmo } from "./state";

// The stadium's lighting: daylight from the sky, the sun (or the moon),
// and two banks of floodlights on the roof. Their strengths follow the
// shared `atmo` state, so the look changes smoothly with the time of
// day, the weather and the roof.

const SKY_NIGHT = new Color("#3d4f8f");
const SKY_DAY = new Color("#cfe2ff");
const GROUND_NIGHT = new Color("#0e1a12");
const GROUND_DAY = new Color("#3f5a36");
const FLOOD = new Color("#f1f5ff");

const SUN_DISTANCE = 260;

export default function Lights() {
  const quality = useWorld((s) => s.quality);
  const hemi = useRef<HemisphereLight>(null);
  const sun = useRef<DirectionalLight>(null);
  const floodWest = useRef<SpotLight>(null);
  const floodEast = useRef<SpotLight>(null);
  const scene = useThree((s) => s.scene);

  const shadows = quality !== "low";
  const shadowSize = quality === "high" ? 4096 : 2048;

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
      hemi.current.color.copy(SKY_NIGHT).lerp(SKY_DAY, atmo.outdoor);
      hemi.current.groundColor.copy(GROUND_NIGHT).lerp(GROUND_DAY, atmo.outdoor);
      hemi.current.intensity = 0.34 + 1.05 * atmo.outdoor + 0.14 * atmo.floodlights;
    }
    if (sun.current) {
      sun.current.position.copy(atmo.sunDirection).multiplyScalar(SUN_DISTANCE);
      sun.current.color.copy(atmo.sunColor);
      const day = 3.4 * atmo.daylight * (1 - 0.85 * atmo.overcast);
      const moon = 0.28 * (1 - atmo.daylight) * (1 - 0.7 * atmo.overcast);
      // Without shadows the roof can't block the sun, so dim it by hand
      const roofBlock = shadows ? 1 : 1 - 0.9 * atmo.roof;
      sun.current.intensity = (day + moon) * roofBlock;
    }
    const flood = 150 * atmo.floodlights;
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
        shadow-camera-left={-150}
        shadow-camera-right={150}
        shadow-camera-top={150}
        shadow-camera-bottom={-150}
        shadow-camera-near={60}
        shadow-camera-far={520}
        shadow-bias={-0.0006}
        shadow-normalBias={0.6}
      />
      <spotLight ref={floodWest} position={[0, 47, -41]} color={FLOOD} angle={1.02} penumbra={0.75} decay={1} distance={0} />
      <spotLight ref={floodEast} position={[0, 47, 41]} color={FLOOD} angle={1.02} penumbra={0.75} decay={1} distance={0} />
    </>
  );
}
