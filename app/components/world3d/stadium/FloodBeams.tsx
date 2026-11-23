"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { AdditiveBlending, Color, DoubleSide, ShaderMaterial } from "three";
import { useWorld } from "../../../lib/store";
import { atmo } from "../atmosphere/state";
import { sweepBand } from "./path";

// ------------------------------------------------------------------
// The floodlights' beams. At night the lamps under the roof light up
// the haze, so shafts of light fall from the ring of lamps onto the
// pitch. They are one sheet of surface, swept round the bowl from the
// lamp bar down to the pitch, and painted in its shader: brightest at
// the lamps, fading as it falls, and broken into separate shafts. It
// adds light and never hides anything, so it is one cheap pass.
//
// By day (or with the floodlights low) it fades away entirely. It costs
// about a seventh of the drawing time on a night view of the bowl
// (measured on a laptop's built-in graphics), so the "low" quality
// level goes without it.
//
// To make the beams stronger or fainter, change STRENGTH; to space the
// shafts differently, change the numbers in `shafts` in the shader.
// ------------------------------------------------------------------

// Where the lamp bar is (blender/stadium/params.py, FLOODS), and where
// the beams land: on the pitch, well in from the touchlines
const TOP = { d: -2.4, y: 42.2 };
const BOTTOM = { d: -18, y: 0.3 };
const STRENGTH = 0.34;
const COLOUR = new Color("#dfe7ff");

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragment = /* glsl */ `
  uniform float uStrength;
  uniform vec3 uColour;
  varying vec2 vUv;
  void main() {
    float u = vUv.x; // metres round the bowl
    // 0 at the lamps, 1 on the pitch; kept in range, since a power of a
    // number a hair below zero is not a number, and the glow pass would
    // smear that one pixel over the whole picture
    float v = clamp( vUv.y, 0.0, 1.0 );
    // separate shafts of differing widths, as from lamps aimed a little apart
    float shafts = 0.5 + 0.5 * sin(u * 0.85 + 2.0 * sin(u * 0.21));
    shafts = 0.22 + 0.78 * pow(shafts, 4.0);
    // bright at the lamps, thinning as the light spreads and falls
    float fall = pow(1.0 - v, 1.9) * smoothstep(1.0, 0.82, v);
    // a halo hugging the lamp bar itself
    float halo = exp(-v * 55.0) * 2.2;
    float light = uStrength * (fall * shafts + halo);
    gl_FragColor = vec4(uColour * light, 1.0);
  }
`;

export default function FloodBeams() {
  const quality = useWorld((s) => s.quality);
  const geometry = useMemo(() => {
    const length = Math.hypot(TOP.d - BOTTOM.d, TOP.y - BOTTOM.y);
    return sweepBand(TOP, BOTTOM, { continuousU: true, vSize: length, segmentLength: 2, cornerSegments: 24 });
  }, []);

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        uniforms: { uStrength: { value: 0 }, uColour: { value: COLOUR } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
        // a see-through surface seen from both sides: one pass, not two
        forceSinglePass: true,
        fog: false,
      }),
    [],
  );

  useEffect(
    () => () => {
      geometry.dispose();
      material.dispose();
    },
    [geometry, material],
  );

  useFrame(() => {
    // only under floodlights, and only when it is dark enough to see them
    material.uniforms.uStrength.value = STRENGTH * atmo.floodlights * Math.max(0, 1 - atmo.outdoor * 1.6);
  });

  // hidden, not removed, at "low", so it comes back cleanly
  return <mesh geometry={geometry} material={material} renderOrder={5} frustumCulled={false} visible={quality !== "low"} />;
}
