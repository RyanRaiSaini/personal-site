"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { Color, DoubleSide, InstancedBufferAttribute, InstancedMesh, MeshBasicMaterial, Object3D, PlaneGeometry } from "three";
import { useWorld } from "../../../lib/store";
import { stir } from "../activity";
import { canvasTexture } from "../textures/canvas";

// ------------------------------------------------------------------
// Smoke in the stands when a goal goes in: blue and white, billowing up
// from a few places in the lower tier and drifting off on the wind, as
// at a big match. Soft puffs that always face the camera, all of them
// one instanced mesh; they rise, spread and fade over LAST seconds.
//
// To move the smoke, change SOURCES (x, y, z in metres, and a colour).
// ------------------------------------------------------------------

const SOURCES: { at: [number, number, number]; colour: string }[] = [
  { at: [-30, 4.5, -48], colour: "#6a8ce6" },
  { at: [30, 4.5, -48], colour: "#e9edf5" },
  { at: [67.5, 4.5, 9], colour: "#e9edf5" },
  { at: [-67.5, 4.5, -7], colour: "#6a8ce6" },
];
const PUFFS = 46; // from each place
const LAST = 13; // seconds from the goal until the last of it has gone
const WIND = [1.1, 0, -0.5]; // metres a second it drifts

// one soft, uneven puff
function puffTexture() {
  return canvasTexture(
    128,
    128,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 14; i++) {
        const x = w / 2 + Math.cos(i * 2.39) * (8 + (i % 5) * 6);
        const y = h / 2 + Math.sin(i * 2.39) * (8 + (i % 4) * 6);
        const r = 26 + (i % 3) * 8;
        const blob = ctx.createRadialGradient(x, y, 0, x, y, r);
        blob.addColorStop(0, "rgba(255,255,255,0.42)");
        blob.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = blob;
        ctx.fillRect(0, 0, w, h);
      }
    },
    { repeat: false },
  );
}

export default function GoalSmoke() {
  const { mesh, material, uniforms } = useMemo(() => {
    const uniforms = { uSince: { value: 100 } };
    const material = new MeshBasicMaterial({ map: puffTexture(), transparent: true, depthWrite: false, side: DoubleSide, forceSinglePass: true });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uSince = uniforms.uSince;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nattribute vec4 aPuff;\nattribute vec3 aSmoke;\nuniform float uSince;\nvarying float vFade;\nvarying vec3 vSmoke;")
        .replace(
          "#include <project_vertex>",
          `// where this puff is now: let go a little after the last, rising,
          // spreading and drifting on the wind
          float age = uSince - aPuff.w * ${(LAST * 0.45).toFixed(2)};
          float life = clamp( age / ${(LAST * 0.55).toFixed(2)}, 0.0, 1.0 );
          vec3 centre = ( instanceMatrix * vec4( 0.0, 0.0, 0.0, 1.0 ) ).xyz;
          centre += vec3( ${WIND[0].toFixed(2)}, 0.0, ${WIND[2].toFixed(2)} ) * max( age, 0.0 );
          centre.y += 11.0 * life + aPuff.y * 3.0 * life;
          centre.xz += aPuff.xz * ( 1.2 + 6.5 * life );
          float size = 2.2 + 9.0 * life;
          vec4 mvPosition = modelViewMatrix * vec4( centre, 1.0 );
          mvPosition.xy += position.xy * size;
          gl_Position = projectionMatrix * mvPosition;
          vFade = age < 0.0 ? 0.0 : smoothstep( 0.0, 0.12, life ) * ( 1.0 - smoothstep( 0.55, 1.0, life ) );
          vSmoke = aSmoke;`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying float vFade;\nvarying vec3 vSmoke;")
        .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb *= vSmoke;\ndiffuseColor.a *= vFade * 0.7;");
    };
    material.customProgramCacheKey = () => "goal-smoke";

    const count = SOURCES.length * PUFFS;
    const mesh = new InstancedMesh(new PlaneGeometry(1, 1), material, count);
    mesh.name = "GoalSmoke";
    mesh.frustumCulled = false;
    mesh.renderOrder = 7;
    const puff = new Float32Array(count * 4);
    const colours = new Float32Array(count * 3);
    const place = new Object3D();
    const colour = new Color();
    let k = 0;
    for (const source of SOURCES) {
      colour.set(source.colour);
      for (let i = 0; i < PUFFS; i++, k++) {
        place.position.set(...source.at);
        place.updateMatrix();
        mesh.setMatrixAt(k, place.matrix);
        const a = i * 2.399;
        const spread = 0.3 + ((i * 7) % 10) / 10;
        // [sideways, extra rise, along, when it is let go (0 to 1)]
        puff.set([Math.cos(a) * spread, ((i * 13) % 10) / 10, Math.sin(a) * spread, i / PUFFS], k * 4);
        const shade = 0.85 + 0.15 * (((i * 5) % 7) / 7);
        colours.set([colour.r * shade, colour.g * shade, colour.b * shade], k * 3);
      }
    }
    mesh.geometry.setAttribute("aPuff", new InstancedBufferAttribute(puff, 4));
    mesh.geometry.setAttribute("aSmoke", new InstancedBufferAttribute(colours, 3));
    mesh.instanceMatrix.needsUpdate = true;
    return { mesh, material, uniforms };
  }, []);

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
    const since = (performance.now() - useWorld.getState().cheerAt) / 1000;
    const on = since >= 0 && since < LAST;
    mesh.visible = on;
    uniforms.uSince.value = since;
    // keep drawing while it is in the air
    if (on) stir();
  });

  return <primitive object={mesh} />;
}
