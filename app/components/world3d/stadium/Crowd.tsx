"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { use, useEffect, useMemo, useRef } from "react";
import { Color, DoubleSide, Frustum, Group, InstancedBufferAttribute, InstancedMesh, Matrix4, MeshStandardMaterial, PlaneGeometry, Sphere, Vector3 } from "three";
import { useWorld } from "../../../lib/store";
import { stir } from "../activity";
import { atmo } from "../atmosphere/state";
import { canvasTexture } from "../textures/canvas";
import { withBakedLight } from "./bakedLight";
import { isTaken, seatHash as hash } from "./crowdPlan";
import { fanGeometry, fanMaterial, type CrowdUniforms } from "./fanFigure";
import { loadSeatData } from "./seatData";

// ------------------------------------------------------------------
// The crowd: a fan in most seats.
//
// Each fan is a flat cut-out sitting in a seat and facing the pitch,
// like the cardboard crowds of a television set. All of them are one
// instanced mesh, so the whole crowd is a single drawing step. Their
// shapes come from one small painted picture with four poses (arms
// down, an arm up, arms folded, clapping), and each fan gets his
// own pose, shirt colour and skin tone. They take the same worked-out
// light as the seats (bakedLight.ts), so they sit in the roof's shade
// by day and under the floodlights at night.
//
// Wherever the camera comes within NEAR metres of a block of seats that
// is in view and faces it (the camera is on the pitch side, where the
// fans' faces are), the cut-outs there are swapped for fans in the round
// (fanFigure.ts), so close views of the stands show people, not cards. Each block's figures
// are made the first time it is needed, and drawn only while it is near.
//
// When a goal goes in (`cheer` in the store) the crowd jumps.
//
// To change how full the ground is, change OCCUPANCY in crowdPlan.ts;
// the shirt colours and how common each is are in SHIRTS.
// ------------------------------------------------------------------

const POSES = 4;
// one fan's size, sitting: a little wider than a seat, head clear of its back
const WIDTH = 0.66;
const HEIGHT = 1.08;
const LIFT = 0.34; // the bottom of the cut-out above the seat's step
const FORWARD = 0.14; // in front of the seat back
const CHEER_SECONDS = 4.5;
// closer than this (metres from the edge of a block of seats), use the figures
const NEAR = 30;
// how often (in frames) to look again at which blocks are near and in view
const CHECK_EVERY = 8;

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

// The four poses, side by side. Not colours: red is the shade, green
// marks the shirt, blue the hair; what is left is skin.
function posesTexture() {
  const cell = 128;
  const tall = 208;
  return canvasTexture(
    cell * POSES,
    tall,
    (ctx) => {
      ctx.clearRect(0, 0, cell * POSES, tall);
      const shirt = (shade: number) => `rgb(${shade},255,0)`;
      const skin = (shade: number) => `rgb(${shade},0,0)`;
      const hair = "rgb(200,0,255)";
      for (let p = 0; p < POSES; p++) {
        const x = p * cell + cell / 2;
        ctx.save();
        // body: shoulders and a seated torso, a little lighter in the middle
        const body = ctx.createLinearGradient(x - 36, 0, x + 36, 0);
        body.addColorStop(0, shirt(170));
        body.addColorStop(0.5, shirt(240));
        body.addColorStop(1, shirt(170));
        ctx.fillStyle = body;
        ctx.beginPath();
        ctx.moveTo(x - 34, tall);
        ctx.lineTo(x - 36, 98);
        ctx.quadraticCurveTo(x - 34, 80, x - 16, 76);
        ctx.lineTo(x + 16, 76);
        ctx.quadraticCurveTo(x + 34, 80, x + 36, 98);
        ctx.lineTo(x + 34, tall);
        ctx.closePath();
        ctx.fill();
        // neck and head
        ctx.fillStyle = skin(205);
        ctx.fillRect(x - 7, 62, 14, 16);
        ctx.beginPath();
        ctx.ellipse(x, 50, 15, 18, 0, 0, Math.PI * 2);
        ctx.fillStyle = skin(225);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x, 42, 16, 12, 0, Math.PI, Math.PI * 2);
        ctx.fillStyle = hair;
        ctx.fill();

        const arm = (fromX: number, fromY: number, toX: number, toY: number) => {
          ctx.strokeStyle = shirt(200);
          ctx.lineCap = "round";
          ctx.lineWidth = 13;
          const midX = (fromX + toX) / 2;
          const midY = (fromY + toY) / 2;
          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          ctx.lineTo(midX, midY);
          ctx.stroke();
          ctx.strokeStyle = skin(215);
          ctx.lineWidth = 10;
          ctx.beginPath();
          ctx.moveTo(midX, midY);
          ctx.lineTo(toX, toY);
          ctx.stroke();
          ctx.fillStyle = skin(225);
          ctx.beginPath();
          ctx.arc(toX, toY, 7, 0, Math.PI * 2);
          ctx.fill();
        };
        if (p === 1) {
          // one arm punched up
          arm(x + 30, 88, x + 40, 8);
        } else if (p === 2) {
          // arms folded across the chest
          ctx.fillStyle = shirt(150);
          ctx.fillRect(x - 33, 112, 66, 22);
          ctx.fillStyle = skin(210);
          ctx.beginPath();
          ctx.arc(x - 24, 123, 7, 0, Math.PI * 2);
          ctx.arc(x + 24, 123, 7, 0, Math.PI * 2);
          ctx.fill();
        } else if (p === 3) {
          // clapping: both hands together in front of the chest
          arm(x - 30, 92, x - 4, 112);
          arm(x + 30, 92, x + 4, 112);
        }
        ctx.restore();
      }
    },
    { repeat: false, data: true, anisotropy: 4 },
  );
}

