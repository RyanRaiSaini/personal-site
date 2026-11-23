"use client";

import { useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { Effect } from "postprocessing";
import { useMemo } from "react";
import { Uniform } from "three";
import { useWorld } from "../../../lib/store";
import { gradeShader } from "./grade";

// The glow: bright things (the floodlights, the big screen, lit signs)
// bleed a soft halo of light, the way they do through a camera lens.
//
// It is only switched on at the "high" quality level. Measured on a
// laptop's built-in graphics (Intel Iris Xe, 1920 x 1080), this one
// extra pass took the stadium from 60 pictures a second to 39, so
// machines like that go without it.
//
// When it is on, the picture is drawn to a hidden canvas first, and the
// renderer leaves out its own last step, the broadcast grade (grade.ts).
// So the same grade is the last thing this pass does.
//
// To make the glow stronger or weaker, change `intensity`. To make
// fewer things glow, raise `luminanceThreshold`.

class BroadcastGrade extends Effect {
  constructor() {
    super(
      "BroadcastGrade",
      `${gradeShader}
      uniform float uGradeExposure;
      void mainImage( const in vec4 inputColor, const in vec2 uv, out vec4 outputColor ) {
        outputColor = vec4( broadcastLook( inputColor.rgb, uGradeExposure ), inputColor.a );
      }`,
      { uniforms: new Map([["uGradeExposure", new Uniform(1)]]) },
    );
  }
}

export default function Effects() {
  const quality = useWorld((s) => s.quality);
  if (quality !== "high") return null;
  return <Composer />;
}

function Composer() {
  const grade = useMemo(() => new BroadcastGrade(), []);
  // the exposure the atmosphere sets for the time of day (AtmosphereDriver.tsx)
  useFrame(({ gl }) => {
    grade.uniforms.get("uGradeExposure")!.value = gl.toneMappingExposure;
  });

  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      {/* Only light sources pass the threshold; a white shirt under a lamp does not */}
      <Bloom mipmapBlur intensity={0.6} luminanceThreshold={1.3} luminanceSmoothing={0.2} radius={0.72} />
      <primitive object={grade} />
    </EffectComposer>
  );
}
