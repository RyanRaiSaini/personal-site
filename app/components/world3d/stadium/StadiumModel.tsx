"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { use, useEffect, useMemo, useRef } from "react";
import { MeshBasicMaterial, type BufferGeometry, type CanvasTexture, type Material, type Mesh, type MeshStandardMaterial, type Object3D } from "three";
import { useWorld, type Show } from "../../../lib/store";
import { atmo } from "../atmosphere/state";
import { canvasTexture } from "../textures/canvas";
import { ledStrip, useDisplayFont, type StripSegment } from "../textures/text";
import { makeMaterials, type StadiumMaterials } from "./materials";
import { perimeter } from "./path";
import { loadSeatData } from "./seatData";
import GithubBoard from "./GithubBoard";
import Seats from "./Seats";

// ------------------------------------------------------------------
// The stadium itself: the stands, the roof, the ring of screens and
// the seats.
//
// The shape comes from a model built in Blender (blender/build.py,
// packed into public/stadium/stadium.glb). This file loads it, gives
// each named surface its material (materials.ts), and runs the few
// parts that move or light up:
//
//   - the ten roof panels slide shut as `atmo.roof` goes from 0 to 1
//     (closing the roof is the site's dark mode)
//   - the ring of screens is dark until a goal or the fireworks
//   - the floodlights brighten as the daylight goes
//
// The GitHub scoreboard on the main stand is GithubBoard.tsx.
// ------------------------------------------------------------------

export const MODEL_URL = "/stadium/stadium.glb";

const GOLD = "#f2cf6b";
const WHITE = "#f4f6fb";
const SCREEN_D = -4.6; // how far inside the front wall the ring of screens hangs
const SCREEN_HEIGHT = 5.5;
const SCREEN_PIXELS_PER_METRE = 30;
const LAMP_SPACING = 1.7;

type Parts = {
  panels: { node: Object3D; closedX: number }[];
  screen: Mesh | null;
  lamps: Mesh | null;
  seatDetailed: BufferGeometry;
  seatPlain: BufferGeometry;
};

// Which top-level part of the model a mesh belongs to ("Terraces", "Roof"...)
function partOf(mesh: Object3D, root: Object3D): string {
  let node: Object3D = mesh;
  while (node.parent && node.parent !== root) node = node.parent;
  return node.name;
}

// The model is taken apart once (the seat patterns are lifted out of
// it), so the result is remembered: asking twice must not fail.
const prepared = new WeakMap<Object3D, Parts>();

function prepare(scene: Object3D, materials: StadiumMaterials): Parts {
  const before = prepared.get(scene);
  if (before) return before;
  const panels: Object3D[] = [];
  let screen: Mesh | null = null;
  let lamps: Mesh | null = null;
  let seatDetailed: BufferGeometry | null = null;
  let seatPlain: BufferGeometry | null = null;
  const seats: Object3D[] = [];

  scene.traverse((node) => {
    if (node.name.startsWith("RoofPanel") && node.parent === scene) panels.push(node);
    const mesh = node as Mesh;
    if (!mesh.isMesh) return;
    const part = partOf(mesh, scene);
    if (part === "SeatHi" || part === "SeatLo") {
      if (part === "SeatHi") seatDetailed = mesh.geometry;
      else seatPlain = mesh.geometry;
      seats.push(mesh);
      return;
    }
    const name = (mesh.material as Material).name;
    if (materials[name]) mesh.material = materials[name];
    // The stadium's own shadows were worked out in Blender (bakedLight.ts),
    // so it takes no part in the live shadows; those are kept for the players.
    mesh.castShadow = false;
    mesh.receiveShadow = false;
    if (part === "Screen") screen = mesh;
    if (part === "Floodlights") lamps = mesh;
  });

  // The two seat shapes are only patterns to copy; take them out of the picture
  for (const seat of seats) seat.removeFromParent();
  if (!seatDetailed || !seatPlain) throw new Error("The stadium model has no seat in it");

  // Nothing but the roof panels moves, so the rest need not be recalculated every frame
  scene.traverse((node) => {
    node.updateMatrix();
    if (!node.name.startsWith("RoofPanel")) node.matrixAutoUpdate = false;
  });
  scene.updateMatrixWorld(true);

  panels.sort((a, b) => a.name.localeCompare(b.name));
  const parts: Parts = { panels: panels.map((node) => ({ node, closedX: node.position.x })), screen, lamps, seatDetailed, seatPlain };
  prepared.set(scene, parts);
  return parts;
}

// A row of floodlight lamps: bright dots on a dark bar
function lampTexture() {
  const texture = canvasTexture(64, 32, (ctx, w, h) => {
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, w, h);
    // a wide hot centre, so the bar still reads as a row of lamps from across the ground
    const dot = ctx.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, 24);
    dot.addColorStop(0, "#ffffff");
    dot.addColorStop(0.55, "#e6eeff");
    dot.addColorStop(1, "rgba(40,44,52,1)");
    ctx.fillStyle = dot;
    ctx.fillRect(0, 0, w, h);
  });
  // the model measures this surface in metres: one lamp every LAMP_SPACING
  texture.repeat.set(1 / LAMP_SPACING, 1 / 0.71);
  return texture;
}

