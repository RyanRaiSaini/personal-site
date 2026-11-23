"use client";

import { useFrame } from "@react-three/fiber";
import { use, useEffect, useMemo } from "react";
import { Color, DoubleSide, InstancedBufferAttribute, InstancedMesh, Matrix4, MeshStandardMaterial, NoColorSpace, PlaneGeometry, SRGBColorSpace, TextureLoader, Vector4, type Texture } from "three";
import { useWorld } from "../../../lib/store";
import { stir } from "../activity";
import { atmo } from "../atmosphere/state";
import { rig } from "../camera/CameraRig";
import { withBakedLight } from "./bakedLight";
import { isTaken, seatHash as hash } from "./crowdPlan";
import { loadSeatData } from "./seatData";

// ------------------------------------------------------------------
// The crowd: a fan in most seats.
//
// Each fan is a picture of a real person sitting in a seat and facing
// the pitch: seven of Mixamo's stock characters, three men and four
// women, seated by motion capture
// and rendered in Blender in four poses (blender/build_crowd.py, into
// public/stadium/crowd/). All of them are one instanced mesh, so the
// whole crowd is a single drawing step. A second picture marks where
// each person's shirt, skin, trousers and hair are, so every fan gets
// their own shirt colour, skin tone, trousers and hair; half of them
// are seen as in a mirror, so the seven make many more faces. They take
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
export const WIDTH = 1.097;
export const HEIGHT = 1.8;
const LIFT = 0.0; // the bottom of the picture above the seat's step
const FORWARD = 0.3; // in front of the seat back
const CHEER_SECONDS = 4.5;
// the share of the fans drawn at the "low" quality level, spread evenly
// round the ground (the picture drops to "low" by itself when it runs
// slow, so the crowd must never vanish there)
const LOW_SHARE = 0.4;

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
// Behind the goals, where the most devoted fans stand, nearly everyone
// is in the club's white or royal blue: blocks of colour, as at a real
// home end
const END_SHIRTS: [string, number][] = [
  ["#f2f2ee", 0.58],
  ["#2f4fb3", 0.26],
  ["#17244d", 0.12],
  ["#d6a93f", 0.04],
];
// how far along the pitch (metres from the halfway line) the ends begin
const END_FROM = 56;

// The crowd's two pictures (blender/build_crowd.py, packed by
// scripts/pack-crowd.mjs): seven people, three men and four women, in
// four poses each, in rows of COLUMNS cells; and the masks of their shirt
// (red), skin (green), trousers (full blue) and hair (half blue)
const SHEET = { colour: "/stadium/crowd/crowd-colour.webp", mask: "/stadium/crowd/crowd-mask.webp", plan: "/stadium/crowd/crowd.json" };
export const CELLS = 28;
const COLUMNS = 16;
const ROWS = Math.ceil(CELLS / COLUMNS);
const POSES_EACH = 4;
// who is who, in the sheet's order (build_crowd.py's ALL); WOMEN is the
// share of fans who are women
const MEN = [0, 1, 6];
const WOMEN_PEOPLE = [2, 3, 4, 5];
const WOMEN = 0.4;

// how much of his cell each person fills, [left, right, top] as shares of
// it (written by scripts/pack-crowd.mjs): each fan's card is cut to that,
// because the empty corners cost as much to draw as the person
type Box = [number, number, number];

