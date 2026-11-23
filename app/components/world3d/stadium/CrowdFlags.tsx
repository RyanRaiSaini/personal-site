"use client";

import { useFrame } from "@react-three/fiber";
import { use, useEffect, useMemo } from "react";
import { BufferGeometry, Color, CylinderGeometry, DoubleSide, Float32BufferAttribute, InstancedBufferAttribute, InstancedMesh, Matrix4, MeshStandardMaterial, PlaneGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { useWorld } from "../../../lib/store";
import { atmo } from "../atmosphere/state";
import { isTaken, seatHash as hash } from "./crowdPlan";
import { loadSeatData } from "./seatData";

// ------------------------------------------------------------------
// Flags in the crowd: here and there a fan holds one up on a pole, and
// it waves. Plain club colours with a stripe across, no crests and no
// words (the site's rule). All of them are one instanced mesh; the
// waving is worked out on the graphics card, and like the crowd it
// moves only while the picture is drawn.
//
// To have more or fewer, change SHARE; the colours are in COLOURS.
// ------------------------------------------------------------------

const SHARE = 0.0045; // of the taken seats
const FLAG = { width: 1.5, height: 0.95, pole: 2.6 };
// [cloth, stripe]
const COLOURS: [string, string][] = [
  ["#f4f4f0", "#17244d"],
  ["#17244d", "#d6a93f"],
  ["#2f4fb3", "#f4f4f0"],
  ["#f4f4f0", "#d6a93f"],
  ["#d6a93f", "#17244d"],
  ["#f4f4f0", "#2f4fb3"],
];

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
    const { positions } = data;
    const chosen: number[] = [];
    for (let i = 0; i < data.manifest.seats; i++) if (isTaken(i) && hash(i, 21) < SHARE) chosen.push(i);

    const uniforms = { uTime: { value: 0 } };
    const material = new MeshStandardMaterial({ roughness: 0.85, side: DoubleSide, forceSinglePass: true });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nattribute vec4 aFlag;\nuniform float uTime;\nvarying vec2 vCloth;\nvarying vec3 vStripe;\nvarying float vMain;")
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          vCloth = uv;
          vStripe = aFlag.rgb;
          vMain = 1.0;
          if ( uv.x >= 0.0 ) {
            // a wave running out from the pole, growing toward the free edge,
            // and the whole flag swung slowly from side to side
            float along = uv.x;
            float t = uTime * ( 2.4 + aFlag.a * 1.2 ) + aFlag.a * 40.0;
            transformed.z += along * ( 0.22 * sin( along * 5.5 - t ) + 0.08 * sin( along * 11.0 - t * 1.7 ) );
            transformed.y -= along * along * 0.12 * ( 0.6 + 0.4 * sin( t * 0.5 ) );
            float swing = 0.35 * sin( uTime * 0.7 + aFlag.a * 20.0 );
            float lean = transformed.y / ${FLAG.pole.toFixed(2)};
            transformed.z += swing * transformed.x * 0.4 + swing * lean * 0.3;
          } else {
            vMain = 0.0;
            transformed.z += 0.35 * sin( uTime * 0.7 + aFlag.a * 20.0 ) * ( transformed.y / ${FLAG.pole.toFixed(2)} ) * 0.3;
          }`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec2 vCloth;\nvarying vec3 vStripe;\nvarying float vMain;")
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
          // a band across the middle in the second colour; the pole dark
          float band = step( 0.36, vCloth.y ) * step( vCloth.y, 0.64 );
          diffuseColor.rgb = vMain < 0.5 ? vec3( 0.06 ) : mix( diffuseColor.rgb, vStripe, band );`,
        );
    };
    material.customProgramCacheKey = () => "crowd-flags";

    const mesh = new InstancedMesh(flagGeometry(), material, chosen.length);
    mesh.name = "CrowdFlags";
    const extra = new Float32Array(chosen.length * 4);
    const matrix = new Matrix4();
    const colour = new Color();
    chosen.forEach((seat, k) => {
      const turn = positions[seat * 4 + 3];
      const c = Math.cos(turn);
      const s = Math.sin(turn);
      // held up a little in front of the seat, leaning slightly
      matrix.set(c, 0, s, positions[seat * 4], 0, 1, 0, positions[seat * 4 + 1] + 0.6, -s, 0, c, positions[seat * 4 + 2], 0, 0, 0, 1);
      if (hash(seat, 22) < 0.5) matrix.multiply(new Matrix4().makeScale(-1, 1, 1));
      mesh.setMatrixAt(k, matrix);
      const [cloth, stripe] = COLOURS[Math.floor(hash(seat, 23) * COLOURS.length)];
      mesh.setColorAt(k, colour.set(cloth));
      colour.set(stripe);
      extra.set([colour.r, colour.g, colour.b, hash(seat, 24)], k * 4);
    });
    mesh.geometry.setAttribute("aFlag", new InstancedBufferAttribute(extra, 4));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.frustumCulled = false;
    return { mesh, material, uniforms };
  }, [data]);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
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
