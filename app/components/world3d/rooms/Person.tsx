"use client";

import { useEffect, useState } from "react";
import { DoubleSide, type Texture } from "three";
import { PERSON, personPicture, type PersonLook } from "./clerk";

// One of the crowd's people, seated, placed in a room: his feet at
// `position`, facing +Z (toward the camera for the front sheet; for the
// back sheet he is seen from behind, facing away). `lift` raises him, as
// on a stool. `mirrored` flips him, so the same man looks like another.
export default function Person({ look, position, lift = 0, mirrored = false, turn = 0 }: { look: PersonLook; position: [number, number, number]; lift?: number; mirrored?: boolean; turn?: number }) {
  const [picture, setPicture] = useState<Texture | null>(null);
  const key = JSON.stringify(look);
  useEffect(() => {
    let alive = true;
    let made: Texture | null = null;
    personPicture(JSON.parse(key) as PersonLook)
      .then((texture) => {
        made = texture;
        if (alive) setPicture(texture);
        else texture.dispose();
      })
      .catch(() => undefined);
    return () => {
      alive = false;
      made?.dispose();
    };
  }, [key]);
  if (!picture) return null;
  return (
    <group position={position} rotation={[0, turn, 0]}>
      <mesh position={[0, lift + PERSON.height / 2, 0]} scale={[mirrored ? -1 : 1, 1, 1]}>
        <planeGeometry args={[PERSON.width, PERSON.height]} />
        <meshStandardMaterial map={picture} alphaTest={0.45} roughness={0.85} side={DoubleSide} />
      </mesh>
    </group>
  );
}
