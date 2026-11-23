"use client";

import { useFrame } from "@react-three/fiber";
import { use, useEffect, useMemo } from "react";
import { Color, DoubleSide, InstancedBufferAttribute, InstancedMesh, Matrix4, MeshStandardMaterial, NoColorSpace, PlaneGeometry, SRGBColorSpace, TextureLoader, Vector3, type Texture } from "three";
import { useWorld } from "../../../lib/store";
import { stir } from "../activity";
import { atmo } from "../atmosphere/state";
import { withBakedLight } from "./bakedLight";
import { isTaken, seatHash as hash } from "./crowdPlan";
import { loadSeatData } from "./seatData";

// ------------------------------------------------------------------
// The crowd: a fan in most seats.
//
// Each fan is a picture of a real person sitting in a seat and facing
// the pitch: two of Mixamo's stock characters, seated by motion capture
// and rendered in Blender in four poses (blender/build_crowd.py, into
// public/stadium/crowd/). All of them are one instanced mesh, so the
// whole crowd is a single drawing step. A second picture marks where
// each person's shirt, skin, trousers and hair are, so every fan gets
// his own shirt colour, skin tone, trousers and hair; half of them are
// seen as in a mirror, so the two men make many more faces. They take
// the same worked-out light as the seats (bakedLight.ts), so they sit
// in the roof's shade by day and under the floodlights at night.
//
// When a goal goes in (`cheer` in the store) the crowd jumps.
//
// To change how full the ground is, change OCCUPANCY in crowdPlan.ts;
// the shirt colours and how common each is are in SHIRTS.
// ------------------------------------------------------------------

// one fan's picture, in metres: as rendered (blender/build_crowd.py,
// WORLD_W and WORLD_H), his feet on his row's step, in front of the seat back
const WIDTH = 1.097;
const HEIGHT = 1.8;
const LIFT = 0.0; // the bottom of the picture above the seat's step
const FORWARD = 0.3; // in front of the seat back
const CHEER_SECONDS = 4.5;

// [colour, how common]: mostly the home white, then the club's blues
const SHIRTS: [string, number][] = [
  ["#f2f2ee", 0.42],
  ["#17244d", 0.17],
  ["#2f4fb3", 0.13],
  ["#151618", 0.1],
  ["#d6a93f", 0.06],
  ["#8d939e", 0.07],
  ["#6b1e2a", 0.05],
];

// The crowd's two pictures (blender/build_crowd.py, packed by
// scripts/pack-crowd.mjs): eight people side by side, two men in four
// poses each, and the masks of their shirt (red), skin (green),
// trousers (full blue) and hair (half blue)
const SHEET = { colour: "/stadium/crowd/crowd-colour.webp", mask: "/stadium/crowd/crowd-mask.webp", plan: "/stadium/crowd/crowd.json" };
const CELLS = 8;
const POSES_EACH = 4;

// how much of his cell each person fills, [left, right, top] as shares of
// it (written by scripts/pack-crowd.mjs): each fan's card is cut to that,
// because the empty corners cost as much to draw as the person
type Box = [number, number, number];

let sheets: Promise<{ colour: Texture; mask: Texture; boxes: Box[] }> | null = null;
function loadSheets() {
  sheets ??= (async () => {
    const loader = new TextureLoader();
    const [colour, mask, plan] = await Promise.all([
      loader.loadAsync(SHEET.colour),
      loader.loadAsync(SHEET.mask),
      fetch(SHEET.plan).then((r) => r.json() as Promise<{ boxes: Box[] }>),
    ]);
    colour.colorSpace = SRGBColorSpace;
    mask.colorSpace = NoColorSpace;
    for (const texture of [colour, mask]) {
      texture.anisotropy = 4;
      texture.needsUpdate = true;
    }
    return { colour, mask, boxes: plan.boxes };
  })();
  return sheets;
}

