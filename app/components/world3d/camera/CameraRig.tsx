"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { PerspectiveCamera, Vector3 } from "three";
import { useWorld } from "../../../lib/store";
import { stir } from "../activity";
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
// Whatever it is doing, the camera itself follows that plan on a soft
// spring (FOLLOW), as a camera on a crane or a cable does: a change of
// mind, a flight cut short or a show handing back never jerks it. A
// show that wants a television cut sets `rig.snapOverride`, and the
// spring is skipped for that one frame.
//
// The camera positions themselves are in ../spots.ts.
// ------------------------------------------------------------------

export const rig = {
  // When set, something else is steering: the camera eases to this pose
  override: null as Pose | null,
  overrideStiffness: 5,
  // Set to true to jump straight to the override instead of easing to it
  snapOverride: false,
  // The override is a fixed view (the start screen): once the camera is
  // there, nothing is moving and the picture need not be redrawn
  holdStill: false,
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

// Seconds the camera takes to catch up with its plan, roughly
const FOLLOW = 0.16;

// Starts and stops with no jolt: speed and acceleration are both zero at the ends
function easeInOut(t: number) {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

// A spring that settles without overshoot, after Game Programming Gems 4
// (the "smooth damp" most game engines use). Moves `value` toward `goal`
// and keeps its speed in `speed`.
function follow(value: Vector3, goal: Vector3, speed: Vector3, dt: number) {
  const omega = 2 / FOLLOW;
  const x = omega * dt;
  const decay = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  for (const axis of ["x", "y", "z"] as const) {
    const change = value[axis] - goal[axis];
    const pull = (speed[axis] + omega * change) * dt;
    speed[axis] = (speed[axis] - omega * pull) * decay;
    value[axis] = goal[axis] + (change + pull) * decay;
  }
}

// The direction a flight looks in, turned along the arc between its
// first and last directions rather than cut across it, so a look-at
// point that swings past the camera does not whip the view round
function turnBetween(from: Vector3, to: Vector3, t: number, out: Vector3) {
  const cos = Math.min(1, Math.max(-1, from.dot(to)));
  const angle = Math.acos(cos);
  if (angle < 1e-3) return out.lerpVectors(from, to, t).normalize();
  const sin = Math.sin(angle);
  return out
    .copy(from)
    .multiplyScalar(Math.sin((1 - t) * angle) / sin)
    .addScaledVector(to, Math.sin(t * angle) / sin)
    .normalize();
}

const scratch = new Vector3();
const scratchTarget = new Vector3();
const right = new Vector3();
const up = new Vector3(0, 1, 0);
const fromLook = new Vector3();
const toLook = new Vector3();
const look = new Vector3();

export default function CameraRig() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const section = useWorld((s) => s.section);
  const cuts = useWorld((s) => s.cuts);
  const narrow = useWorld((s) => s.narrow);

  const current = useRef({ position: new Vector3(0, ORBIT.height, ORBIT.radiusZ), target: new Vector3(0, ORBIT.targetHeight, 0), fov: ORBIT.fov });
  const flight = useRef({ active: false, t: 0, duration: 1.6, lift: 0, fromPosition: new Vector3(), fromTarget: new Vector3(), fromFov: 50, to: orbitPose(ORBIT.startAzimuth, false), climb: false, via: new Vector3() });
  const started = useRef(false);
  const lastCuts = useRef(cuts);
  const wasOverridden = useRef(false);
  const offset = useRef({ x: 0, y: 0 });
  // where the camera really is: the plan above, followed on a spring
  const shown = useRef({ position: new Vector3(), target: new Vector3(), fov: ORBIT.fov, speed: new Vector3(), targetSpeed: new Vector3(), fovSpeed: 0, ready: false, lastPlan: new Vector3() });

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
      // a jump is a jump: the spring starts again from here
      shown.current.ready = false;
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
    // Between the pitch and somewhere high (the overview), a straight
    // line runs through the stands. So the camera climbs above the lower
    // end first and travels at height, on a curve through `via`.
    const low = c.position.y < to.position[1] ? c.position : scratch.set(...to.position);
    const high = Math.max(c.position.y, to.position[1]);
    f.climb = high - Math.min(c.position.y, to.position[1]) > 6 && distance > 20;
    f.via.set(low.x, high + 4, low.z);
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

    // a television cut: straight there, spring and all
    const cut = rig.snapOverride && !!rig.override;
    if (rig.override) {
      // A show is steering
      const k = rig.snapOverride ? 1 : 1 - Math.exp(-rig.overrideStiffness * dt);
      rig.snapOverride = false;
      c.position.lerp(scratch.set(...rig.override.position), k);
      c.target.lerp(scratchTarget.set(...rig.override.target), k);
      c.fov += (rig.override.fov - c.fov) * k;
      f.active = false;
      wasOverridden.current = true;
      if (!rig.holdStill) stir();
    } else {
      if (wasOverridden.current) {
        // The show is over: fly back to where the page says we are
        wasOverridden.current = false;
        beginFlight(destination(), false);
      }
      if (f.active) {
        f.t = Math.min(1, f.t + dt / f.duration);
        const e = easeInOut(f.t);
        scratch.set(...f.to.position);
        scratchTarget.set(...f.to.target);
        // where it looks: turned from the first direction to the last,
        // at a distance that changes evenly between the two
        fromLook.subVectors(f.fromTarget, f.fromPosition);
        toLook.subVectors(scratchTarget, scratch);
        const reach = fromLook.length() + (toLook.length() - fromLook.length()) * e;
        turnBetween(fromLook.normalize(), toLook.normalize(), e, look);
        if (f.climb) {
          // a curve that leaves the low end straight upward
          const a = (1 - e) * (1 - e);
          const b = 2 * (1 - e) * e;
          c.position.copy(f.fromPosition).multiplyScalar(a).addScaledVector(f.via, b).addScaledVector(scratch, e * e);
        } else {
          c.position.lerpVectors(f.fromPosition, scratch, e);
          c.position.y += Math.sin(Math.PI * e) * f.lift;
        }
        c.target.copy(c.position).addScaledVector(look, reach);
        c.fov = f.fromFov + (f.to.fov - f.fromFov) * e;
        if (f.t >= 1) f.active = false;
        // in flight: every frame counts
        stir();
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

    // The camera follows the plan on its spring
    const s = shown.current;
    if (!s.ready || cut || reduced) {
      s.position.copy(c.position);
      s.target.copy(c.target);
      s.fov = c.fov;
      s.speed.set(0, 0, 0);
      s.targetSpeed.set(0, 0, 0);
      s.fovSpeed = 0;
      s.ready = true;
    } else {
      follow(s.position, c.position, s.speed, dt);
      follow(s.target, c.target, s.targetSpeed, dt);
      // the field of view on the same spring, one number on its own
      scratch.set(s.fov, 0, 0);
      scratchTarget.set(c.fov, 0, 0);
      right.set(s.fovSpeed, 0, 0);
      follow(scratch, scratchTarget, right, dt);
      s.fov = scratch.x;
      s.fovSpeed = right.x;
      // The plan has stopped and the camera is still catching up: keep
      // drawing until it arrives. While the plan moves, whatever moves it
      // decides that (the overview's slow drift is allowed to rest).
      const planStill = s.lastPlan.distanceToSquared(c.position) < 1e-10;
      if (planStill && (s.position.distanceToSquared(c.position) > 1e-6 || s.target.distanceToSquared(c.target) > 1e-6 || Math.abs(s.fov - c.fov) > 1e-3)) stir();
    }

    s.lastPlan.copy(c.position);
    camera.position.copy(s.position);
    camera.lookAt(s.target);
    // so anything placed on screen this frame (the name tags) uses the new view
    camera.updateMatrixWorld();
    rig.position.copy(s.position);
    rig.target.copy(s.target);

    // Slide the picture aside to make room for the open panel
    const wanted = state.viewOffset;
    const ko = reduced ? 1 : 1 - Math.exp(-5 * dt);
    offset.current.x += (wanted.x - offset.current.x) * ko;
    offset.current.y += (wanted.y - offset.current.y) * ko;
    const ox = Math.round(offset.current.x);
    const oy = Math.round(offset.current.y);
    if (ox !== 0 || oy !== 0) camera.setViewOffset(size.width, size.height, ox, oy, size.width, size.height);
    else if (camera.view) camera.clearViewOffset();

    if (Math.abs(camera.fov - s.fov) > 0.001) camera.fov = s.fov;
    camera.updateProjectionMatrix();
  }, -5);

  return null;
}
