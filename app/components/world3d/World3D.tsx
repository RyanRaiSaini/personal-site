"use client";

import { Environment, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useThree } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import { useWorld } from "../../lib/store";
import AtmosphereDriver from "./atmosphere/AtmosphereDriver";
import { SKY_FILES, SKY_TURN } from "./atmosphere/daylight";
import Effects from "./atmosphere/Effects";
import Bowl, { stadium } from "./Bowl";
import CameraRig from "./camera/CameraRig";
import Intro from "./camera/Intro";
import Fireworks from "./eggs/Fireworks";
import Hotspots from "./Hotspots";
import RoomSaini from "./players/RoomSaini";
import Rooms from "./rooms/Rooms";
import { ORBIT, sceneOf } from "./spots";

// The 3D world: one canvas behind every page. The camera, the stadium
// and the rooms all live here. What it shows follows the shared store
// (app/lib/store.ts), which follows the address bar.

// Lets the camera be placed from the browser console while building:
//   __look(x, y, z, targetX, targetY, targetZ, fov)   then   __look() to let go
function DevTools() {
  const camera = useThree((s) => s.camera);
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const w = window as unknown as Record<string, unknown>;
    w.__look = async (x?: number, y?: number, z?: number, tx = 0, ty = 0, tz = 0, fov = 50) => {
      const { rig } = await import("./camera/CameraRig");
      rig.override = x === undefined || y === undefined || z === undefined ? null : { position: [x, y, z], target: [tx, ty, tz], fov };
      rig.overrideStiffness = 60;
    };
    w.__camera = camera;
    w.__scene = scene;
    w.__gl = gl;
  }, [camera, scene, gl]);
  return null;
}

// Tells the page when the first frames have been drawn. Out in the
// bowl that means waiting for the stadium model to arrive; the rooms
// are drawn in code and need no download.
function Ready() {
  const setWorldReady = useWorld((s) => s.setWorldReady);
  useEffect(() => {
    let frames = 0;
    let id = 0;
    const tick = () => {
      const waiting = sceneOf(useWorld.getState().section) === "bowl" && !stadium.loaded;
      if (!waiting) frames += 1;
      if (frames >= 3) setWorldReady(true);
      else id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [setWorldReady]);
  return null;
}

// What lights every surface from all round, and what shiny things
// reflect. Out in the bowl it is a photographed sky from Poly Haven,
// turned to match the sun. In the rooms it is a few soft lamps painted
// in code, like a studio.
function Surroundings() {
  const inBowl = useWorld((s) => sceneOf(s.section) === "bowl");
  if (inBowl) {
    return (
      <Suspense fallback={null}>
        <Environment files={SKY_FILES.light} environmentRotation={[0, -SKY_TURN, 0]} />
      </Suspense>
    );
  }
  return (
    <Environment resolution={128} frames={1}>
      <color attach="background" args={["#0c0f15"]} />
      <Lightformer form="rect" intensity={3} color="#ffffff" position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[10, 10, 1]} />
      <Lightformer form="rect" intensity={1.6} color="#ffe2b8" position={[-6, 2, 2]} rotation={[0, Math.PI / 2, 0]} scale={[8, 3, 1]} />
      <Lightformer form="rect" intensity={1.6} color="#bcd0ff" position={[6, 2, 2]} rotation={[0, -Math.PI / 2, 0]} scale={[8, 3, 1]} />
      <Lightformer form="rect" intensity={1} color="#ffffff" position={[0, 2, 8]} rotation={[0, Math.PI, 0]} scale={[10, 3, 1]} />
    </Environment>
  );
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
      <Surroundings />
      <AtmosphereDriver />
      <CameraRig />
      <Intro />
      <Bowl>
        <Fireworks />
      </Bowl>
      <Rooms>{(room) => <RoomSaini room={room} />}</Rooms>
      <Hotspots />
      <Effects />
      <Ready />
      <DevTools />
    </Canvas>
  );
}