// What the ring of screens says during a show
function showSegments(show: Show): StripSegment[] {
  if (show.kind === "goal") {
    return [
      { text: "GOOOOOL!", color: GOLD },
      { text: show.label, color: WHITE },
      { text: "GOOOOOL!", color: GOLD },
      { text: show.label, color: WHITE },
    ];
  }
  if (show.kind === "fireworks") {
    return [
      { text: "¡HALA MADRID!", color: GOLD },
      { text: show.label, color: WHITE },
      { text: "¡HALA MADRID!", color: GOLD },
      { text: "Y NADA MÁS", color: WHITE },
    ];
  }
  if (show.kind === "fifteen") {
    return [
      { text: "15", color: GOLD },
      { text: "KINGS OF EUROPE", color: WHITE },
      { text: "15", color: GOLD },
      { text: "LA DECIMOQUINTA", color: WHITE },
    ];
  }
  return [
    { text: "66", color: GOLD },
    { text: "WHAT A PASS", color: WHITE },
  ];
}

function easeInOut(t: number) {
  return t * t * (3 - 2 * t);
}

export default function StadiumModel() {
  const gltf = useGLTF(MODEL_URL, false, true);
  const data = use(loadSeatData());
  const show = useWorld((s) => s.show);
  const family = useDisplayFont();

  const materials = useMemo(() => makeMaterials(), []);
  const parts = useMemo(() => prepare(gltf.scene, materials), [gltf, materials]);
  const lampMap = useMemo(() => lampTexture(), []);
  const screenLit = useMemo(() => new MeshBasicMaterial({ color: "#ffffff", toneMapped: false }), []);
  const screenDark = useRef<Material | null>(null);
  const stripRef = useRef<CanvasTexture | null>(null);

  useEffect(() => {
    const lens = materials.FloodLens as MeshBasicMaterial;
    lens.map = lampMap;
    lens.needsUpdate = true;
    return () => {
      lampMap.dispose();
      screenLit.dispose();
      for (const material of Object.values(materials)) material.dispose();
    };
  }, [materials, lampMap, screenLit]);

  // The ring of screens: dark and glossy until there is something to celebrate
  const strip = useMemo(() => {
    if (!family || !show) return null;
    const made = ledStrip(family, showSegments(show), { height: Math.round(SCREEN_HEIGHT * SCREEN_PIXELS_PER_METRE), pixelsPerUnit: SCREEN_PIXELS_PER_METRE, weight: 800 });
    // The model numbers the ring 0 to 1 once round, so fit a whole
    // number of repeats in that. Seen from inside, the band runs right
    // to left, so the picture is flipped to read the right way.
    const repeats = Math.max(1, Math.round(perimeter(SCREEN_D) / made.worldLength));
    made.texture.repeat.set(-repeats, 1);
    // A model counts a picture's rows from the top, a painted canvas
    // from the bottom. Without this the words hang upside down.
    made.texture.flipY = false;
    made.texture.needsUpdate = true;
    return made.texture;
  }, [family, show]);

  useEffect(() => {
    const screen = parts.screen;
    if (!screen) return;
    screenDark.current ??= screen.material as Material;
    const previous = stripRef.current;
    stripRef.current = strip;
    if (strip) {
      screenLit.map = strip;
      screenLit.needsUpdate = true;
      screen.material = screenLit;
    } else {
      screen.material = screenDark.current;
    }
    return () => {
      previous?.dispose();
    };
  }, [parts, strip, screenLit]);

  const roof = data.manifest.roof;
  // Open panels park in a stack over the south end of the fixed roof
  const openHalf = Math.abs(roof.panelClosedX[0]) - roof.panelWidth / 2 + 1.5;
  const parkedX = -openHalf - roof.panelWidth / 2 - 2.5;

  useFrame((_, delta) => {
    // Panels leave the stack one after another, the far one first
    const n = parts.panels.length;
    parts.panels.forEach(({ node, closedX }, k) => {
      const start = ((n - 1 - k) / n) * 0.55;
      const local = easeInOut(Math.min(1, Math.max(0, (atmo.roof - start) / 0.45)));
      node.position.x = parkedX + (closedX - parkedX) * local;
      // Stacked panels sit a little above one another
      node.position.y = roof.panelY + (1 - local) * (k * 0.3);
    });

    // Closed panels glow softly with the daylight behind them
    (materials.Membrane as MeshStandardMaterial).emissiveIntensity = 0.03 + 0.75 * atmo.daylight * (1 - 0.45 * atmo.overcast);
    const power = 0.2 + 9.0 * atmo.floodlights;
    (materials.FloodLens as MeshBasicMaterial).color.setRGB(power, power, power * 1.06);

    const texture = stripRef.current;
    if (texture) {
      texture.offset.x = (texture.offset.x + delta * 0.05) % 1;
      // brighter than white under floodlights, so it glows; toned down in daylight
      screenLit.color.setScalar(1.0 + 0.7 * atmo.floodlights - 0.2 * atmo.outdoor);
    }
  });

  return (
    <group>
      <primitive object={gltf.scene} />
      <Seats detailedSeat={parts.seatDetailed} plainSeat={parts.seatPlain} />
      <GithubBoard />
    </group>
  );
}

useGLTF.preload(MODEL_URL, false, true);
