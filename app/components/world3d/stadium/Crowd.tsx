"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BoxGeometry, BufferAttribute, Color, DoubleSide, DynamicDrawUsage, IcosahedronGeometry, InstancedBufferAttribute, InstancedMesh, Matrix4, MeshBasicMaterial, MeshLambertMaterial, Object3D, PlaneGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { LEVEL_HEX } from "../../../lib/github";
import { useWorld } from "../../../lib/store";
import { atmo } from "../atmosphere/state";
import { MOSAIC } from "./dims";
import { layoutCrowd } from "./crowdLayout";

// The crowd: tens of thousands of fans drawn in a single call. Each
// fan is a simple seated figure; the graphics card places and colours
// every copy. A small shader makes them sway, and jump when the crowd
// roars. The fans in the main stand's second tier hold up cards that
// spell out my GitHub contribution graph.

// One seated fan: a body and a head
function fanGeometry() {
  const body = new BoxGeometry(0.5, 0.58, 0.28).toNonIndexed();
  body.translate(0, 0.55, 0);
  const head = new IcosahedronGeometry(0.13, 1);
  head.translate(0, 0.99, 0.01);
  const merged = mergeGeometries([body, head], false);
  // Marks which vertices are the head, so it can take a skin colour
  const part = new Float32Array(merged.getAttribute("position").count);
  part.fill(1, body.getAttribute("position").count);
  merged.setAttribute("aPart", new BufferAttribute(part, 1));
  body.dispose();
  head.dispose();
  return merged;
}

type Uniforms = { uTime: { value: number }; uCheer: { value: number } };

function fanMaterial(uniforms: Uniforms) {
  const material = new MeshLambertMaterial({ color: "#ffffff" });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.uniforms.uCheer = uniforms.uCheer;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        attribute float aPart;
        attribute vec3 aShirt;
        attribute vec3 aSkin;
        attribute float aSeed;
        uniform float uTime;
        uniform float uCheer;
        varying vec3 vFan;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vFan = mix(aShirt, aSkin, aPart);
        float phase = aSeed * 6.2831;
        // a slow sway, always
        transformed.y += sin(uTime * 0.9 + phase) * 0.012;
        // three in four fans jump when the crowd roars
        float jumper = step(0.25, aSeed);
        float hop = abs(sin(uTime * (5.0 + aSeed * 2.5) + phase));
        transformed.y += uCheer * jumper * hop * 0.3;`,
      );
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vFan;").replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb *= vFan;");
  };
  material.customProgramCacheKey = () => "crowd-fan-v1";
  return material;
}

// GitHub's five shades, from "no contributions" to "a lot"
const LEVEL_COLORS = LEVEL_HEX.map((hex) => new Color(hex));

const DENSITY = { low: 0.34, medium: 0.62, high: 1 } as const;

export default function Crowd() {
  const quality = useWorld((s) => s.quality);
  const contributions = useWorld((s) => s.contributions);
  const fans = useRef<InstancedMesh>(null);
  const cards = useRef<InstancedMesh>(null);

  const uniforms = useMemo<Uniforms>(() => ({ uTime: { value: 0 }, uCheer: { value: 0 } }), []);
  const layout = useMemo(() => layoutCrowd(DENSITY[quality]), [quality]);

  const assets = useMemo(() => {
    const geometry = fanGeometry();
    geometry.setAttribute("aShirt", new InstancedBufferAttribute(layout.shirts, 3));
    geometry.setAttribute("aSkin", new InstancedBufferAttribute(layout.skins, 3));
    geometry.setAttribute("aSeed", new InstancedBufferAttribute(layout.seeds, 1));
    const material = fanMaterial(uniforms);

    const card = new PlaneGeometry(0.76, 0.6);
    const cardMaterial = new MeshBasicMaterial({ color: "#ffffff", side: DoubleSide });
    return { geometry, material, card, cardMaterial };
  }, [layout, uniforms]);

  useEffect(() => {
    return () => {
      assets.geometry.dispose();
      assets.material.dispose();
      assets.card.dispose();
      assets.cardMaterial.dispose();
    };
  }, [assets]);

  // Seat every fan, and give each card holder a card
  useEffect(() => {
    const mesh = fans.current;
    const cardMesh = cards.current;
    if (!mesh || !cardMesh) return;
    const dummy = new Object3D();
    for (let i = 0; i < layout.count; i++) {
      dummy.position.set(layout.positions[i * 3], layout.positions[i * 3 + 1], layout.positions[i * 3 + 2]);
      dummy.rotation.set(0, layout.facing[i], 0);
      const s = 0.94 + layout.seeds[i] * 0.14;
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;

    const tilt = new Matrix4().makeRotationX(-0.42);
    layout.cards.forEach(({ fan }, i) => {
      dummy.position.set(layout.positions[fan * 3], layout.positions[fan * 3 + 1] + 1.12, layout.positions[fan * 3 + 2]);
      dummy.rotation.set(0, layout.facing[fan], 0);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      dummy.matrix.multiply(tilt);
      cardMesh.setMatrixAt(i, dummy.matrix);
    });
    cardMesh.instanceMatrix.needsUpdate = true;
  }, [layout]);

  // Colour the cards from the contribution data (a quiet pattern until it arrives)
  useEffect(() => {
    const cardMesh = cards.current;
    if (!cardMesh) return;
    layout.cards.forEach(({ week, day }, i) => {
      let level = 0;
      if (contributions) level = contributions.levels[week]?.[day] ?? 0;
      else level = (week * 7 + day * 3) % 11 === 0 ? 1 : 0;
      cardMesh.setColorAt(i, LEVEL_COLORS[Math.max(0, Math.min(4, level))]);
    });
    if (cardMesh.instanceColor) {
      cardMesh.instanceColor.setUsage(DynamicDrawUsage);
      cardMesh.instanceColor.needsUpdate = true;
    }
  }, [layout, contributions]);

  useFrame(() => {
    uniforms.uTime.value = atmo.time;
    uniforms.uCheer.value = atmo.cheer;
    // Cards are held up in whatever light there is
    const light = 0.38 + 0.62 * Math.min(1, atmo.outdoor + atmo.floodlights * 0.45);
    assets.cardMaterial.color.setScalar(light);
  });

  return (
    <group>
      <instancedMesh ref={fans} args={[assets.geometry, assets.material, layout.count]} frustumCulled={false} />
      <instancedMesh ref={cards} args={[assets.card, assets.cardMaterial, MOSAIC.weeks * MOSAIC.days * MOSAIC.fansPerWeek * MOSAIC.rowsPerDay]} frustumCulled={false} />
    </group>
  );
}
