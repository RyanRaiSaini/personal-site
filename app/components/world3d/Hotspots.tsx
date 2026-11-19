"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";
import { places } from "../../sections/registry";
import { SPOTS } from "./spots";
import { tagScreen } from "./tagScreen";

// Works out, every frame, where each place's name tag belongs on the
// screen, and writes it into `tagScreen`. The tags themselves are
// ordinary page links drawn by app/components/world/Tags.tsx; this
// only tells them where to sit. Their 3D positions are the `anchor`
// values in spots.ts.

const point = new Vector3();

export default function Hotspots() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  useFrame(() => {
    for (const place of places) {
      const anchor = SPOTS[place.id as keyof typeof SPOTS].anchor;
      point.set(anchor[0], anchor[1], anchor[2]).project(camera);
      const slot = (tagScreen[place.id] ??= { x: 0, y: 0, visible: false });
      // behind the camera, or well off the edge of the screen
      slot.visible = point.z > -1 && point.z < 1 && Math.abs(point.x) < 1.15 && Math.abs(point.y) < 1.2;
      slot.x = (point.x * 0.5 + 0.5) * size.width;
      slot.y = (-point.y * 0.5 + 0.5) * size.height;
    }
  });

  return null;
}
