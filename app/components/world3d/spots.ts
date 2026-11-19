import type { SectionId } from "../../sections/registry";

// ------------------------------------------------------------------
// Where the camera goes for each section, and where each section's
// name tag floats in the stadium.
//
// A pose is a camera position, the point it looks at, and its field of
// view (a smaller number zooms in). Positions are in metres: X runs
// along the pitch (north is +X), Y is height, Z runs across it (the
// main stand is at -Z).
//
// To reframe a section, change its numbers here.
// ------------------------------------------------------------------

export type Vec3 = [number, number, number];

export type Pose = {
  position: Vec3;
  target: Vec3;
  fov: number;
};

export type SceneId = "bowl" | "dressing" | "trophy" | "press" | "tickets" | "mixed";

export type Spot = {
  scene: SceneId;
  pose: Pose;
  // A closer or taller framing for narrow (phone) screens
  narrow?: Pose;
  // Where the name tag floats when you look at the whole stadium
  anchor: Vec3;
};

// Each room is built far away from the bowl, at its own origin, so the
// two never show through each other
export const ROOM_ORIGIN: Record<Exclude<SceneId, "bowl">, Vec3> = {
  dressing: [0, 0, -600],
  trophy: [300, 0, -600],
  press: [600, 0, -600],
  tickets: [900, 0, -600],
  mixed: [1200, 0, -600],
};

function inRoom(room: Exclude<SceneId, "bowl">, v: Vec3): Vec3 {
  const o = ROOM_ORIGIN[room];
  return [o[0] + v[0], o[1] + v[1], o[2] + v[2]];
}

export const SPOTS: Record<Exclude<SectionId, "home">, Spot> = {
  about: {
    scene: "bowl",
    pose: { position: [8.5, 2.3, 12.5], target: [-0.5, 1.5, 0], fov: 40 },
    narrow: { position: [7, 2.6, 13], target: [0, 2.2, 0], fov: 50 },
    anchor: [0, 3.2, 0],
  },
  projects: {
    scene: "bowl",
    pose: { position: [33, 3.4, 10.5], target: [52.5, 1.9, -1.5], fov: 42 },
    narrow: { position: [36, 3.6, 12], target: [52.5, 3, -1], fov: 52 },
    anchor: [52.5, 4.6, 0],
  },
  experience: {
    scene: "bowl",
    pose: { position: [-8.5, 2.5, -29], target: [-15.5, 1.5, -41], fov: 42 },
    narrow: { position: [-8, 2.8, -27], target: [-15, 2.6, -41], fov: 52 },
    anchor: [-15, 4.6, -40],
  },
  github: {
    scene: "bowl",
    pose: { position: [0, 21, 24], target: [0, 15.5, -66], fov: 50 },
    narrow: { position: [0, 22, 30], target: [0, 22, -66], fov: 62 },
    anchor: [0, 23.5, -71],
  },
  live: {
    scene: "bowl",
    pose: { position: [0, 5, 20], target: [0, 43, -40], fov: 52 },
    narrow: { position: [0, 5, 22], target: [0, 52, -40], fov: 60 },
    anchor: [0, 49.5, -38],
  },
  skills: {
    scene: "dressing",
    pose: { position: inRoom("dressing", [0, 1.75, 5.4]), target: inRoom("dressing", [0, 1.35, -2]), fov: 52 },
    narrow: { position: inRoom("dressing", [0, 1.8, 6]), target: inRoom("dressing", [0, 1.9, -2]), fov: 66 },
    anchor: [-9, 3.2, -43.5],
  },
  awards: {
    scene: "trophy",
    pose: { position: inRoom("trophy", [0, 1.7, 6]), target: inRoom("trophy", [0, 1.45, -2]), fov: 48 },
    narrow: { position: inRoom("trophy", [0, 1.8, 6.6]), target: inRoom("trophy", [0, 2.0, -2]), fov: 64 },
    anchor: [26, 12.2, -59.6],
  },
  news: {
    scene: "press",
    pose: { position: inRoom("press", [0.6, 1.7, 6.2]), target: inRoom("press", [0, 1.4, -2]), fov: 50 },
    narrow: { position: inRoom("press", [0, 1.8, 6.8]), target: inRoom("press", [0, 2.0, -2]), fov: 66 },
    anchor: [-26, 12.2, -59.6],
  },
  resume: {
    scene: "tickets",
    pose: { position: inRoom("tickets", [0, 1.7, 7]), target: inRoom("tickets", [0, 1.7, -2]), fov: 46 },
    narrow: { position: inRoom("tickets", [0, 1.8, 7.6]), target: inRoom("tickets", [0, 2.3, -2]), fov: 62 },
    anchor: [-58, 4.2, -36],
  },
  contact: {
    scene: "mixed",
    pose: { position: inRoom("mixed", [0.4, 1.7, 5.6]), target: inRoom("mixed", [0, 1.4, -2]), fov: 50 },
    narrow: { position: inRoom("mixed", [0, 1.8, 6.2]), target: inRoom("mixed", [0, 1.9, -2]), fov: 66 },
    anchor: [9, 3.2, -43.5],
  },
};

// The view of the whole stadium: the camera rides an oval track above
// the lower tiers. `azimuth` is the angle round the track in radians;
// PI / 2 is the middle of the east stand, looking at the main stand.
export const ORBIT = {
  radiusX: 76,
  radiusZ: 64,
  height: 23.5,
  targetHeight: 9.5,
  fov: 52,
  narrowFov: 70,
  startAzimuth: Math.PI / 2,
};

export function orbitPose(azimuth: number, narrow: boolean): Pose {
  const x = Math.cos(azimuth) * ORBIT.radiusX;
  const z = Math.sin(azimuth) * ORBIT.radiusZ;
  // Look past the centre spot toward the far stand
  return {
    position: [x, ORBIT.height, z],
    target: [-x * 0.28, ORBIT.targetHeight, -z * 0.3],
    fov: narrow ? ORBIT.narrowFov : ORBIT.fov,
  };
}

export function sceneOf(section: SectionId): SceneId {
  return section === "home" ? "bowl" : SPOTS[section].scene;
}

export function poseOf(section: Exclude<SectionId, "home">, narrow: boolean): Pose {
  const spot = SPOTS[section];
  return narrow && spot.narrow ? spot.narrow : spot.pose;
}
