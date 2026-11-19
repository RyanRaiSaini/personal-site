"use client";

import { useEffect, useMemo } from "react";
import { MeshStandardMaterial, PlaneGeometry, Shape, ShapeGeometry, Vector2 } from "three";
import { canvasTexture, grain } from "../textures/canvas";
import { PITCH } from "./dims";
import { outline } from "./path";

// The pitch. The grass, the mowing stripes and every white line are
// drawn by a small shader, so the lines stay perfectly sharp however
// close the camera gets.

const MARGIN_X = 6.5; // grass beyond the goal lines
const MARGIN_Z = 5; // grass beyond the touchlines

const pitchShader = /* glsl */ `
  varying vec2 vPitch;

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

  vec3 pitchColor(vec2 p) {
    float HL = ${PITCH.halfLength.toFixed(2)};
    float HW = ${PITCH.halfWidth.toFixed(2)};

    // Mowing stripes across the pitch, with a fainter set along it
    float bandX = step(0.5, fract((p.x + HL) / 10.5));
    float bandZ = step(0.5, fract((p.y + HW) / 13.6));
    vec3 light = vec3(0.118, 0.300, 0.072);
    vec3 dark = vec3(0.084, 0.232, 0.056);
    vec3 grass = mix(dark, light, bandX);
    grass *= mix(0.94, 1.04, bandZ);

    // Patchy variation, then fine blades that fade out with distance
    float patches = noise2(p * 0.18) * 0.6 + noise2(p * 0.9) * 0.4;
    grass *= 0.9 + patches * 0.2;
    float fine = noise2(p * 14.0);
    float fade = 1.0 - smoothstep(0.02, 0.25, fwidth(p.x) + fwidth(p.y));
    grass *= 1.0 + (fine - 0.5) * 0.22 * fade;

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

    vec3 paint = vec3(0.86, 0.88, 0.84);
    return mix(grass, paint, m * 0.92);
  }
`;

function grassMaterial() {
  const material = new MeshStandardMaterial({ color: "#ffffff", roughness: 0.92, metalness: 0 });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace("#include <common>", "#include <common>\nvarying vec2 vPitch;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvPitch = position.xz;");
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", `#include <common>\n${pitchShader}`).replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb = pitchColor(vPitch);");
  };
  material.customProgramCacheKey = () => "pitch-grass-v1";
  return material;
}

export default function Pitch() {
  const assets = useMemo(() => {
    const grass = new PlaneGeometry(PITCH.length + MARGIN_X * 2, PITCH.width + MARGIN_Z * 2, 1, 1);
    grass.rotateX(-Math.PI / 2);

    // The run-off between the grass and the front wall
    const shape = new Shape(outline(0.4, 14).map((p) => new Vector2(p.x, -p.z)));
    const apron = new ShapeGeometry(shape, 1);
    apron.rotateX(-Math.PI / 2);

    const apronMap = canvasTexture(128, 128, (ctx, w, h) => {
      ctx.fillStyle = "#1d4a2c";
      ctx.fillRect(0, 0, w, h);
      grain(ctx, w, h, 10, 21);
    });
    apronMap.repeat.set(0.25, 0.25);

    return { grass, apron, apronMap, material: grassMaterial() };
  }, []);

  useEffect(() => {
    return () => {
      assets.grass.dispose();
      assets.apron.dispose();
      assets.apronMap.dispose();
      assets.material.dispose();
    };
  }, [assets]);

  return (
    <group>
      <mesh geometry={assets.apron} position={[0, -0.03, 0]} receiveShadow>
        <meshStandardMaterial map={assets.apronMap} roughness={0.95} />
      </mesh>
      <mesh geometry={assets.grass} material={assets.material} receiveShadow />
    </group>
  );
}
