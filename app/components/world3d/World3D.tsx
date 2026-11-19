"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import AtmosphereDriver from "./atmosphere/AtmosphereDriver";
import Lights from "./atmosphere/Lights";
import Sky from "./atmosphere/Sky";
import AdBoards from "./stadium/AdBoards";
import Crowd from "./stadium/Crowd";
import Goals from "./stadium/Goals";
import Halo from "./stadium/Halo";
import Pitch from "./stadium/Pitch";
import PitchSide from "./stadium/PitchSide";
import Roof from "./stadium/Roof";
import Stands from "./stadium/Stands";

// Lets the camera be placed from the browser console while building:
// __look(x, y, z, targetX, targetY, targetZ, fov)
function DevTools() {
  const camera = useThree((s) => s.camera);
  const controls = useThree((s) => s.controls) as { target: { set: (x: number, y: number, z: number) => void }; update: () => void } | null;
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__look = (x: number, y: number, z: number, tx = 0, ty = 0, tz = 0, fov?: number) => {
      camera.position.set(x, y, z);
      if (fov && "fov" in camera) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
      if (controls) {
        controls.target.set(tx, ty, tz);
        controls.update();
      } else camera.lookAt(tx, ty, tz);
    };
  }, [camera, controls]);
  return null;
}

export default function World3D() {
  return (
    <Canvas shadows camera={{ position: [70, 30, 60], fov: 50, near: 0.5, far: 2000 }} dpr={[1, 1.75]}>
      <color attach="background" args={["#05070d"]} />
      <AtmosphereDriver />
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
      <OrbitControls makeDefault target={[0, 4, 0]} />
      <DevTools />
    </Canvas>
  );
}
