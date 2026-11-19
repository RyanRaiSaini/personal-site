"use client";

import { Bloom, EffectComposer, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useWorld } from "../../../lib/store";

// The glow: bright things (the floodlights, the big screen, lit signs)
// bleed a soft halo of light, the way they do through a camera lens.
//
// It is only switched on at the "high" quality level. Measured on a
// laptop's built-in graphics (Intel Iris Xe, 1920 x 1080), this one
// extra pass took the stadium from 60 pictures a second to 39, so
// machines like that go without it.
//
// To make the glow stronger or weaker, change `intensity`. To make
// fewer things glow, raise `luminanceThreshold`.

export default function Effects() {
  const quality = useWorld((s) => s.quality);
  if (quality !== "high") return null;

  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      {/* Only light sources pass the threshold; a white shirt under a lamp does not */}
      <Bloom mipmapBlur intensity={0.6} luminanceThreshold={1.3} luminanceSmoothing={0.2} radius={0.72} />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
    </EffectComposer>
  );
}