export default function Crowd() {
  const data = use(loadSeatData());
  const pictures = use(loadSheets());
  const quality = useWorld((s) => s.quality);

  const { mesh, material, uniforms } = useMemo(() => {
    const { positions, details } = data;
    const total = data.manifest.seats;
    const seated: number[] = [];
    for (let i = 0; i < total; i++) if (isTaken(i)) seated.push(i);

    const shape = new PlaneGeometry(WIDTH, HEIGHT);
    shape.translate(0, LIFT + HEIGHT / 2, FORWARD);

    const material = new MeshStandardMaterial({ map: pictures.colour, roughness: 0.85, side: DoubleSide, alphaTest: 0.4, alphaToCoverage: true });
    material.name = "Crowd";
    const uniforms = { uJump: { value: 0 }, uTime: { value: 0 } };
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uJump = uniforms.uJump;
      shader.uniforms.uTime = uniforms.uTime;
      shader.uniforms.uMask = { value: pictures.mask };
      shader.uniforms.uBox = { value: pictures.boxes.map(([left, right, top]) => new Vector3(left, right, top)) };
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", `#include <common>\nattribute vec3 aShirt;\nattribute vec3 aFan;\nuniform float uJump;\nuniform float uTime;\nuniform vec3 uBox[ ${CELLS} ];\nvarying vec3 vShirt;\nvarying vec3 vSkin;\nvarying vec3 vLegs;\nvarying vec3 vHair;`)
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          // the card cut down to the person on it
          transformed.x = ( fanUv.x - 0.5 ) * ${WIDTH.toFixed(3)};
          transformed.y = ${LIFT.toFixed(3)} + fanUv.y * ${HEIGHT.toFixed(3)};
          // up and down out of the seat, each fan in his own time
          transformed.y += uJump * 0.32 * max( 0.0, sin( uTime * 8.5 + aFan.z * 6.2832 ) );`,
        )
        .replace(
          "#include <uv_vertex>",
          `#include <uv_vertex>
          vec3 box = uBox[ int( aFan.x + 0.5 ) ];
          vec2 fanUv = vec2( mix( box.x, box.y, uv.x ), uv.y * box.z );
          vMapUv = vec2( ( fanUv.x + aFan.x ) / ${CELLS.toFixed(1)}, fanUv.y );
          vShirt = aShirt;
          // the pictured men are fair: this darkens them to each fan's own tone
          vSkin = mix( vec3( 1.0 ), vec3( 0.34, 0.24, 0.19 ), aFan.y );
          // trousers: denim, black, khaki, grey, navy
          float t = fract( aFan.z * 13.7 );
          vLegs = t < 0.34 ? vec3( 0.09, 0.15, 0.32 ) : t < 0.56 ? vec3( 0.035, 0.035, 0.04 ) : t < 0.7 ? vec3( 0.36, 0.3, 0.19 ) : t < 0.85 ? vec3( 0.24, 0.24, 0.25 ) : vec3( 0.03, 0.05, 0.13 );
          // hair: mostly black and browns, darker with darker skin; a few fair, a few grey
          float h = fract( aFan.z * 29.3 ) * ( 1.0 - 0.6 * aFan.y );
          vHair = h < 0.42 ? vec3( 0.022, 0.018, 0.015 ) : h < 0.66 ? vec3( 0.07, 0.042, 0.025 ) : h < 0.8 ? vec3( 0.17, 0.1, 0.05 ) : h < 0.9 ? vec3( 0.42, 0.3, 0.15 ) : vec3( 0.36, 0.35, 0.34 );`,
        );
      shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nuniform sampler2D uMask;\nvarying vec3 vShirt;\nvarying vec3 vSkin;\nvarying vec3 vLegs;\nvarying vec3 vHair;").replace(
        "#include <map_fragment>",
        `vec4 fan = texture2D( map, vMapUv );
        vec3 parts = texture2D( uMask, vMapUv ).rgb;
        // blue: full for the trousers, half for the hair
        float legs = smoothstep( 0.88, 0.97, parts.b );
        float hair = smoothstep( 0.55, 0.68, parts.b ) * ( 1.0 - legs );
        // the shirt and trousers were pictured without colour: give them his
        vec3 tint = mix( vec3( 1.0 ), vShirt * 1.45, parts.r ) * mix( vec3( 1.0 ), vSkin, parts.g ) * mix( vec3( 1.0 ), vLegs * 1.9, legs );
        vec3 body = fan.rgb * tint;
        // his own hair colour, keeping the picture's light and shade
        float shade = dot( fan.rgb, vec3( 0.3, 0.59, 0.11 ) );
        body = mix( body, vHair * ( 0.6 + 2.2 * shade ), hair );
        diffuseColor.rgb *= body;
        diffuseColor.a *= fan.a;`,
      );
    };
    material.customProgramCacheKey = () => "crowd-v5";
    withBakedLight(material, "seat");

    const n = seated.length;
    const mesh = new InstancedMesh(shape, material, n);
    mesh.name = "Crowd";
    const shirts = new Float32Array(n * 3);
    const fans = new Float32Array(n * 3);
    const light = new Float32Array(n * 3);
    const matrix = new Matrix4();
    const colour = new Color();
    const weights = SHIRTS.reduce((sum, [, w]) => sum + w, 0);
    seated.forEach((seat, k) => {
      const x = positions[seat * 4];
      const y = positions[seat * 4 + 1];
      const z = positions[seat * 4 + 2];
      const turn = positions[seat * 4 + 3];
      const c = Math.cos(turn);
      const s = Math.sin(turn);
      // a little smaller or larger, as people are, and half seen as in a mirror
      const size = 0.9 + 0.2 * hash(seat, 2);
      const across = hash(seat, 13) < 0.5 ? -size : size;
      matrix.set(c * across, 0, s * size, x, 0, size, 0, y, -s * across, 0, c * size, z, 0, 0, 0, 1);
      mesh.setMatrixAt(k, matrix);
      let pick = hash(seat, 3) * weights;
      let index = 0;
      while (index < SHIRTS.length - 1 && pick > SHIRTS[index][1]) pick -= SHIRTS[index++][1];
      colour.set(SHIRTS[index][0]).multiplyScalar(0.85 + 0.15 * hash(seat, 4));
      shirts.set([colour.r, colour.g, colour.b], k * 3);
      // which of the two men, and how he sits: most with hands on knees,
      // some with an arm up, a few with both
      const pose = hash(seat, 5);
      const cell = (hash(seat, 12) < 0.5 ? 0 : POSES_EACH) + (pose < 0.7 ? 0 : pose < 0.82 ? 2 : pose < 0.91 ? 1 : 3);
      fans.set([cell, hash(seat, 6), hash(seat, 7)], k * 3);
      light.set([details[seat * 8 + 2] / 255, details[seat * 8 + 3] / 255, details[seat * 8 + 6] / 255], k * 3);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.geometry.setAttribute("aShirt", new InstancedBufferAttribute(shirts, 3));
    mesh.geometry.setAttribute("aFan", new InstancedBufferAttribute(fans, 3));
    mesh.geometry.setAttribute("aBake", new InstancedBufferAttribute(light, 3));
    // the crowd fills the whole bowl, so it is never all out of view
    mesh.frustumCulled = false;
    mesh.matrixAutoUpdate = false;
    return { mesh, material, uniforms };
  }, [data, pictures]);

  useEffect(
    () => () => {
      mesh.geometry.dispose();
      material.dispose();
      mesh.dispose();
    },
    [mesh, material],
  );

  // A goal: everybody up, for a few seconds, then back down
  useFrame(() => {
    const since = (performance.now() - useWorld.getState().cheerAt) / 1000;
    const jump = since >= 0 && since < CHEER_SECONDS ? Math.min(1, since * 4) * Math.min(1, (CHEER_SECONDS - since) * 1.5) : 0;
    uniforms.uJump.value = jump;
    uniforms.uTime.value = atmo.time;
    if (jump > 0) stir();
  });

  // Hidden, not removed, at "low": taking it out of the scene and putting
  // it back left the crowd undrawn
  return <primitive object={mesh} visible={quality !== "low"} />;
}
