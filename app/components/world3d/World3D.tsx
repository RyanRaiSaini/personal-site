"use client";

import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import AtmosphereDriver from "./atmosphere/AtmosphereDriver";
import Lights from "./atmosphere/Lights";
import Sky from "./atmosphere/Sky";
import Crowd from "./stadium/Crowd";
import Pitch from "./stadium/Pitch";
import Roof from "./stadium/Roof";
import Stands from "./stadium/Stands";

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
      <Roof />
      <OrbitControls target={[0, 4, 0]} />
    </Canvas>
  );
}
