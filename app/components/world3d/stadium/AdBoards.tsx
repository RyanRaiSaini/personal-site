"use client";

import { useEffect, useMemo } from "react";
import { BufferGeometry, DoubleSide, Float32BufferAttribute } from "three";
import { AD_BOARD, PITCH, TUNNEL } from "./dims";

// The boards round the pitch. They are switched off: plain dark screens
// with no words and no sponsors on them, catching a little of the light
// like any glossy panel does.
//
// To put something on them later, give the `boards` mesh a picture
// (a `map`) in place of its plain colour.

const H = AD_BOARD.height;

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
  const indices: number[] = [];
  for (const { from, to } of runs()) {
    const base = positions.length / 3;
    positions.push(from[0], 0.04, from[1], to[0], 0.04, to[1], from[0], H, from[1], to[0], H, to[1]);
    indices.push(base, base + 2, base + 1, base + 2, base + 3, base + 1);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
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
  const geometry = useMemo(() => ({ boards: boardGeometry(), casing: casingGeometry() }), []);

  useEffect(() => {
    return () => {
      geometry.boards.dispose();
      geometry.casing.dispose();
    };
  }, [geometry]);

  return (
    <group>
      <mesh geometry={geometry.boards} castShadow>
        <meshStandardMaterial color="#090b10" roughness={0.32} metalness={0.15} />
      </mesh>
      <mesh geometry={geometry.casing}>
        <meshStandardMaterial color="#0d0f14" roughness={0.7} side={DoubleSide} />
      </mesh>
    </group>
  );
}
