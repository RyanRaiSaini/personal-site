"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BufferGeometry, DoubleSide, Float32BufferAttribute, type MeshBasicMaterial } from "three";
import { now as nowData } from "../../../data/portfolio";
import { atmo } from "../atmosphere/state";
import { ledStrip, useDisplayFont } from "../textures/text";
import { AD_BOARD, PITCH, TUNNEL } from "./dims";

// The LED boards round the pitch. They scroll the lines in
// `now.ticker` (app/data/portfolio.ts).

const H = AD_BOARD.height;
const PIXELS_PER_METRE = 84;

type Run = { from: [number, number]; to: [number, number] };

// Each run is one straight board, written so that walking from `from`
// to `to` keeps the pitch on your left: its face then points at the pitch.
function runs(): Run[] {
  const z = PITCH.halfWidth + AD_BOARD.offsetZ;
  const x = PITCH.halfLength + AD_BOARD.offsetX;
  const gap = TUNNEL.halfWidth + 1.2;
  return [
    // east touchline
    { from: [-50, z], to: [50, z] },
    // west touchline, with a gap where the tunnel comes out
    { from: [50, -z], to: [gap, -z] },
    { from: [-gap, -z], to: [-50, -z] },
    // behind the goals
    { from: [x, 30], to: [x, -30] },
    { from: [-x, -30], to: [-x, 30] },
  ];
}

function boardGeometry() {
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  let travelled = 0;
  for (const { from, to } of runs()) {
    const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const base = positions.length / 3;
    positions.push(from[0], 0, from[1], to[0], 0, to[1], from[0], H, from[1], to[0], H, to[1]);
    // Reading left to right while facing the board from the pitch
    uvs.push(travelled + length, 0, travelled, 0, travelled + length, 1, travelled, 1);
    indices.push(base, base + 2, base + 1, base + 2, base + 3, base + 1);
    travelled += length;
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

// Dark backs and tops, so the boards are solid from every side
function casingGeometry() {
  const positions: number[] = [];
  const indices: number[] = [];
  const depth = 0.22;
  for (const { from, to } of runs()) {
    const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
    const tx = (to[0] - from[0]) / length;
    const tz = (to[1] - from[1]) / length;
    // away from the pitch
    const nx = -tz;
    const nz = tx;
    const base = positions.length / 3;
    const corners: [number, number][] = [from, to];
    for (const [cx, cz] of corners) {
      positions.push(cx, 0, cz, cx, H, cz, cx + nx * depth, 0, cz + nz * depth, cx + nx * depth, H, cz + nz * depth);
    }
    // top
    indices.push(base + 1, base + 3, base + 5, base + 5, base + 3, base + 7);
    // back
    indices.push(base + 2, base + 6, base + 3, base + 3, base + 6, base + 7);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export default function AdBoards() {
  const family = useDisplayFont();
  const material = useRef<MeshBasicMaterial>(null);

  const geometry = useMemo(() => ({ boards: boardGeometry(), casing: casingGeometry() }), []);

  const texture = useMemo(() => {
    if (!family) return null;
    const palette = ["#ffffff", "#f2cf6b", "#ffffff", "#8fb4ff"];
    const segments = nowData.ticker.map((text, i) => ({ text, color: palette[i % palette.length] }));
    const made = ledStrip(family, segments, { height: Math.round(H * PIXELS_PER_METRE), pixelsPerUnit: PIXELS_PER_METRE, weight: 700, gap: 1.6 });
    made.texture.repeat.set(1 / made.worldLength, 1);
    return made.texture;
  }, [family]);

  useEffect(() => {
    return () => {
      geometry.boards.dispose();
      geometry.casing.dispose();
    };
  }, [geometry]);

  useEffect(() => {
    return () => texture?.dispose();
  }, [texture]);

  useFrame((_, delta) => {
    if (texture) texture.offset.x = (texture.offset.x + delta * 0.035) % 1;
    if (material.current) material.current.color.setScalar(1.0 + 0.9 * atmo.floodlights - 0.15 * atmo.outdoor);
  });

  return (
    <group>
      {texture && (
        <mesh geometry={geometry.boards}>
          <meshBasicMaterial ref={material} map={texture} toneMapped={false} />
        </mesh>
      )}
      <mesh geometry={geometry.casing}>
        <meshStandardMaterial color="#0d0f14" roughness={0.7} side={DoubleSide} />
      </mesh>
    </group>
  );
}
