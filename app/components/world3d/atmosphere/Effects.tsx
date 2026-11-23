"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { DepthOfFieldEffect, Effect } from "postprocessing";
import { useEffect, useMemo } from "react";
import { Uniform, Vector3 } from "three";
import { useWorld } from "../../../lib/store";
import { rig } from "../camera/CameraRig";
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
  const camera = useThree((s) => s.camera);
  const grade = useMemo(() => new BroadcastGrade(), []);
  // A camera lens's shallow focus: sharp on what the camera looks at, the
  // stands behind melting away and the lights turning to soft discs.
  // Wide shots are sharp throughout, as on television; the closer the
  // subject, the stronger the blur. Worked out at half size, to stay cheap.
  const lens = useMemo(() => {
    const effect = new DepthOfFieldEffect(camera, { worldFocusRange: 7, bokehScale: 0, resolutionScale: 0.5 });
    effect.target = new Vector3();
    return effect;
  }, [camera]);
  useEffect(() => () => lens.dispose(), [lens]);

  // the exposure the atmosphere sets for the time of day (AtmosphereDriver.tsx)
  useFrame(({ gl }) => {
    grade.uniforms.get("uGradeExposure")!.value = gl.toneMappingExposure;
    lens.target!.copy(rig.target);
    const focus = rig.position.distanceTo(rig.target);
    lens.bokehScale = 3.2 * Math.min(1, Math.max(0, (28 - focus) / 18));
    lens.cocMaterial.worldFocusRange = Math.max(3, focus * 0.6);
  });

  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <primitive object={lens} />
      {/* Only light sources pass the threshold; a white shirt under a lamp does not */}
      <Bloom mipmapBlur intensity={0.6} luminanceThreshold={1.3} luminanceSmoothing={0.2} radius={0.72} />
      <primitive object={grade} />
    </EffectComposer>
  );
}