let sheets: Promise<{ colour: Texture; mask: Texture; boxes: Box[]; tones: number[] }> | null = null;
export function loadSheets() {
  sheets ??= (async () => {
    const loader = new TextureLoader();
    const [colour, mask, plan] = await Promise.all([
      loader.loadAsync(SHEET.colour),
      loader.loadAsync(SHEET.mask),
      fetch(SHEET.plan).then((r) => r.json() as Promise<{ boxes: Box[]; tones: number[] }>),
    ]);
    colour.colorSpace = SRGBColorSpace;
    mask.colorSpace = NoColorSpace;
    for (const texture of [colour, mask]) {
      texture.anisotropy = 4;
      texture.needsUpdate = true;
    }
    return { colour, mask, boxes: plan.boxes, tones: plan.tones };
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
    // in a shuffled order, so drawing only the first part of the list
    // thins the whole crowd evenly instead of emptying one end
    seated.sort((a, b) => hash(a, 14) - hash(b, 14));

    const shape = new PlaneGeometry(WIDTH, HEIGHT);
    shape.translate(0, LIFT + HEIGHT / 2, FORWARD);

    const material = new MeshStandardMaterial({ map: pictures.colour, roughness: 0.85, side: DoubleSide, alphaTest: 0.4, alphaToCoverage: true });
    material.name = "Crowd";
    const uniforms = { uJump: { value: 0 }, uTime: { value: 0 }, uFocus: { value: 60 }, uSoft: { value: 0 } };
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uJump = uniforms.uJump;
      shader.uniforms.uTime = uniforms.uTime;
      shader.uniforms.uFocus = uniforms.uFocus;
      shader.uniforms.uSoft = uniforms.uSoft;
      shader.uniforms.uMask = { value: pictures.mask };
      // each cell's outline, and how dark the pictured person's own skin is
      shader.uniforms.uBox = { value: pictures.boxes.map(([left, right, top], c) => new Vector4(left, right, top, pictures.tones[c] ?? 0)) };
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", `#include <common>\nattribute vec3 aShirt;\nattribute vec3 aFan;\nuniform float uJump;\nuniform float uTime;\nuniform float uFocus;\nuniform float uSoft;\nvarying float vBlur;
varying float vFar;\nuniform vec4 uBox[ ${CELLS} ];\nvarying vec3 vShirt;\nvarying vec3 vSkin;\nvarying vec3 vLegs;\nvarying vec3 vHair;`)
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          // the card cut down to the person on it
          transformed.x = ( fanUv.x - 0.5 ) * ${WIDTH.toFixed(3)};
          transformed.y = ${LIFT.toFixed(3)} + fanUv.y * ${HEIGHT.toFixed(3)};
          // up and down out of the seat, each fan in his own time
          transformed.y += uJump * 0.32 * max( 0.0, sin( uTime * 8.5 + aFan.z * 6.2832 ) );
          // nobody sits quite still: a slow shift from side to side and a
          // small settle, each fan at his own pace (only while the picture
          // is being drawn; it rests like everything else)
          // Only near the camera: a fan far off is a few pixels wide, and
          // moving him by part of a pixel flips those pixels between him
          // and the blue seat behind, which flickers (it did, 2026-11-24)
          vec3 seatAt = ( modelMatrix * instanceMatrix * vec4( 0.0, 0.0, 0.0, 1.0 ) ).xyz;
          float near = 1.0 - smoothstep( 12.0, 30.0, distance( seatAt, cameraPosition ) );
          // far off, each fan a little wider, so neighbours touch: the dark
          // gaps between distant fans flashed as the camera moved
          float wide = smoothstep( 30.0, 90.0, distance( seatAt, cameraPosition ) );
          transformed.x *= 1.0 + 0.6 * wide;
          float own = aFan.z * 6.2832;
          float pace = 0.35 + fract( aFan.z * 7.3 ) * 0.5;
          float height = transformed.y / ${HEIGHT.toFixed(2)};
          transformed.x += near * height * ( 0.045 * sin( uTime * pace + own ) + 0.012 * sin( uTime * 2.3 * pace + own * 3.0 ) );
          transformed.y += near * 0.012 * sin( uTime * 0.8 * pace + own * 1.7 );`,
        )
        .replace(
          "#include <project_vertex>",
          `#include <project_vertex>
          // out of focus: the further from what the camera is looking at,
          // the softer (a long lens on a close subject blurs the stands)
          // far off, the crowd evens out, as a lens and the haze soften a
          // distant crowd: fans a pixel or two wide flashing between white
          // shirts and blue seats as the camera moves is what it prevents
          vFar = smoothstep( 28.0, 95.0, -mvPosition.z );
          vBlur = uSoft * clamp( abs( -mvPosition.z - uFocus ) / max( uFocus, 1.0 ) * 0.9, 0.0, 1.5 );`,
        )
        .replace(
          "#include <uv_vertex>",
          `#include <uv_vertex>
          vec4 box = uBox[ int( aFan.x + 0.5 ) ];
          vec2 fanUv = vec2( mix( box.x, box.y, uv.x ), uv.y * box.z );
          // the cell's place in the sheet: rows of ${COLUMNS}, the first at the top
          float column = mod( aFan.x + 0.5, ${COLUMNS.toFixed(1)} ) - 0.5;
          float row = floor( ( aFan.x + 0.5 ) / ${COLUMNS.toFixed(1)} );
          vMapUv = vec2( ( fanUv.x + column ) / ${COLUMNS.toFixed(1)}, ( fanUv.y + ${(ROWS - 1).toFixed(1)} - row ) / ${ROWS.toFixed(1)} );
          vShirt = aShirt;
          // darkens the pictured person to each fan's own tone, from the
          // tone they already have (box.w): a picture can only be darkened
          float toward = clamp( ( aFan.y - box.w ) / max( 1.0 - box.w, 0.01 ), 0.0, 1.0 );
          vSkin = mix( vec3( 1.0 ), vec3( 0.34, 0.24, 0.19 ), toward );
          // trousers: denim, black, khaki, grey, navy
          float t = fract( aFan.z * 13.7 );
          vLegs = t < 0.34 ? vec3( 0.09, 0.15, 0.32 ) : t < 0.56 ? vec3( 0.035, 0.035, 0.04 ) : t < 0.7 ? vec3( 0.36, 0.3, 0.19 ) : t < 0.85 ? vec3( 0.24, 0.24, 0.25 ) : vec3( 0.03, 0.05, 0.13 );
          // hair: mostly black and browns, darker with darker skin; a few fair, a few grey
          float h = fract( aFan.z * 29.3 ) * ( 1.0 - 0.6 * aFan.y );
          vHair = h < 0.42 ? vec3( 0.022, 0.018, 0.015 ) : h < 0.66 ? vec3( 0.07, 0.042, 0.025 ) : h < 0.8 ? vec3( 0.17, 0.1, 0.05 ) : h < 0.9 ? vec3( 0.42, 0.3, 0.15 ) : vec3( 0.36, 0.35, 0.34 );`,
        );
      shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying float vBlur;\nvarying float vFar;\nuniform sampler2D uMask;\nvarying vec3 vShirt;\nvarying vec3 vSkin;\nvarying vec3 vLegs;\nvarying vec3 vHair;").replace(
        "#include <map_fragment>",
        `vec4 fan = texture2D( map, vMapUv, vBlur + 2.0 * vFar );
        // far off, a fan is drawn as a solid patch of his own averaged
        // colours rather than a cut-out figure: a cut-out a pixel or two
        // wide covers one pixel or two as the camera moves, and flickers.
        // (Transparent parts of the picture are black, so the average is
        // divided by how much of the patch he covers.)
        float solid = smoothstep( 0.35, 0.75, vFar );
        fan.rgb = mix( fan.rgb, fan.rgb / max( fan.a, 0.55 ), solid );
        vec3 parts = texture2D( uMask, vMapUv, vBlur ).rgb;
        // blue: full for the trousers, half for the hair
        float legs = smoothstep( 0.88, 0.97, parts.b );
        float hair = smoothstep( 0.55, 0.68, parts.b ) * ( 1.0 - legs );
        // the shirt and trousers were pictured without colour: give them his
        vec3 tint = mix( vec3( 1.0 ), vShirt * 1.45, parts.r ) * mix( vec3( 1.0 ), vSkin, parts.g ) * mix( vec3( 1.0 ), vLegs * 1.9, legs );
        vec3 body = fan.rgb * tint;
        // his own hair colour, keeping the picture's light and shade
        float shade = dot( fan.rgb, vec3( 0.3, 0.59, 0.11 ) );
        body = mix( body, vHair * ( 0.6 + 2.2 * shade ), hair );
        body = mix( body, vec3( 0.2, 0.22, 0.3 ), 0.18 * vFar );
        // and each distant fan a little lighter or darker than the next, so
        // the solid patches still read as people
        body *= 1.0 - 0.25 * solid * fract( vSkin.r * 91.7 + vShirt.g * 53.3 + vLegs.b * 17.1 );
        diffuseColor.rgb *= body;
        // the outline from the sharp picture: a softened outline cut off at
        // the alpha test would make fans vanish and reappear over their seats
        diffuseColor.a *= mix( texture2D( map, vMapUv ).a, 1.0, solid );`,
      ).replace(
        "#include <aomap_fragment>",
        // no sheen of reflected sky on the hair: on a flat picture it is a
        // grey haze, brighter than dark hair, and turned every dark head of
        // hair into a grey cap
        `#include <aomap_fragment>
        reflectedLight.indirectSpecular *= 1.0 - hair;
        reflectedLight.directSpecular *= 1.0 - hair;`,
      );
    };
    material.customProgramCacheKey = () => "crowd-v13";
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
    const endWeights = END_SHIRTS.reduce((sum, [, w]) => sum + w, 0);
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
      const palette = Math.abs(x) > END_FROM ? END_SHIRTS : SHIRTS;
      let pick = hash(seat, 3) * (palette === SHIRTS ? weights : endWeights);
      let index = 0;
      while (index < palette.length - 1 && pick > palette[index][1]) pick -= palette[index++][1];
      colour.set(palette[index][0]).multiplyScalar(0.85 + 0.15 * hash(seat, 4));
      shirts.set([colour.r, colour.g, colour.b], k * 3);
      // which of the four people (a man or, for WOMEN of the fans, a
      // woman), and how they sit: most with hands on knees, some with an
      // arm up, a few with both
      const pose = hash(seat, 5);
      const who = hash(seat, 12);
      const among = who < WOMEN ? WOMEN_PEOPLE : MEN;
      const within = who < WOMEN ? who / WOMEN : (who - WOMEN) / (1 - WOMEN);
      const person = among[Math.min(among.length - 1, Math.floor(within * among.length))] * POSES_EACH;
      const cell = person + (pose < 0.7 ? 0 : pose < 0.82 ? 2 : pose < 0.91 ? 1 : 3);
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
    // the camera's subject: how far it is, and how strongly the rest blurs
    // (not at all in wide shots, fully in a close-up)
    const focus = rig.position.distanceTo(rig.target);
    uniforms.uFocus.value = focus;
    uniforms.uSoft.value = Math.min(1, Math.max(0, (28 - focus) / 18));
    if (jump > 0) stir();
  });

  // Thinner, not hidden, at "low"
  useEffect(() => {
    mesh.count = quality === "low" ? Math.floor(mesh.instanceMatrix.count * LOW_SHARE) : mesh.instanceMatrix.count;
  }, [mesh, quality]);

  return <primitive object={mesh} />;
}
