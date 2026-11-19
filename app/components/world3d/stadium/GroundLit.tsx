"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group, Material, Mesh, MeshStandardMaterial } from "three";
import { withBakedLight } from "./bakedLight";

// Everything placed inside this stands on or near the grass: players,
// the ball, the goals, the dugouts. Each is lit like the patch of
// ground it stands on, so a player in the roof's shadow is in shadow
// too, without the stadium having to cast a live shadow over him.
//
// New things can appear at any time (a guest player runs on for an
// Easter egg), so the group is checked again a couple of times a second.

export default function GroundLit({ children }: { children: React.ReactNode }) {
  const group = useRef<Group>(null);
  const frames = useRef(0);

  useFrame(() => {
    if (frames.current++ % 24 !== 0) return;
    group.current?.traverse((node) => {
      const material = (node as Mesh).material as Material | Material[] | undefined;
      if (!material) return;
      for (const one of Array.isArray(material) ? material : [material]) {
        // only materials that react to light; flat-coloured ones (lit signs, screens) are left alone
        if ((one as MeshStandardMaterial).isMeshStandardMaterial) withBakedLight(one as MeshStandardMaterial, "ground");
      }
    });
  });

  return <group ref={group}>{children}</group>;
}
