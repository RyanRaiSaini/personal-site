"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Mesh } from "three";

// Smoke test: a turning box, to prove the 3D engine runs here. The
// stadium replaces it.
function Box() {
  const ref = useRef<Mesh>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.6;
  });
  return (
    <mesh ref={ref}>
      <boxGeometry args={[1.4, 1.4, 1.4]} />
      <meshStandardMaterial color="#e6c56c" />
    </mesh>
  );
}

export default function World3D() {
  return (
    <Canvas camera={{ position: [0, 1.5, 5], fov: 45 }} dpr={[1, 1.75]}>
      <color attach="background" args={["#05070d"]} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[3, 5, 2]} intensity={2} />
      <Box />
    </Canvas>
  );
}
