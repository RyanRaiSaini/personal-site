"use client";

import { PerformanceMonitor } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { useWorld } from "../../lib/store";
import AtmosphereDriver from "./atmosphere/AtmosphereDriver";
import Bowl from "./Bowl";
import CameraRig from "./camera/CameraRig";
import Hotspots from "./Hotspots";
import Rooms from "./rooms/Rooms";
import { ORBIT } from "./spots";

// The 3D world: one canvas behind every page. The camera, the stadium
// and the rooms all live here. What it shows follows the shared store
// (app/lib/store.ts), which follows the address bar.

// Lets the camera be placed from the browser console while building:
//   __look(x, y, z, targetX, targetY, targetZ, fov)   then   __look() to let go
function DevTools() {
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__look = async (x?: number, y?: number, z?: number, tx = 0, ty = 0, tz = 0, fov = 50) => {
      const { rig } = await import("./camera/CameraRig");
      rig.override = x === undefined || y === undefined || z === undefined ? null : { position: [x, y, z], target: [tx, ty, tz], fov };
      rig.overrideStiffness = 60;
    };
    w.__camera = camera;
  }, [camera]);
  return null;
}

// Tells the page when the first frame has been drawn
function Ready() {
  const setWorldReady = useWorld((s) => s.setWorldReady);
  useEffect(() => {
    let frames = 0;
    let id = 0;
    const tick = () => {
      frames += 1;
      if (frames >= 3) setWorldReady(true);
      else id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [setWorldReady]);
  return null;
}

const DPR: Record<string, [number, number]> = { low: [1, 1.25], medium: [1, 1.5], high: [1, 2] };

export default function World3D() {
  const quality = useWorld((s) => s.quality);
  const setQuality = useWorld((s) => s.setQuality);

  return (
    <Canvas
      shadows={quality !== "low"}
      dpr={DPR[quality]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [0, ORBIT.height, ORBIT.radiusZ], fov: ORBIT.fov, near: 0.3, far: 2000 }}
      role="img"
      aria-label="A 3D football stadium. Each part of the ground is a section of this site; the same sections are in the menu."
    >
      <color attach="background" args={["#05070d"]} />
      {/* If the frame rate stays under 24 a second, step down a quality
          level. (Some laptops cap browsers at 30 to save battery, so
          30 must not count as slow.) */}
      <PerformanceMonitor
        bounds={() => [24, 200]}
        flipflops={2}
        onDecline={() => {
          const q = useWorld.getState().quality;
          if (q === "high") setQuality("medium");
          else if (q === "medium") setQuality("low");
        }}
      />
      <AtmosphereDriver />
      <CameraRig />
      <Bowl />
      <Rooms />
      <Hotspots />
      <Ready />
      <DevTools />
    </Canvas>
  );
}
