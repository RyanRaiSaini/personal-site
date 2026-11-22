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
// To reframe a section, change its numbers here. The stadium views use
// long lenses (a field of view near 30) from well back: that is what
// makes the stands rise behind the subject the way they do on
// television, where a wide lens close up would shrink them.
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
    pose: { position: [12, 1.75, 17.5], target: [-0.9, 1.55, 0], fov: 29 },
    narrow: { position: [7, 2.6, 13], target: [0, 2.2, 0], fov: 50 },
    anchor: [0, 3.2, 0],
  },
  projects: {
    scene: "bowl",
    pose: { position: [28, 2.6, 13.5], target: [52.5, 2.2, -2], fov: 33 },
    narrow: { position: [36, 3.6, 12], target: [52.5, 3, -1], fov: 52 },
    anchor: [52.5, 4.6, 0],
  },
  experience: {
    scene: "bowl",
    pose: { position: [-5.5, 2.1, -22.5], target: [-15.5, 1.7, -41], fov: 33 },
    narrow: { position: [-8, 2.8, -27], target: [-15, 2.6, -41], fov: 52 },
    anchor: [-15, 4.6, -40],
  },
  github: {
    scene: "bowl",
    // the scoreboard under the main stand's second tier (stadium/GithubBoard.tsx)
    // square on to the board (the camera rig itself moves it clear of the panel)
    pose: { position: [0, 9, -26], target: [0, 9.6, -57.5], fov: 40 },
    // on a phone the panel covers the lower half, so the board sits high
    narrow: { position: [0, 9.6, -15], target: [0, 9, -57.5], fov: 60 },
    anchor: [0, 11.8, -57.5],
  },
  live: {
    scene: "bowl",
    pose: { position: [0, 5, 20], target: [0, 43, -40], fov: 52 },
    narrow: { position: [0, 5, 22], target: [0, 52, -40], fov: 60 },
    anchor: [0, 50, -37.5],
  },
  skills: {
    scene: "dressing",
    pose: { position: inRoom("dressing", [-0.6, 1.75, 6.4]), target: inRoom("dressing", [-1.7, 1.35, -2]), fov: 58 },
    narrow: { position: inRoom("dressing", [0, 1.8, 6]), target: inRoom("dressing", [0, 1.9, -2]), fov: 66 },
    anchor: [-9, 3.2, -43.5],
  },
  awards: {
    scene: "trophy",
    // close enough to read the plaques
    pose: { position: inRoom("trophy", [0, 1.8, 6.6]), target: inRoom("trophy", [0, 1.45, -1.6]), fov: 48 },
    narrow: { position: inRoom("trophy", [0, 2.1, 7.2]), target: inRoom("trophy", [0, 1.7, -1.6]), fov: 74 },
    anchor: [26, 14.4, -58.2],
  },
  news: {
    scene: "press",
    pose: { position: inRoom("press", [1.6, 1.75, 6.4]), target: inRoom("press", [-1.5, 1.4, -2]), fov: 54 },
    narrow: { position: inRoom("press", [0, 1.8, 6.8]), target: inRoom("press", [0, 2.0, -2]), fov: 66 },
    anchor: [-26, 14.4, -58.2],
  },
  resume: {
    scene: "tickets",
    pose: { position: inRoom("tickets", [0, 1.7, 7]), target: inRoom("tickets", [0, 1.7, -2]), fov: 46 },
    narrow: { position: inRoom("tickets", [0, 1.8, 7.6]), target: inRoom("tickets", [0, 2.3, -2]), fov: 62 },
    anchor: [66, 9.6, -44],
  },
  contact: {
    scene: "mixed",
    pose: { position: inRoom("mixed", [0.4, 1.7, 5.6]), target: inRoom("mixed", [0, 1.4, -2]), fov: 50 },
    narrow: { position: inRoom("mixed", [0, 1.8, 6.2]), target: inRoom("mixed", [0, 1.9, -2]), fov: 66 },
    anchor: [9, 3.2, -43.5],
  },
};

// The view of the whole stadium. The camera rides a track that follows
// the front of the third tier, like a television camera slung under the
// upper deck: a rectangle with well-rounded corners, a little above the
// tier's front wall. `azimuth` is the angle round the track in radians;
// PI / 4 is the north-east corner, looking across at the main stand.
//
// A longer lens (a smaller `fov`) keeps the building's lines straight;
// wide lenses are what make a large stadium look like a toy.
export const ORBIT = {
  radiusX: 83, // half the track's length, along the pitch
  radiusZ: 63, // half its width
  height: 26,
  targetHeight: 5,
  fov: 48,
  narrowFov: 64,
  startAzimuth: Math.PI / 4,
};

export function orbitPose(azimuth: number, narrow: boolean): Pose {
  // a "squircle": straight along the sides and ends, round at the corners
  const c = Math.cos(azimuth);
  const s = Math.sin(azimuth);
  const x = Math.sign(c) * Math.sqrt(Math.abs(c)) * ORBIT.radiusX;
  const z = Math.sign(s) * Math.sqrt(Math.abs(s)) * ORBIT.radiusZ;
  // Look just past the centre spot, toward the far side
  return {
    position: [x, ORBIT.height, z],
    target: [-x * 0.14, ORBIT.targetHeight, -z * 0.15],
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
