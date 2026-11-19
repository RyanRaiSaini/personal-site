"use client";

import { Bloom, EffectComposer, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useWorld } from "../../../lib/store";

// The glow: bright things (the floodlights, the big screen, the LED
// boards, lit signs) bleed a soft halo of light, the way they do
// through a camera lens. Left off on the lightest quality level,
// where every frame counts.
//
// To make the glow stronger or weaker, change `intensity`. To make
// fewer things glow, raise `luminanceThreshold`.

export default function Effects() {
  const quality = useWorld((s) => s.quality);
  if (quality === "low") return null;

  return (
    <EffectComposer multisampling={quality === "high" ? 4 : 2} enableNormalPass={false}>
      {/* Only light sources pass the threshold; a white shirt under a lamp does not */}
      <Bloom mipmapBlur intensity={0.6} luminanceThreshold={1.3} luminanceSmoothing={0.2} radius={0.72} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
