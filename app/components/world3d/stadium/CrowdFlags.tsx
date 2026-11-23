"use client";

import { useFrame } from "@react-three/fiber";
import { use, useEffect, useMemo } from "react";
import { BufferGeometry, CylinderGeometry, DoubleSide, Float32BufferAttribute, InstancedBufferAttribute, InstancedMesh, Matrix4, MeshStandardMaterial, PlaneGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useWorld } from "../../../lib/store";
import { atmo } from "../atmosphere/state";
import { canvasTexture } from "../textures/canvas";
import { withBakedLight } from "./bakedLight";
import { isTaken, seatHash as hash } from "./crowdPlan";
import { loadSeatData } from "./seatData";

// ------------------------------------------------------------------
// Flags in the crowd: here and there a fan holds one up on a pole, and
// it streams out on the wind. Canada's and the United States' flags
// (Ryan asked for them on 2026-11-24) and two plain club flags in the
// club's colours (no crests, no words). Every flag streams the same way,
// downwind (WIND).
//
// All of them are one instanced mesh, their pictures side by side in one
// texture (KINDS). The waving is worked out on the graphics card; near
// the camera the cloth ripples, far off it only sways, since a fast
// ripple on a flag a few pixels wide only shimmers. Like the crowd, it
// moves only while the picture is drawn.
//
// To have more or fewer, change SHARE; the mix of flags is in KINDS.
// ------------------------------------------------------------------

const SHARE = 0.0045; // of the taken seats
const FLAG = { width: 1.3, height: 0.65, pole: 2.3 };
// the way the wind blows across the ground (x, z), the same for every flag
const WIND = { x: 0.85, z: 0.53 };

type Kind = { name: string; share: number; draw: (ctx: CanvasRenderingContext2D, x: number, w: number, h: number) => void };

// the maple leaf, as a polygon round its centre (x right, y up, about -1 to 1)
const LEAF: [number, number][] = [
  [0, 1], [0.12, 0.74], [0.3, 0.83], [0.22, 0.4], [0.46, 0.63], [0.52, 0.49], [0.78, 0.55], [0.66, 0.29], [0.8, 0.24],
  [0.46, -0.05], [0.53, -0.21], [0.08, -0.15], [0.06, -0.6], [-0.06, -0.6], [-0.08, -0.15], [-0.53, -0.21], [-0.46, -0.05],
  [-0.8, 0.24], [-0.66, 0.29], [-0.78, 0.55], [-0.52, 0.49], [-0.46, 0.63], [-0.22, 0.4], [-0.3, 0.83], [-0.12, 0.74],
];

