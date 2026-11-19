"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { PerspectiveCamera, Vector3 } from "three";
import { useWorld } from "../../../lib/store";
import { atmo } from "../atmosphere/state";
import { ORBIT, orbitPose, poseOf, type Pose } from "../spots";

// ------------------------------------------------------------------
// The camera. It has four jobs:
//
//   1. Overview: ride the oval track round the stadium. Drag to turn,
//      scroll to zoom; left alone, it drifts slowly.
//   2. Flights: glide to a section's spot when the page changes.
//   3. Parallax: lean a little with the pointer once it has arrived.
//   4. Shows: hand over to the intro or an Easter egg while one is
//      playing (they set `rig.override`).
//
// The camera positions themselves are in ../spots.ts.
// ------------------------------------------------------------------

export const rig = {
  // When set, something else is steering: the camera eases to this pose
  override: null as Pose | null,
  overrideStiffness: 5,
  // Set to true to jump straight to the override instead of easing to it
  snapOverride: false,
  azimuth: ORBIT.startAzimuth,
  dragging: false,
  lastInput: -100,
  pointerX: 0,
  pointerY: 0,
  zoom: 0, // degrees added to the field of view (negative = closer)
  // The pose the camera actually has this frame, for anything that
  // needs to know where it is
  position: new Vector3(),
  target: new Vector3(),
};

