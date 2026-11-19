"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { BackSide, Color, ShaderMaterial, Vector3 } from "three";
import { atmo } from "./state";

// The sky seen through the roof opening: a gradient that follows the
// real time of day, a sun, drifting clouds, and stars at night. Drawn
// on the inside of a huge sphere.

const vertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_Position.z = gl_Position.w; // always behind everything
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  varying vec3 vDir;
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uSunDir;
  uniform vec3 uSunColor;
  uniform float uDaylight;
  uniform float uOvercast;
  uniform float uTime;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec2(17.0, 9.0);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vDir);
    float up = clamp(dir.y, 0.0, 1.0);
    vec3 color = mix(uHorizon, uTop, pow(up, 0.55));

    // Sun: a small bright disc with a wide soft glow
    float toSun = max(dot(dir, normalize(uSunDir)), 0.0);
    float clearSky = 1.0 - uOvercast * 0.85;
    color += uSunColor * (pow(toSun, 600.0) * 6.0 + pow(toSun, 24.0) * 0.35) * uDaylight * clearSky;

    // Stars, only at night and only where the sky is clear
    // The sky is divided into a fine grid; about one cell in thirty
    // holds a star, drawn as a small soft dot somewhere inside it
    vec2 grid = dir.xz / max(dir.y + 0.35, 0.05) * 150.0;
    vec2 cell = floor(grid);
    float star = hash(cell);
    vec2 offset = vec2(hash(cell + 17.0), hash(cell + 43.0)) - 0.5;
    float dist = length(fract(grid) - 0.5 - offset * 0.6);
    float twinkle = 0.7 + 0.3 * sin(uTime * (1.0 + star * 3.0) + star * 40.0);
    float size = 0.05 + 0.09 * hash(cell + 91.0);
    float stars = step(0.968, star) * smoothstep(size, 0.0, dist) * twinkle;
    color += vec3(0.85, 0.9, 1.0) * stars * (1.0 - uDaylight) * clearSky * smoothstep(0.05, 0.4, up);

    // Clouds drifting slowly across
    vec2 uv = dir.xz / max(dir.y + 0.22, 0.05) * 1.1 + vec2(uTime * 0.006, uTime * 0.002);
    float cover = mix(0.62, 0.28, uOvercast);
    float cloud = smoothstep(cover, cover + 0.3, fbm(uv));
    vec3 cloudDay = mix(vec3(1.0), vec3(0.62, 0.66, 0.72), uOvercast);
    vec3 cloudNight = vec3(0.07, 0.09, 0.15);
    vec3 cloudColor = mix(cloudNight, cloudDay, uDaylight);
    cloudColor += uSunColor * pow(toSun, 6.0) * 0.25 * uDaylight;
    color = mix(color, cloudColor, cloud * mix(0.55, 0.95, uOvercast) * smoothstep(0.0, 0.2, up));

    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export default function Sky() {
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      uTop: { value: new Color() },
      uHorizon: { value: new Color() },
      uSunDir: { value: new Vector3(0, 1, 0) },
      uSunColor: { value: new Color() },
      uDaylight: { value: 0 },
      uOvercast: { value: 0 },
      uTime: { value: 0 },
    }),
    [],
  );

  useFrame(() => {
    const u = uniforms;
    u.uTop.value.copy(atmo.skyTop);
    u.uHorizon.value.copy(atmo.skyHorizon);
    u.uSunDir.value.copy(atmo.sunDirection);
    u.uSunColor.value.copy(atmo.sunColor);
    u.uDaylight.value = atmo.daylight;
    u.uOvercast.value = atmo.overcast;
    u.uTime.value = atmo.time;
  });

  return (
    <mesh scale={900} frustumCulled={false} renderOrder={-10}>
      <sphereGeometry args={[1, 32, 20]} />
      <shaderMaterial ref={material} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} side={BackSide} depthWrite={false} fog={false} />
    </mesh>
  );
}
