"use client";

import { useEffect, useMemo } from "react";
import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, MeshStandardMaterial } from "three";
import { AD_BOARD, DUGOUT, PITCH, TUNNEL } from "./dims";

// The boards round the pitch: LED screens, switched on but showing
// nothing, no words and no sponsors (Ryan's rule): plain club blue,
// darker at the foot, with the fine grid of lamps a real board has up
// close. Before 2026-11-24 they were switched off, which read as black
// boxes.
//
// To change the colour, change LED. To put something on them later,
// give `ledColour` in the shader a picture.

const H = AD_BOARD.height;
// [foot, top] of the screens' glow, and how bright
const LED = { foot: "#0b1d58", top: "#1f4fd1", strength: 0.75 };

type Run = { from: [number, number]; to: [number, number] };

// Each run is one straight board, written so that walking from `from`
// to `to` keeps the pitch on your left: its face then points at the pitch.
function runs(): Run[] {
  const z = PITCH.halfWidth + AD_BOARD.offsetZ;
  const x = PITCH.halfLength + AD_BOARD.offsetX;
  const gap = TUNNEL.halfWidth + 1.2;
  const benchNear = DUGOUT.x - DUGOUT.width / 2 - 1;
  const benchFar = DUGOUT.x + DUGOUT.width / 2 + 1;
  return [
    // east touchline
    { from: [-50, z], to: [50, z] },
    // west touchline, open where the tunnel comes out and in front of each bench
    { from: [50, -z], to: [benchFar, -z] },
    { from: [benchNear, -z], to: [gap, -z] },
    { from: [-gap, -z], to: [-benchNear, -z] },
    { from: [-benchFar, -z], to: [-50, -z] },
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

  const screen = useMemo(() => {
    const material = new MeshStandardMaterial({ color: "#05070b", roughness: 0.28, metalness: 0.1 });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uFoot = { value: new Color(LED.foot) };
      shader.uniforms.uTop = { value: new Color(LED.top) };
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec2 vBoard;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvBoard = vec2( position.x + position.z, position.y );");
      shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec2 vBoard;\nuniform vec3 uFoot;\nuniform vec3 uTop;").replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        // the lamps: a grid every 10 mm, fading out with distance so it never shimmers
        vec2 cell = fract( vBoard * 100.0 ) - 0.5;
        float lamp = 1.0 - smoothstep( 0.25, 0.5, max( abs( cell.x ), abs( cell.y ) ) );
        float far = smoothstep( 0.2, 0.6, fwidth( vBoard.x * 100.0 ) );
        float lit = mix( 0.55 + 0.45 * lamp, 0.8, far );
        float up = clamp( vBoard.y / ${H.toFixed(2)}, 0.0, 1.0 );
        totalEmissiveRadiance = mix( uFoot, uTop, up ) * lit * ${LED.strength.toFixed(2)};`,
      );
    };
    material.customProgramCacheKey = () => "ad-boards-led";
    return material;
  }, []);
  useEffect(() => () => screen.dispose(), [screen]);

  return (
    <group>
      <mesh geometry={geometry.boards} material={screen} castShadow />
      <mesh geometry={geometry.casing}>
        <meshStandardMaterial color="#0d0f14" roughness={0.7} side={DoubleSide} />
      </mesh>
    </group>
  );
}
