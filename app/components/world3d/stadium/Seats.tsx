"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { use, useEffect, useMemo, useRef } from "react";
import { BufferGeometry, Color, Group, InstancedBufferAttribute, InstancedMesh, MeshStandardMaterial, Sphere, Vector3 } from "three";
import { withBakedLight } from "./bakedLight";
import { SEAT_COLOR } from "./materials";
import { loadSeatData, type SeatData } from "./seatData";

// ------------------------------------------------------------------
// The seats: about 64,000 copies of one tip-up seat.
//
// They are drawn in chunks of a few hundred (one block of one tier), so
// the blocks behind the camera cost nothing. A chunk close to the
// camera uses the detailed seat; the rest use a plain block, which
// looks the same from a distance.
// ------------------------------------------------------------------

// Closer than this (metres from the edge of a chunk), use the detailed seat
const DETAIL_DISTANCE = 38;

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
      // sky, pitch and sun, as worked out in Blender
      light.set([details[seat * 8 + 2] / 255, details[seat * 8 + 3] / 255, details[seat * 8 + 6] / 255], i * 3);
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
  const camera = useThree((s) => s.camera);
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
