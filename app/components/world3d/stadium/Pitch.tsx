"use client";

import { useEffect, useMemo } from "react";
import { MeshStandardMaterial, PlaneGeometry, RepeatWrapping, Shape, ShapeGeometry, TextureLoader, Vector2 } from "three";
import { canvasTexture, grain } from "../textures/canvas";
import { withBakedLight } from "./bakedLight";
import { PITCH } from "./dims";
import { outline } from "./path";

// ------------------------------------------------------------------
// The pitch.
//
// The grass colour, the mowing pattern and every white line are drawn
// by a small shader, so the lines stay sharp however close the camera
// gets. The fine relief of the blades is a photographed surface from
// Poly Haven ("Sparse Grass", CC0).
//
// A mower lays the blades one way on one pass and the other way on the
// next. That is all a mowing stripe is: the same grass seen with or
// against the lean. So the stripes here are strongest looking along the
// pitch, fade as you look across it, and swap over from the other end,
// as real ones do.
//
// To change the grass colour, change `base` in pitchColor.
// To make the stripes stronger or fainter, change STRIPE.
// ------------------------------------------------------------------

const MARGIN_X = 6.5; // grass beyond the goal lines
const MARGIN_Z = 5; // grass beyond the touchlines
const STRIPE = 0.15; // how much lighter and darker the mown bands look, at most
const BLADES = 1.5; // metres of pitch covered by one copy of the blade relief

const pitchShader = /* glsl */ `
  varying vec2 vPitch;
  varying vec2 vToCamera;

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  // 1 on a painted line, 0 off it. 'dist' is the distance to the
  // line's centre in metres.
  float line(float dist) {
    float halfWidth = 0.06;
    float aa = max(fwidth(dist), 0.0001);
    return 1.0 - smoothstep(halfWidth - aa, halfWidth + aa, abs(dist));
  }

  float boxOutline(vec2 p, vec2 centre, vec2 halfSize) {
    vec2 q = abs(p - centre) - halfSize;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  }

  float dotMark(vec2 p, vec2 centre, float radius) {
    float d = length(p - centre) - radius;
    float aa = max(fwidth(d), 0.0001);
    return 1.0 - smoothstep(-aa, aa, d);
  }

  vec3 pitchColor(vec2 p, vec2 toCamera) {
    float HL = ${PITCH.halfLength.toFixed(2)};
    float HW = ${PITCH.halfWidth.toFixed(2)};

    vec3 base = vec3(0.046, 0.200, 0.030);
    vec3 grass = base;

    // Mown bands across the pitch, twenty of them, and a fainter set
    // along it. Each band leans one way; how light it looks depends on
    // which way it leans relative to the camera.
    vec2 view = normalize(toCamera + vec2(0.0001));
    float bandX = step(0.5, fract((p.x + HL) / 10.5)) * 2.0 - 1.0;
    float bandZ = step(0.5, fract((p.y + HW) / 11.34)) * 2.0 - 1.0;
    // Strongest looking along the pitch; from the side the sheen still
    // shows them, as a broadcast camera on the halfway line sees them
    grass *= 1.0 + ${STRIPE.toFixed(3)} * bandX * (0.55 + 0.45 * abs(view.x));
    grass *= 1.0 + ${(STRIPE * 0.3).toFixed(3)} * bandZ * view.y;

    // No lawn is one colour: broad patches, smaller mottling, and a few
    // drier, yellower areas
    float broad = noise2(p * 0.06) * 0.55 + noise2(p * 0.27) * 0.3 + noise2(p * 1.1) * 0.15;
    grass *= 0.87 + broad * 0.26;
    float dry = smoothstep(0.58, 0.92, noise2(p * 0.043 + 11.0));
    grass = mix(grass, grass * vec3(1.16, 1.05, 0.78), dry * 0.3);

    // A little wear where the play is heaviest: both goal mouths and the centre
    float wear = 0.0;
    wear = max(wear, 1.0 - smoothstep(1.5, 7.5, length((p - vec2(HL - 3.5, 0.0)) * vec2(1.0, 0.7))));
    wear = max(wear, 1.0 - smoothstep(1.5, 7.5, length((p + vec2(HL - 3.5, 0.0)) * vec2(1.0, 0.7))));
    wear = max(wear, (1.0 - smoothstep(0.5, 5.0, length(p))) * 0.5);
    wear *= 0.5 + 0.5 * noise2(p * 0.9);
    grass = mix(grass, grass * vec3(1.14, 1.06, 0.84), wear * 0.28);

    // Individual blades up close, fading out with distance
    float fine = noise2(p * 26.0) * 0.6 + noise2(p * 61.0) * 0.4;
    float close = 1.0 - smoothstep(0.015, 0.2, fwidth(p.x) + fwidth(p.y));
    grass *= 1.0 + (fine - 0.5) * 0.3 * close;

    // The lines
    float inside = step(abs(p.x), HL + 0.06) * step(abs(p.y), HW + 0.06);
    float m = 0.0;
    m = max(m, line(boxOutline(p, vec2(0.0), vec2(HL, HW))));
    m = max(m, line(p.x) * step(abs(p.y), HW));
    m = max(m, line(length(p) - ${PITCH.circleRadius.toFixed(2)}));
    m = max(m, dotMark(p, vec2(0.0), 0.2));

    for (int s = -1; s <= 1; s += 2) {
      float side = float(s);
      float gx = side * HL;
      // penalty area and goal area
      vec2 pa = vec2(gx - side * ${(PITCH.penaltyAreaDepth / 2).toFixed(3)}, 0.0);
      m = max(m, line(boxOutline(p, pa, vec2(${(PITCH.penaltyAreaDepth / 2).toFixed(3)}, ${(PITCH.penaltyAreaWidth / 2).toFixed(3)}))) * inside);
      vec2 ga = vec2(gx - side * ${(PITCH.goalAreaDepth / 2).toFixed(3)}, 0.0);
      m = max(m, line(boxOutline(p, ga, vec2(${(PITCH.goalAreaDepth / 2).toFixed(3)}, ${(PITCH.goalAreaWidth / 2).toFixed(3)}))) * inside);
      // penalty spot and the arc outside the area
      vec2 spot = vec2(gx - side * ${PITCH.penaltySpot.toFixed(2)}, 0.0);
      m = max(m, dotMark(p, spot, 0.2));
      float outsideArea = step(${PITCH.penaltyAreaDepth.toFixed(2)}, abs(p.x - gx));
      m = max(m, line(length(p - spot) - ${PITCH.circleRadius.toFixed(2)}) * outsideArea);
      // corner arcs
      for (int c = -1; c <= 1; c += 2) {
        vec2 cornerPoint = vec2(gx, float(c) * HW);
        m = max(m, line(length(p - cornerPoint) - 1.0) * inside);
      }
    }

    // Paint sits on the blades, so a little green shows through it
    vec3 paint = vec3(0.80, 0.82, 0.78);
    return mix(grass, paint, m * (0.84 + 0.1 * fine));
  }
`;

