"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import Pitch from "./stadium/Pitch";
import Stands from "./stadium/Stands";

export default function World3D() {
  return (
    <Canvas shadows camera={{ position: [70, 30, 60], fov: 50, near: 0.5, far: 1200 }} dpr={[1, 1.75]}>
      <color attach="background" args={["#05070d"]} />
      <hemisphereLight args={["#b9c8ff", "#1a2416", 0.9]} />
      <directionalLight position={[60, 120, 40]} intensity={2.2} />
      <Stands />
      <Pitch />
      <OrbitControls target={[0, 4, 0]} />
    </Canvas>
  );
}
