"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { BackSide, ClampToEdgeWrapping, Color, LinearFilter, NoColorSpace, RepeatWrapping, ShaderMaterial, TextureLoader, Vector3, type Texture } from "three";
import { SKY_FILES, SKY_TURN } from "./daylight";
import { atmo } from "./state";

// The sky seen through the roof opening, drawn on the inside of a huge
// sphere. By day it is a photograph of a real sky (Poly Haven, CC0),
// turned so that its sun sits where the stadium's sun is. At night it
// is a dark gradient with stars. Heavy cloud greys the photograph and
// draws a moving cloud deck over it.

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
  uniform sampler2D uPhoto;
  uniform float uPhotoReady;
  uniform float uTurn;

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

    float toSun = max(dot(dir, normalize(uSunDir)), 0.0);
    float clearSky = 1.0 - uOvercast * 0.85;

    // By day: the photographed sky. The picture is the top half of a
    // full turn, so its bottom edge is the horizon.
    float around = (atan(dir.z, dir.x) - uTurn) / 6.28318530718 + 0.5;
    float height = clamp(asin(clamp(dir.y, 0.0, 1.0)) / 1.57079632679, 0.002, 0.998);
    vec3 photo = texture2D(uPhoto, vec2(around, height)).rgb;
    photo = pow(photo, vec3(2.2)); // the picture is stored for screens; work in real light
    float grey = dot(photo, vec3(0.2126, 0.7152, 0.0722));
    photo = mix(photo, vec3(grey) * vec3(0.78, 0.82, 0.88), uOvercast * 0.85);
    float day = uDaylight * uPhotoReady;
    color = mix(color, photo * (0.25 + 0.75 * uDaylight), day);
    // before the photograph has loaded, a simple painted sun stands in
    color += uSunColor * (pow(toSun, 600.0) * 6.0 + pow(toSun, 24.0) * 0.35) * uDaylight * clearSky * (1.0 - uPhotoReady);

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

    // Painted clouds: at night, and as a grey deck when it is overcast.
    // On a clear day the photograph has its own.
    vec2 uv = dir.xz / max(dir.y + 0.22, 0.05) * 1.1 + vec2(uTime * 0.006, uTime * 0.002);
    float cover = mix(0.62, 0.28, uOvercast);
    float cloud = smoothstep(cover, cover + 0.3, fbm(uv));
    vec3 cloudDay = mix(vec3(1.0), vec3(0.62, 0.66, 0.72), uOvercast);
    vec3 cloudNight = vec3(0.07, 0.09, 0.15);
    vec3 cloudColor = mix(cloudNight, cloudDay, uDaylight);
    float painted = mix(1.0, uOvercast, day);
    color = mix(color, cloudColor, cloud * mix(0.55, 0.95, uOvercast) * smoothstep(0.0, 0.2, up) * painted);

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
      uPhoto: { value: null as Texture | null },
      uPhotoReady: { value: 0 },
      uTurn: { value: SKY_TURN },
    }),
    [],
  );

  // The photograph arrives a moment after the page; the painted sky
  // covers until then. It is kept here and handed to the material each
  // frame, because the material keeps its own copy of these settings.
  const photo = useRef<Texture | null>(null);
  useEffect(() => {
    let alive = true;
    new TextureLoader().load(SKY_FILES.picture, (texture) => {
      if (!alive) {
        texture.dispose();
        return;
      }
      // the shader converts the colours itself, so read the stored values as they are
      texture.colorSpace = NoColorSpace;
      texture.wrapS = RepeatWrapping;
      texture.wrapT = ClampToEdgeWrapping;
      texture.minFilter = LinearFilter;
      texture.generateMipmaps = false;
      photo.current = texture;
    });
    return () => {
      alive = false;
      photo.current?.dispose();
      photo.current = null;
    };
  }, []);

  useFrame(() => {
    // Write to the material's own settings, not to the object above:
    // the material is given a copy when it is made.
    const u = material.current?.uniforms;
    if (!u) return;
    u.uTop.value.copy(atmo.skyTop);
    u.uHorizon.value.copy(atmo.skyHorizon);
    u.uSunDir.value.copy(atmo.sunDirection);
    u.uSunColor.value.copy(atmo.sunColor);
    u.uDaylight.value = atmo.daylight;
    u.uOvercast.value = atmo.overcast;
    u.uTime.value = atmo.time;
    u.uPhoto.value = photo.current;
    u.uPhotoReady.value = photo.current ? 1 : 0;
  });

  return (
    <mesh scale={900} frustumCulled={false} renderOrder={-10}>
      <sphereGeometry args={[1, 32, 20]} />
      <shaderMaterial ref={material} vertexShader={vertex} fragmentShader={fragment} uniforms={uniforms} side={BackSide} depthWrite={false} fog={false} />
    </mesh>
  );
}