function grassMaterial() {
  const loader = new TextureLoader();
  const relief = loader.load("/stadium/textures/sparse_grass_nor.webp");
  const finish = loader.load("/stadium/textures/sparse_grass_arm.webp");
  // the photographed lawn's light and dark: real blades and grain near
  // the camera (its colour is not used; pitchColor sets that)
  const grain = loader.load("/stadium/textures/sparse_grass_diff.webp");
  const length = PITCH.length + MARGIN_X * 2;
  const width = PITCH.width + MARGIN_Z * 2;
  for (const texture of [relief, finish, grain]) {
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(length / BLADES, width / BLADES);
    texture.anisotropy = 8;
  }
  // a little sheen: grass blades catch the sky at a low angle
  const material = new MeshStandardMaterial({ color: "#ffffff", roughness: 0.82, metalness: 0, normalMap: relief, roughnessMap: finish });
  material.normalScale.setScalar(0.75);
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uGrain = { value: grain };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec2 vPitch;\nvarying vec2 vToCamera;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPitch = position.xz;\nvToCamera = cameraPosition.xz - ( modelMatrix * vec4( position, 1.0 ) ).xz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nuniform sampler2D uGrain;\n${pitchShader}`)
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        diffuseColor.rgb = pitchColor(vPitch, vToCamera);
        // the photo's grain, strongest close by, gone in the distance
        // (0.245 is the photo's average brightness)
        float grainNear = 1.0 - smoothstep(0.04, 0.6, fwidth(vPitch.x) + fwidth(vPitch.y));
        float grainHere = clamp(dot(texture2D(uGrain, vNormalMapUv).rgb, vec3(0.3, 0.59, 0.11)) / 0.245, 0.5, 1.6);
        diffuseColor.rgb *= mix(1.0, grainHere, 0.6 * grainNear);
        // and the lawn's larger texture across the middle distance, four
        // metres to a copy, so the pitch is never flat paint
        float grainMid = smoothstep(0.01, 0.12, fwidth(vPitch.x) + fwidth(vPitch.y)) * (1.0 - smoothstep(0.8, 2.5, fwidth(vPitch.x) + fwidth(vPitch.y)));
        float grainWide = clamp(dot(texture2D(uGrain, vNormalMapUv * 0.37).rgb, vec3(0.3, 0.59, 0.11)) / 0.245, 0.6, 1.4);
        diffuseColor.rgb *= mix(1.0, grainWide, 0.45 * grainMid);`,
      );
  };
  material.customProgramCacheKey = () => "pitch-grass-v5";
  material.userData.textures = [relief, finish, grain];
  // lit like the ground it is: the roof's shadow and the open sky above come from the ground picture
  return withBakedLight(material, "ground");
}

export default function Pitch() {
  const assets = useMemo(() => {
    const grass = new PlaneGeometry(PITCH.length + MARGIN_X * 2, PITCH.width + MARGIN_Z * 2, 1, 1);
    grass.rotateX(-Math.PI / 2);

    // The run-off between the grass and the front wall: darker artificial turf
    const shape = new Shape(outline(0.4, 14).map((p) => new Vector2(p.x, -p.z)));
    const apron = new ShapeGeometry(shape, 1);
    apron.rotateX(-Math.PI / 2);

    const apronMap = canvasTexture(128, 128, (ctx, w, h) => {
      ctx.fillStyle = "#234a2b";
      ctx.fillRect(0, 0, w, h);
      grain(ctx, w, h, 12, 21);
    });
    apronMap.repeat.set(0.5, 0.5);
    const apronMaterial = withBakedLight(new MeshStandardMaterial({ map: apronMap, roughness: 0.96 }), "ground");

    return { grass, apron, apronMap, apronMaterial, material: grassMaterial() };
  }, []);

  useEffect(() => {
    return () => {
      assets.grass.dispose();
      assets.apron.dispose();
      assets.apronMap.dispose();
      assets.apronMaterial.dispose();
      for (const texture of assets.material.userData.textures) texture.dispose();
      assets.material.dispose();
    };
  }, [assets]);

  return (
    <group>
      <mesh geometry={assets.apron} material={assets.apronMaterial} position={[0, -0.03, 0]} receiveShadow />
      <mesh geometry={assets.grass} material={assets.material} receiveShadow />
    </group>
  );
}