function easeInOut(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const scratch = new Vector3();
const scratchTarget = new Vector3();
const right = new Vector3();
const up = new Vector3(0, 1, 0);

export default function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const section = useWorld((s) => s.section);
  const cuts = useWorld((s) => s.cuts);
  const narrow = useWorld((s) => s.narrow);

  const current = useRef({ position: new Vector3(0, ORBIT.height, ORBIT.radiusZ), target: new Vector3(0, ORBIT.targetHeight, 0), fov: ORBIT.fov });
  const flight = useRef({ active: false, t: 0, duration: 1.6, lift: 0, fromPosition: new Vector3(), fromTarget: new Vector3(), fromFov: 50, to: orbitPose(ORBIT.startAzimuth, false) });
  const started = useRef(false);
  const lastCuts = useRef(cuts);
  const wasOverridden = useRef(false);
  const offset = useRef({ x: 0, y: 0 });

  // Where the camera should end up for the current section
  const destination = (): Pose => (section === "home" ? orbitPose(rig.azimuth, narrow) : poseOf(section, narrow));

  const beginFlight = (to: Pose, snap: boolean) => {
    const c = current.current;
    const f = flight.current;
    if (snap) {
      c.position.set(...to.position);
      c.target.set(...to.target);
      c.fov = to.fov;
      f.active = false;
      return;
    }
    f.fromPosition.copy(c.position);
    f.fromTarget.copy(c.target);
    f.fromFov = c.fov;
    f.to = to;
    const distance = c.position.distanceTo(scratch.set(...to.position));
    f.duration = Math.min(2.6, Math.max(1.1, distance / 42));
    // Rise a little in the middle of a long flight, like a cable camera
    f.lift = Math.min(12, distance * 0.1);
    f.t = 0;
    f.active = distance > 0.01;
  };

  useEffect(() => {
    const reduced = useWorld.getState().reducedMotion;
    const cut = cuts !== lastCuts.current;
    lastCuts.current = cuts;
    beginFlight(destination(), !started.current || cut || reduced);
    started.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, cuts, narrow]);

  // Drag to turn the overview, scroll to zoom, and follow the pointer
  useEffect(() => {
    const el = gl.domElement;
    let lastX = 0;
    let pointerId = -1;
    const down = (e: PointerEvent) => {
      if (useWorld.getState().section !== "home" || rig.override) return;
      rig.dragging = true;
      pointerId = e.pointerId;
      lastX = e.clientX;
      el.setPointerCapture(e.pointerId);
    };
    const move = (e: PointerEvent) => {
      rig.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      rig.pointerY = (e.clientY / window.innerHeight) * 2 - 1;
      if (!rig.dragging || e.pointerId !== pointerId) return;
      rig.azimuth += (e.clientX - lastX) * 0.0045;
      lastX = e.clientX;
      rig.lastInput = atmo.time;
    };
    const end = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      rig.dragging = false;
      pointerId = -1;
      rig.lastInput = atmo.time;
    };
    const wheel = (e: WheelEvent) => {
      if (useWorld.getState().section !== "home") return;
      rig.zoom = Math.min(8, Math.max(-16, rig.zoom + e.deltaY * 0.012));
      rig.lastInput = atmo.time;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    el.addEventListener("wheel", wheel, { passive: true });
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      el.removeEventListener("wheel", wheel);
    };
  }, [gl]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const c = current.current;
    const f = flight.current;
    const state = useWorld.getState();
    const reduced = state.reducedMotion;

    if (rig.override) {
      // A show is steering
      const k = rig.snapOverride ? 1 : 1 - Math.exp(-rig.overrideStiffness * dt);
      rig.snapOverride = false;
      c.position.lerp(scratch.set(...rig.override.position), k);
      c.target.lerp(scratchTarget.set(...rig.override.target), k);
      c.fov += (rig.override.fov - c.fov) * k;
      f.active = false;
      wasOverridden.current = true;
    } else {
      if (wasOverridden.current) {
        // The show is over: fly back to where the page says we are
        wasOverridden.current = false;
        beginFlight(destination(), false);
      }
      if (f.active) {
        f.t = Math.min(1, f.t + dt / f.duration);
        const e = easeInOut(f.t);
        c.position.lerpVectors(f.fromPosition, scratch.set(...f.to.position), e);
        c.position.y += Math.sin(Math.PI * e) * f.lift;
        c.target.lerpVectors(f.fromTarget, scratchTarget.set(...f.to.target), e);
        c.fov = f.fromFov + (f.to.fov - f.fromFov) * e;
        if (f.t >= 1) f.active = false;
      } else {
        // Resting: hold the spot, with a slow drift or a pointer lean
        const home = state.section === "home";
        if (home && !rig.dragging && !reduced && state.introDone && atmo.time - rig.lastInput > 3) {
          rig.azimuth += dt * 0.028;
        }
        const pose = destination();
        const k = 1 - Math.exp(-(home ? 4 : 3) * dt);
        scratch.set(...pose.position);
        scratchTarget.set(...pose.target);
        if (!reduced) {
          // lean with the pointer, more for far-away subjects
          const reach = scratch.distanceTo(scratchTarget);
          const lean = home ? 0.012 : 0.03;
          right.subVectors(scratchTarget, scratch).cross(up).normalize();
          scratch.addScaledVector(right, rig.pointerX * reach * lean);
          scratch.y += -rig.pointerY * reach * lean * 0.5;
        }
        c.position.lerp(scratch, k);
        c.target.lerp(scratchTarget, k);
        c.fov += (pose.fov + (home ? rig.zoom : 0) - c.fov) * k;
      }
    }

    camera.position.copy(c.position);
    camera.lookAt(c.target);
    rig.position.copy(c.position);
    rig.target.copy(c.target);

    // Slide the picture aside to make room for the open panel
    const wanted = state.viewOffset;
    const ko = reduced ? 1 : 1 - Math.exp(-5 * dt);
    offset.current.x += (wanted.x - offset.current.x) * ko;
    offset.current.y += (wanted.y - offset.current.y) * ko;
    const ox = Math.round(offset.current.x);
    const oy = Math.round(offset.current.y);
    if (ox !== 0 || oy !== 0) camera.setViewOffset(size.width, size.height, ox, oy, size.width, size.height);
    else if (camera.view) camera.clearViewOffset();

    if (Math.abs(camera.fov - c.fov) > 0.001) camera.fov = c.fov;
    camera.updateProjectionMatrix();
  }, -5);

  return null;
}
