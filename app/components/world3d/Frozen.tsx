"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";

// ------------------------------------------------------------------
// Holds still everything inside it: its place in the world is worked out
// once, and three.js then skips it every frame instead of recomputing
// the position of every board, stool and camera sixty times a second.
// On a slow laptop that per-object work, not the drawing, was what held
// the frame rate down (a profile of the overview, 2026-11-24).
//
// Only for things that never move. Anything inside that changes its
// position, turn or size by itself will appear stuck. People and other
// pieces that turn up later (a picture still loading) are fine: the
// contents are counted every few frames and worked out again if they
// have changed.
// ------------------------------------------------------------------

export default function Frozen({ children }: { children: React.ReactNode }) {
  const group = useRef<Group>(null);
  const known = useRef(-1);
  const frames = useRef(0);

  useFrame(() => {
    const g = group.current;
    if (!g || frames.current++ % 10 !== 0) return;
    let count = 0;
    g.traverse(() => count++);
    if (count === known.current) return;
    known.current = count;
    // something new inside: work every place out again, then hold it
    g.traverse((node) => {
      node.matrixAutoUpdate = true;
    });
    g.updateMatrixWorld(true);
    g.traverse((node) => {
      if (node !== g) node.matrixAutoUpdate = false;
    });
    g.matrixWorldAutoUpdate = false;
  });

  return <group ref={group}>{children}</group>;
}