export default function Crowd() {
  const data = use(loadSeatData());
  const quality = useWorld((s) => s.quality);
  const camera = useThree((s) => s.camera);
  const frame = useRef(0);
  const view = useMemo(() => ({ frustum: new Frustum(), matrix: new Matrix4() }), []);

  const { mesh, material, geometry, texture, blocks, near, uniforms } = useMemo(() => {
    const { positions, details } = data;
    const total = data.manifest.seats;
    const seated: number[] = [];
    for (let i = 0; i < total; i++) if (isTaken(i)) seated.push(i);

    const shape = new PlaneGeometry(WIDTH, HEIGHT);
    shape.translate(0, LIFT + HEIGHT / 2, FORWARD);

    const texture = posesTexture();
    const material = new MeshStandardMaterial({ map: texture, roughness: 0.85, side: DoubleSide, alphaTest: 0.4, alphaToCoverage: true });
    material.name = "Crowd";
    const uniforms: CrowdUniforms = { uJump: { value: 0 }, uTime: { value: 0 } };
    material.userData.uniforms = uniforms;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uJump = uniforms.uJump;
      shader.uniforms.uTime = uniforms.uTime;
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nattribute vec3 aShirt;\nattribute vec3 aFan;\nattribute float aHide;\nuniform float uJump;\nuniform float uTime;\nvarying vec3 vShirt;\nvarying vec3 vSkin;")
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          // a fan drawn in the round instead (near the camera) folds away to nothing
          transformed *= 1.0 - aHide;
          // up and down out of the seat, each fan in his own time
          transformed.y += uJump * 0.32 * max( 0.0, sin( uTime * 8.5 + aFan.z * 6.2832 ) );`,
        )
        .replace(
          "#include <uv_vertex>",
          `#include <uv_vertex>
          vMapUv.x = ( vMapUv.x + aFan.x ) / ${POSES.toFixed(1)};
          vShirt = aShirt;
          // from fair to dark, in light's own terms
          vSkin = mix( vec3( 0.80, 0.55, 0.42 ), vec3( 0.10, 0.05, 0.03 ), aFan.y );`,
        );
      shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vShirt;\nvarying vec3 vSkin;").replace(
        "#include <map_fragment>",
        `vec4 fan = texture2D( map, vMapUv );
        vec3 body = mix( mix( vSkin, vec3( 0.03, 0.025, 0.02 ), fan.b ), vShirt, fan.g );
        diffuseColor.rgb *= body * fan.r;
        diffuseColor.a *= fan.a;`,
      );
    };
    material.customProgramCacheKey = () => "crowd-v2";
    withBakedLight(material, "seat");

    const n = seated.length;
    const mesh = new InstancedMesh(shape, material, n);
    mesh.name = "Crowd";
    const shirts = new Float32Array(n * 3);
    const fans = new Float32Array(n * 3);
    const light = new Float32Array(n * 3);
    // for the figures in the round: hair colour, beanie, scarf, how far he sits turned
    const looks = new Float32Array(n * 4);
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
      // a little smaller or larger, as people are
      const size = 0.9 + 0.2 * hash(seat, 2);
      matrix.set(c * size, 0, s * size, x, 0, size, 0, y, -s * size, 0, c * size, z, 0, 0, 0, 1);
      mesh.setMatrixAt(k, matrix);
      let pick = hash(seat, 3) * weights;
      let index = 0;
      while (index < SHIRTS.length - 1 && pick > SHIRTS[index][1]) pick -= SHIRTS[index++][1];
      colour.set(SHIRTS[index][0]).multiplyScalar(0.85 + 0.15 * hash(seat, 4));
      shirts.set([colour.r, colour.g, colour.b], k * 3);
      // most sit with arms down or clapping; a few are on their feet
      const pose = hash(seat, 5);
      fans.set([pose < 0.5 ? 0 : pose < 0.72 ? 3 : pose < 0.88 ? 2 : 1, hash(seat, 6), hash(seat, 7)], k * 3);
      light.set([details[seat * 8 + 2] / 255, details[seat * 8 + 3] / 255, details[seat * 8 + 6] / 255], k * 3);
      looks.set([hash(seat, 8), hash(seat, 9) < 0.2 ? 1 : 0, hash(seat, 10) < 0.32 ? 1 : 0, (hash(seat, 11) - 0.5) * 0.5], k * 4);
    });
    mesh.instanceMatrix.needsUpdate = true;
    const geometry = mesh.geometry;
    geometry.setAttribute("aShirt", new InstancedBufferAttribute(shirts, 3));
    geometry.setAttribute("aFan", new InstancedBufferAttribute(fans, 3));
    geometry.setAttribute("aBake", new InstancedBufferAttribute(light, 3));
    const hide = new InstancedBufferAttribute(new Float32Array(n), 1);
    geometry.setAttribute("aHide", hide);

    // Each block of seats, with the run of fans sitting in it (fans are
    // in seat order, so each block's fans are side by side)
    const firstFan = new Int32Array(total + 1);
    for (let i = 0, k = 0; i <= total; i++) {
      firstFan[i] = k;
      if (i < total && isTaken(i)) k++;
    }
    const blocks = data.manifest.chunks.map((chunk) => ({
      sphere: new Sphere(new Vector3(...chunk.centre), chunk.radius),
      from: firstFan[chunk.start],
      to: firstFan[chunk.start + chunk.count],
      figures: null as InstancedMesh | null,
      isNear: false,
    }));
    const near = { group: new Group(), geometry: fanGeometry(), material: fanMaterial(uniforms), matrices: mesh.instanceMatrix.array as Float32Array, shirts, fans, light, looks, hide };
    near.group.name = "CrowdNear";
    // the crowd fills the whole bowl, so it is never all out of view
    mesh.frustumCulled = false;
    mesh.matrixAutoUpdate = false;
    return { mesh, material, geometry, texture, blocks, near, uniforms };
  }, [data]);

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
      texture.dispose();
      mesh.dispose();
      for (const block of blocks) block.figures?.geometry.dispose();
      near.geometry.dispose();
      near.material.dispose();
    },
    [mesh, material, geometry, texture, blocks, near],
  );

  // The figures for one block of seats, made the first time it is near
  function figuresFor(block: (typeof blocks)[number]): InstancedMesh {
    if (block.figures) return block.figures;
    const count = block.to - block.from;
    // the shape is shared; who sits where belongs to this block alone
    const own = near.geometry.clone();
    own.setAttribute("aShirt", new InstancedBufferAttribute(near.shirts.slice(block.from * 3, block.to * 3), 3));
    own.setAttribute("aFan", new InstancedBufferAttribute(near.fans.slice(block.from * 3, block.to * 3), 3));
    own.setAttribute("aBake", new InstancedBufferAttribute(near.light.slice(block.from * 3, block.to * 3), 3));
    own.setAttribute("aLook", new InstancedBufferAttribute(near.looks.slice(block.from * 4, block.to * 4), 4));
    const figures = new InstancedMesh(own, near.material, count);
    figures.instanceMatrix.array.set(near.matrices.subarray(block.from * 16, block.to * 16));
    figures.instanceMatrix.needsUpdate = true;
    figures.boundingSphere = block.sphere;
    figures.matrixAutoUpdate = false;
    near.group.add(figures);
    block.figures = figures;
    return figures;
  }

  // A goal: everybody up, for a few seconds, then back down
  useFrame(() => {
    const since = (performance.now() - useWorld.getState().cheerAt) / 1000;
    const jump = since >= 0 && since < CHEER_SECONDS ? Math.min(1, since * 4) * Math.min(1, (CHEER_SECONDS - since) * 1.5) : 0;
    uniforms.uJump.value = jump;
    uniforms.uTime.value = atmo.time;
    if (jump > 0) stir();

    // Swap figures in and cut-outs out where the stands are near and in
    // view. Blocks behind or beside the camera keep their cut-outs.
    frame.current = (frame.current + 1) % CHECK_EVERY;
    if (frame.current !== 0) return;
    view.matrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    view.frustum.setFromProjectionMatrix(view.matrix);
    let changed = false;
    for (const block of blocks) {
      const centre = block.sphere.center;
      // the fans face the middle of the pitch: is the camera in front of them?
      const facing = (camera.position.x - centre.x) * -centre.x + (camera.position.z - centre.z) * -centre.z > 0;
      const isNear = facing && camera.position.distanceTo(centre) - block.sphere.radius < NEAR && view.frustum.intersectsSphere(block.sphere);
      if (isNear === block.isNear) continue;
      block.isNear = isNear;
      changed = true;
      near.hide.array.fill(isNear ? 1 : 0, block.from, block.to);
      if (isNear) figuresFor(block).visible = true;
      else if (block.figures) block.figures.visible = false;
    }
    if (changed) near.hide.needsUpdate = true;
  });

  // Hidden, not removed, at "low": taking it out of the scene and putting
  // it back left the crowd undrawn
  return (
    <>
      <primitive object={mesh} visible={quality !== "low"} />
      <primitive object={near.group} visible={quality !== "low"} />
    </>
  );
}