const RED = "#d52b1e";
const KINDS: Kind[] = [
  {
    // red, white, red in 1 : 2 : 1, the red maple leaf in the middle
    name: "Canada",
    share: 0.38,
    draw: (ctx, x, w, h) => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x, 0, w, h);
      ctx.fillStyle = RED;
      ctx.fillRect(x, 0, w / 4, h);
      ctx.fillRect(x + (w * 3) / 4, 0, w / 4, h);
      const cx = x + w / 2;
      const cy = h / 2 + 2;
      const r = h * 0.38;
      ctx.beginPath();
      LEAF.forEach(([lx, ly], i) => (i ? ctx.lineTo(cx + lx * r, cy - ly * r) : ctx.moveTo(cx + lx * r, cy - ly * r)));
      ctx.closePath();
      ctx.fill();
    },
  },
  {
    // thirteen stripes, red at top and bottom; a blue canton of fifty stars
    name: "United States",
    share: 0.24,
    draw: (ctx, x, w, h) => {
      for (let i = 0; i < 13; i++) {
        ctx.fillStyle = i % 2 ? "#ffffff" : "#b31942";
        ctx.fillRect(x, (i * h) / 13, w, h / 13 + 0.5);
      }
      const cw = w * 0.4;
      const ch = (h * 7) / 13;
      ctx.fillStyle = "#0a3161";
      ctx.fillRect(x, 0, cw, ch);
      ctx.fillStyle = "#ffffff";
      for (let row = 0; row < 9; row++) {
        const n = row % 2 ? 5 : 6;
        for (let col = 0; col < n; col++) {
          const sx = x + ((col + (row % 2 ? 1 : 0.5)) * cw) / 6;
          const sy = ((row + 0.5) * ch) / 9;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    },
  },
  {
    // the club: white with a navy band across the middle
    name: "Club white",
    share: 0.22,
    draw: (ctx, x, w, h) => {
      ctx.fillStyle = "#f4f4f0";
      ctx.fillRect(x, 0, w, h);
      ctx.fillStyle = "#17244d";
      ctx.fillRect(x, h * 0.36, w, h * 0.28);
    },
  },
  {
    // the club: navy with a gold band
    name: "Club navy",
    share: 0.16,
    draw: (ctx, x, w, h) => {
      ctx.fillStyle = "#17244d";
      ctx.fillRect(x, 0, w, h);
      ctx.fillStyle = "#d6a93f";
      ctx.fillRect(x, h * 0.36, w, h * 0.28);
    },
  },
];

function flagPictures() {
  const cellW = 256;
  const cellH = 128;
  return canvasTexture(
    cellW * KINDS.length,
    cellH,
    (ctx) => {
      KINDS.forEach((kind, i) => kind.draw(ctx, i * cellW, cellW, cellH));
    },
    { repeat: false, anisotropy: 4 },
  );
}

function flagGeometry() {
  // the cloth, many strips across so it can ripple, hung from the pole's top
  const cloth = new PlaneGeometry(FLAG.width, FLAG.height, 14, 4);
  cloth.translate(FLAG.width / 2, FLAG.pole - FLAG.height / 2, 0);
  const pole = new CylinderGeometry(0.018, 0.018, FLAG.pole, 5);
  pole.translate(0, FLAG.pole / 2, 0);
  // the pole has no cloth: mark it so the shader leaves it still and dark
  pole.setAttribute("uv", new Float32BufferAttribute(new Float32Array(pole.getAttribute("uv").count * 2).fill(-1), 2));
  const merged = mergeGeometries([cloth, pole], false) as BufferGeometry;
  cloth.dispose();
  pole.dispose();
  return merged;
}

export default function CrowdFlags() {
  const data = use(loadSeatData());
  const quality = useWorld((s) => s.quality);

  const { mesh, material, uniforms } = useMemo(() => {
    const { positions, details } = data;
    const chosen: number[] = [];
    for (let i = 0; i < data.manifest.seats; i++) if (isTaken(i) && hash(i, 21) < SHARE) chosen.push(i);

    const uniforms = { uTime: { value: 0 } };
    const material = new MeshStandardMaterial({ map: flagPictures(), roughness: 0.85, side: DoubleSide, forceSinglePass: true });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nattribute vec2 aFlag;\nuniform float uTime;\nvarying float vMain;")
        .replace(
          "#include <uv_vertex>",
          // each flag's own picture from the row of them
          `#include <uv_vertex>
          vMapUv = vec2( ( max( uv.x, 0.0 ) + aFlag.x ) / ${KINDS.length.toFixed(1)}, uv.y );`,
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          vMain = 1.0;
          if ( uv.x >= 0.0 ) {
            // streaming out downwind from the pole: a wave running along
            // it, growing toward the free edge, the whole flag lifting and
            // dropping as the gusts come. The fast ripple only near the
            // camera: from across the bowl a flag is a few pixels and a
            // ripple there only shimmers; far off it only sways.
            vec3 heldAt = ( modelMatrix * instanceMatrix * vec4( 0.0, 0.0, 0.0, 1.0 ) ).xyz;
            float near = 1.0 - smoothstep( 20.0, 45.0, distance( heldAt, cameraPosition ) );
            float along = uv.x;
            float gust = 0.55 + 0.45 * sin( uTime * 0.6 + aFlag.y * 30.0 );
            float t = uTime * ( 2.6 + aFlag.y * 1.2 ) + aFlag.y * 40.0;
            transformed.z += near * along * gust * ( 0.2 * sin( along * 5.5 - t ) + 0.07 * sin( along * 11.0 - t * 1.7 ) );
            // in a lull the cloth droops; in a gust it stands out
            transformed.y -= along * along * 0.3 * ( 1.0 - gust );
            float swing = ( 0.12 + 0.15 * near ) * sin( uTime * 0.5 + aFlag.y * 20.0 );
            transformed.z += swing * transformed.x * 0.35;
          } else {
            vMain = 0.0;
          }`,
        );
      shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying float vMain;").replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        // the pole dark
        if ( vMain < 0.5 ) diffuseColor.rgb = vec3( 0.06 );`,
      );
    };
    material.customProgramCacheKey = () => "crowd-flags-v4";
    // the same worked-out light as the seats they are held over: in the
    // roof's shade by day, under the lamps at night
    withBakedLight(material, "seat");

    const shares = KINDS.reduce((sum, kind) => sum + kind.share, 0);
    const mesh = new InstancedMesh(flagGeometry(), material, chosen.length);
    mesh.name = "CrowdFlags";
    const extra = new Float32Array(chosen.length * 2);
    const light = new Float32Array(chosen.length * 3);
    const matrix = new Matrix4();
    chosen.forEach((seat, k) => {
      const turn = positions[seat * 4 + 3];
      const c = Math.cos(turn);
      const s = Math.sin(turn);
      // held up a little in front of the seat
      matrix.set(c, 0, s, positions[seat * 4], 0, 1, 0, positions[seat * 4 + 1] + 0.6, -s, 0, c, positions[seat * 4 + 2], 0, 0, 0, 1);
      // the cloth runs along the flag's own x: turn it round if that points upwind
      if (c * WIND.x - s * WIND.z < 0) matrix.multiply(new Matrix4().makeScale(-1, 1, 1));
      mesh.setMatrixAt(k, matrix);
      let pick = hash(seat, 23) * shares;
      let kind = 0;
      while (kind < KINDS.length - 1 && pick > KINDS[kind].share) pick -= KINDS[kind++].share;
      extra.set([kind, hash(seat, 24)], k * 2);
      light.set([details[seat * 8 + 2] / 255, details[seat * 8 + 3] / 255, details[seat * 8 + 6] / 255], k * 3);
    });
    mesh.geometry.setAttribute("aFlag", new InstancedBufferAttribute(extra, 2));
    mesh.geometry.setAttribute("aBake", new InstancedBufferAttribute(light, 3));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    return { mesh, material, uniforms };
  }, [data]);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      material.map?.dispose();
      material.dispose();
      mesh.dispose();
    },
    [mesh, material],
  );

  useFrame(() => {
    uniforms.uTime.value = atmo.time;
  });

  // fewer at "low", like the crowd
  useEffect(() => {
    mesh.count = quality === "low" ? Math.floor(mesh.instanceMatrix.count * 0.4) : mesh.instanceMatrix.count;
  }, [mesh, quality]);

  return <primitive object={mesh} />;
}
