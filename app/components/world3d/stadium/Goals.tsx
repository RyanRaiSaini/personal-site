"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { DoubleSide, type Group } from "three";
import { canvasTexture } from "../textures/canvas";
import { PITCH } from "./dims";

// The two goals: white posts and crossbar, the stanchions behind, and
// a box net. `netKick` makes a net bulge for a moment when a ball
// hits it.

const W = PITCH.goalWidth;
const H = PITCH.goalHeight;
const D = PITCH.goalDepth;
const POST = 0.06;

// One square of netting, repeated
function netTexture() {
  const t = canvasTexture(
    32,
    32,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(255,255,255,0.95)";
      ctx.lineWidth = 2.4;
      ctx.strokeRect(0, 0, w, h);
    },
    { anisotropy: 8 },
  );
  return t;
}

// Which goal's net should bulge, and when it was hit
export const netKick = { north: -10, south: -10 };

function Goal({ side }: { side: 1 | -1 }) {
  const net = useRef<Group>(null);
  const assets = useMemo(() => {
    const back = netTexture();
    back.repeat.set(W / 0.14, H / 0.14);
    const top = netTexture();
    top.repeat.set(D / 0.14, W / 0.14);
    const flank = netTexture();
    flank.repeat.set(D / 0.14, H / 0.14);
    return { back, top, flank };
  }, []);

  useEffect(() => {
    return () => {
      assets.back.dispose();
      assets.top.dispose();
      assets.flank.dispose();
    };
  }, [assets]);

  useFrame((state) => {
    if (!net.current) return;
    const hitAt = side === 1 ? netKick.north : netKick.south;
    const since = state.clock.elapsedTime - hitAt;
    // A quick bulge that rings down in under a second
    const bulge = since >= 0 && since < 1.2 ? Math.exp(-since * 4) * Math.cos(since * 22) * 0.35 : 0;
    net.current.scale.set(1 + bulge, 1, 1);
  });

  const netMaterial = (map: typeof assets.back) => <meshBasicMaterial map={map} transparent side={DoubleSide} forceSinglePass color="#e9edf2" depthWrite={false} />;

  return (
    // The goal is built facing +X, then turned for the south end
    <group position={[side * PITCH.halfLength, 0, 0]} rotation={[0, side === 1 ? 0 : Math.PI, 0]}>
      {/* posts and crossbar */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[0, H / 2, (s * W) / 2]} castShadow>
          <cylinderGeometry args={[POST, POST, H, 12]} />
          <meshStandardMaterial color="#f4f5f7" roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, H, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[POST, POST, W + POST * 2, 12]} />
        <meshStandardMaterial color="#f4f5f7" roughness={0.35} />
      </mesh>
      {/* stanchions holding the net up at the back */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[D, H / 2, (s * W) / 2]}>
            <cylinderGeometry args={[0.03, 0.03, H, 8]} />
            <meshStandardMaterial color="#c9ccd2" roughness={0.5} metalness={0.4} />
          </mesh>
          <mesh position={[D / 2, H, (s * W) / 2]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, D, 8]} />
            <meshStandardMaterial color="#c9ccd2" roughness={0.5} metalness={0.4} />
          </mesh>
        </group>
      ))}
      {/* the net: back, top and two sides */}
      <group ref={net}>
        <mesh position={[D, H / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[W, H]} />
          {netMaterial(assets.back)}
        </mesh>
        <mesh position={[D / 2, H, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[D, W]} />
          {netMaterial(assets.top)}
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[D / 2, H / 2, (s * W) / 2]}>
            <planeGeometry args={[D, H]} />
            {netMaterial(assets.flank)}
          </mesh>
        ))}
      </group>
    </group>
  );
}

export default function Goals() {
  return (
    <>
      <Goal side={1} />
      <Goal side={-1} />
    </>
  );
}
