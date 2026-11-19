"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { use, useEffect, useMemo, useRef } from "react";
import { BufferGeometry, Color, Group, InstancedBufferAttribute, InstancedMesh, MeshStandardMaterial, Sphere, Vector3 } from "three";
import { useWorld } from "../../../lib/store";
import { SEAT_COLOR, withBakedLight } from "./materials";
import { loadSeatData, type SeatData } from "./seatData";

// ------------------------------------------------------------------
// The seats: about 64,000 copies of one tip-up seat.
//
// They are drawn in chunks of a few hundred (one block of one tier), so
// the blocks behind the camera cost nothing. A chunk close to the
// camera uses the detailed seat; the rest use a plain block, which
// looks the same from a distance.
//
// The seats in the second tier of the main stand also make a picture:
// a year of my GitHub contributions, one column of seats per week. A
// seat is whiter the more I committed that day.
// ------------------------------------------------------------------

// Closer than this (metres from the edge of a chunk), use the detailed seat
const DETAIL_DISTANCE = 38;

// From "nothing that day" to "a lot": navy, through pale blue, to white
const PICTURE = ["#1c3070", "#4c64a8", "#8d9fd0", "#c6cfe9", "#f3f5fa"].map((hex) => new Color(hex));

type Chunk = { centre: Vector3; radius: number; detailed: InstancedMesh; plain: InstancedMesh; colors: InstancedBufferAttribute; start: number; count: number };

// A new geometry that shares the seat's shape but can carry its own
// per-seat numbers
function shareGeometry(source: BufferGeometry, light: InstancedBufferAttribute): BufferGeometry {
  const geometry = new BufferGeometry();
  geometry.setIndex(source.getIndex());
  for (const name of Object.keys(source.attributes)) geometry.setAttribute(name, source.getAttribute(name));
  geometry.setAttribute("aBake", light);
  geometry.boundingBox = source.boundingBox;
  geometry.boundingSphere = source.boundingSphere;
  return geometry;
}

function build(data: SeatData, detailedSeat: BufferGeometry, plainSeat: BufferGeometry, material: MeshStandardMaterial) {
  const group = new Group();
  group.name = "Seats";
  const base = new Color(SEAT_COLOR);
  const chunks: Chunk[] = [];
  const { positions, details } = data;

  for (const info of data.manifest.chunks) {
    const n = info.count;
    const matrices = new Float32Array(n * 16);
    const colors = new Float32Array(n * 3);
    const light = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const seat = info.start + i;
      const x = positions[seat * 4];
      const y = positions[seat * 4 + 1];
      const z = positions[seat * 4 + 2];
      const turn = positions[seat * 4 + 3];
      const c = Math.cos(turn);
      const s = Math.sin(turn);
      // a turn about the upright axis, then a move to the seat's place
      matrices.set([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, x, y, z, 1], i * 16);
      // no two seats fade quite alike: a small, repeatable difference in shade
      const shade = 0.93 + 0.14 * (((seat * 2654435761) >>> 0) / 4294967295);
      colors.set([base.r * shade, base.g * shade, base.b * shade], i * 3);
      light.set([details[seat * 8 + 2] / 255, details[seat * 8 + 3] / 255, 1], i * 3);
    }
    const matrixAttribute = new InstancedBufferAttribute(matrices, 16);
    const colorAttribute = new InstancedBufferAttribute(colors, 3);
    const lightAttribute = new InstancedBufferAttribute(light, 3);
    const sphere = new Sphere(new Vector3(...info.centre), info.radius);

    const make = (shape: BufferGeometry) => {
      const mesh = new InstancedMesh(shareGeometry(shape, lightAttribute), material, n);
      mesh.instanceMatrix = matrixAttribute;
      mesh.instanceColor = colorAttribute;
      mesh.boundingSphere = sphere;
      mesh.receiveShadow = true;
      mesh.matrixAutoUpdate = false;
      return mesh;
    };
    const detailed = make(detailedSeat);
    const plain = make(plainSeat);
    detailed.visible = false;
    group.add(detailed, plain);
    chunks.push({ centre: sphere.center, radius: info.radius, detailed, plain, colors: colorAttribute, start: info.start, count: n });
  }
  return { group, chunks };
}

export default function Seats({ detailedSeat, plainSeat }: { detailedSeat: BufferGeometry; plainSeat: BufferGeometry }) {
  const data = use(loadSeatData());
  const contributions = useWorld((s) => s.contributions);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const lastCheck = useRef(new Vector3(1e9, 0, 0));

  const material = useMemo(() => {
    const made = new MeshStandardMaterial({ color: "#ffffff", roughness: 0.42, metalness: 0, vertexColors: true });
    made.name = "SeatPlastic";
    return withBakedLight(made, "seat");
  }, []);

  const { group, chunks } = useMemo(() => build(data, detailedSeat, plainSeat, material), [data, detailedSeat, plainSeat, material]);

  useEffect(() => {
    return () => {
      for (const chunk of chunks) {
        chunk.detailed.geometry.dispose();
        chunk.plain.geometry.dispose();
        chunk.detailed.dispose();
        chunk.plain.dispose();
      }
      material.dispose();
    };
  }, [chunks, material]);

  // The picture on the main stand
  useEffect(() => {
    const { details } = data;
    const base = new Color(SEAT_COLOR);
    const color = new Color();
    for (const chunk of chunks) {
      let touched = false;
      for (let i = 0; i < chunk.count; i++) {
        const seat = chunk.start + i;
        const week = details[seat * 8 + 4];
        const day = details[seat * 8 + 5];
        if (week === 255) continue;
        // Until the real numbers arrive, a faint dotted pattern holds the place
        const level = contributions ? (contributions.levels[week]?.[day] ?? 0) : (week * 7 + day * 3) % 11 === 0 ? 1 : 0;
        const shade = 0.95 + 0.1 * (((seat * 2654435761) >>> 0) / 4294967295);
        color.copy(level > 0 ? PICTURE[Math.min(4, level)] : base).multiplyScalar(shade);
        chunk.colors.setXYZ(i, color.r, color.g, color.b);
        touched = true;
      }
      if (touched) chunk.colors.needsUpdate = true;
    }
    invalidate();
  }, [data, chunks, contributions, invalidate]);

  // Swap in the detailed seat for the chunks near the camera. Only
  // checked once the camera has moved a little.
  useFrame(() => {
    if (lastCheck.current.distanceToSquared(camera.position) < 1) return;
    lastCheck.current.copy(camera.position);
    for (const chunk of chunks) {
      const near = camera.position.distanceTo(chunk.centre) - chunk.radius < DETAIL_DISTANCE;
      chunk.detailed.visible = near;
      chunk.plain.visible = !near;
    }
  });

  return <primitive object={group} />;
}
