"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from "react";
import { CapsuleGeometry, CylinderGeometry, DoubleSide, MeshBasicMaterial, MeshStandardMaterial, SphereGeometry, TorusGeometry, type Group } from "three";
import { canvasTexture } from "../textures/canvas";
import { useDisplayFont } from "../textures/text";
import type { Pose } from "./poses";

// ------------------------------------------------------------------
// A footballer, built from simple rounded shapes joined at the hips,
// shoulders, elbows and knees, so he can run, shoot and celebrate.
// He faces +Z. The all-white kit carries a name and number on the
// back, and no crest.
//
// Who is who (names, numbers, skin tones, hair) is in kits.ts.
// How they move is in poses.ts.
// ------------------------------------------------------------------

export type Kit = {
  name: string; // as printed on the shirt
  number: number;
  skin: string;
  hair: string;
  hairStyle: "short" | "fade" | "medium";
  beard?: boolean;
  boots?: string;
};

export type PlayerHandle = {
  group: Group;
  setPose: (pose: Pose) => void;
};

const HIP = 0.93;
const KIT = "#f7f7f4";
const TRIM = "#d9b85a";
const INK = "#10224a";

// The print on the back of the shirt
function backPrint(family: string, name: string, number: number) {
  return canvasTexture(
    256,
    288,
    (ctx, w) => {
      ctx.clearRect(0, 0, 256, 288);
      ctx.fillStyle = INK;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let size = 44;
      ctx.font = `700 ${size}px ${family}`;
      const wide = ctx.measureText(name).width;
      if (wide > 236) {
        size *= 236 / wide;
        ctx.font = `700 ${size}px ${family}`;
      }
      ctx.fillText(name, w / 2, 40);
      ctx.font = `800 210px ${family}`;
      ctx.fillText(String(number), w / 2, 178);
    },
    { repeat: false, anisotropy: 16 },
  );
}

// Four soft shadows in a star, the way floodlights throw them
function shadowTexture() {
  return canvasTexture(
    128,
    128,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.rotate((i * Math.PI) / 2 + Math.PI / 4);
        const g = ctx.createRadialGradient(22, 0, 2, 22, 0, 34);
        g.addColorStop(0, "rgba(0,0,0,0.5)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.scale(1, 0.42);
        ctx.beginPath();
        ctx.arc(22, 0, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    },
    { repeat: false },
  );
}

const Player = forwardRef<PlayerHandle, { kit: Kit; shadow?: boolean }>(function Player({ kit, shadow = true }, ref) {
  const family = useDisplayFont();
  const root = useRef<Group>(null);
  const hips = useRef<Group>(null);
  const torso = useRef<Group>(null);
  const head = useRef<Group>(null);
  const shoulderL = useRef<Group>(null);
  const shoulderR = useRef<Group>(null);
  const rollL = useRef<Group>(null);
  const rollR = useRef<Group>(null);
  const elbowL = useRef<Group>(null);
  const elbowR = useRef<Group>(null);
  const hipL = useRef<Group>(null);
  const hipR = useRef<Group>(null);
  const kneeL = useRef<Group>(null);
  const kneeR = useRef<Group>(null);

  const parts = useMemo(() => {
    const cloth = new MeshStandardMaterial({ color: KIT, roughness: 0.82 });
    const skin = new MeshStandardMaterial({ color: kit.skin, roughness: 0.68 });
    const hair = new MeshStandardMaterial({ color: kit.hair, roughness: 0.95 });
    const boot = new MeshStandardMaterial({ color: kit.boots ?? "#17191e", roughness: 0.45 });
    const trim = new MeshStandardMaterial({ color: TRIM, roughness: 0.5, metalness: 0.3 });
    const blob = new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.85 });
    return {
      cloth,
      skin,
      hair,
      boot,
      trim,
      blob,
      // broad at the shoulders, narrower at the waist
      torso: new CylinderGeometry(0.198, 0.152, 0.46, 20),
      collar: new TorusGeometry(0.056, 0.011, 8, 20),
      pelvis: new CapsuleGeometry(0.125, 0.1, 4, 14),
      thigh: new CapsuleGeometry(0.074, 0.3, 4, 12),
      shortLeg: new CylinderGeometry(0.094, 0.1, 0.2, 14, 1, true),
      shin: new CapsuleGeometry(0.054, 0.3, 4, 12),
      upperArm: new CapsuleGeometry(0.05, 0.2, 4, 10),
      sleeve: new CylinderGeometry(0.06, 0.066, 0.16, 12, 1, true),
      foreArm: new CapsuleGeometry(0.043, 0.2, 4, 10),
      ball: new SphereGeometry(1, 20, 14),
      // half a sphere: hair on top, or turned over for a beard
      cap: new SphereGeometry(1, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5),
      neck: new CylinderGeometry(0.045, 0.052, 0.09, 12),
    };
  }, [kit.skin, kit.hair, kit.boots]);

  const print = useMemo(() => (family ? backPrint(family, kit.name, kit.number) : null), [family, kit.name, kit.number]);

  useEffect(() => {
    return () => {
      for (const value of Object.values(parts)) (value as { dispose: () => void }).dispose();
      parts.blob.map?.dispose();
    };
  }, [parts]);
  useEffect(() => () => print?.dispose(), [print]);

  useImperativeHandle(ref, () => ({
    get group() {
      return root.current as Group;
    },
    setPose(pose: Pose) {
      if (!hips.current || !torso.current || !head.current) return;
      hips.current.position.y = HIP + pose.lift;
      torso.current.rotation.set(pose.lean, pose.twist, 0);
      head.current.rotation.x = pose.head;
      shoulderL.current?.rotation.set(-pose.armL.swing, 0, pose.armL.spread);
      shoulderR.current?.rotation.set(-pose.armR.swing, 0, -pose.armR.spread);
      if (rollL.current) rollL.current.rotation.y = -(pose.armL.roll ?? 0);
      if (rollR.current) rollR.current.rotation.y = pose.armR.roll ?? 0;
      if (elbowL.current) elbowL.current.rotation.x = -pose.armL.bend;
      if (elbowR.current) elbowR.current.rotation.x = -pose.armR.bend;
      hipL.current?.rotation.set(-pose.legL.swing, 0, pose.legL.spread);
      hipR.current?.rotation.set(-pose.legR.swing, 0, -pose.legR.spread);
      if (kneeL.current) kneeL.current.rotation.x = pose.legL.bend;
      if (kneeR.current) kneeR.current.rotation.x = pose.legR.bend;
    },
  }));

  const arm = (side: 1 | -1, shoulder: typeof shoulderL, roll: typeof rollL, elbow: typeof elbowL) => (
    <group ref={shoulder} position={[side * 0.222, 0.485, 0]}>
      <group ref={roll}>
        <mesh geometry={parts.upperArm} material={parts.skin} position={[0, -0.15, 0]} castShadow />
        <mesh geometry={parts.sleeve} material={parts.cloth} position={[0, -0.085, 0]} castShadow />
        <mesh geometry={parts.ball} material={parts.cloth} position={[0, -0.005, 0]} scale={0.068} />
        <group ref={elbow} position={[0, -0.3, 0]}>
          <mesh geometry={parts.foreArm} material={parts.skin} position={[0, -0.13, 0]} castShadow />
          <mesh geometry={parts.ball} material={parts.skin} position={[0, -0.29, 0]} scale={[0.042, 0.052, 0.036]} />
        </group>
      </group>
    </group>
  );

  const leg = (side: 1 | -1, hip: typeof hipL, knee: typeof kneeL) => (
    <group ref={hip} position={[side * 0.095, -0.02, 0]}>
      <mesh geometry={parts.thigh} material={parts.skin} position={[0, -0.225, 0]} castShadow />
      <mesh geometry={parts.shortLeg} material={parts.cloth} position={[0, -0.1, 0]} castShadow />
      <group ref={knee} position={[0, -0.45, 0]}>
        {/* sock to the knee, a gold band at its top, then the boot */}
        <mesh geometry={parts.shin} material={parts.cloth} position={[0, -0.21, 0]} castShadow />
        <mesh geometry={parts.sleeve} material={parts.trim} position={[0, -0.07, 0]} scale={[0.98, 0.14, 0.98]} />
        <mesh geometry={parts.ball} material={parts.boot} position={[0, -0.44, 0.045]} scale={[0.052, 0.045, 0.125]} castShadow />
      </group>
    </group>
  );

  return (
    <group ref={root}>
      {shadow && (
        <mesh material={parts.blob} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} renderOrder={2}>
          <planeGeometry args={[2.6, 2.6]} />
        </mesh>
      )}
      <group ref={hips} position={[0, HIP, 0]}>
        {/* shorts */}
        <mesh geometry={parts.pelvis} material={parts.cloth} position={[0, -0.03, 0]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.9]} castShadow />
        {leg(1, hipL, kneeL)}
        {leg(-1, hipR, kneeR)}

        <group ref={torso} position={[0, 0.02, 0]}>
          <mesh geometry={parts.torso} material={parts.cloth} position={[0, 0.27, 0]} scale={[1, 1, 0.6]} castShadow />
          {/* rounded shoulders, and a gold collar */}
          <mesh geometry={parts.ball} material={parts.cloth} position={[0, 0.492, 0]} scale={[0.2, 0.072, 0.12]} castShadow />
          <mesh geometry={parts.collar} material={parts.trim} position={[0, 0.558, 0]} rotation={[Math.PI / 2, 0, 0]} />
          {print && (
            <mesh position={[0, 0.29, -0.118]} rotation={[0.03, Math.PI, 0]}>
              <planeGeometry args={[0.3, 0.34]} />
              <meshStandardMaterial map={print} transparent alphaTest={0.3} roughness={0.8} side={DoubleSide} forceSinglePass />
            </mesh>
          )}
          <mesh geometry={parts.neck} material={parts.skin} position={[0, 0.6, 0]} />
          <group ref={head} position={[0, 0.63, 0]}>
            <mesh geometry={parts.ball} material={parts.skin} position={[0, 0.11, 0.004]} scale={[0.094, 0.116, 0.104]} castShadow />
            {/* hair: tipped back so the forehead shows */}
            <mesh geometry={parts.cap} material={parts.hair} position={[0, 0.132, -0.012]} rotation={[-0.42, 0, 0]} scale={kit.hairStyle === "medium" ? [0.104, 0.112, 0.116] : kit.hairStyle === "fade" ? [0.097, 0.108, 0.106] : [0.096, 0.098, 0.105]} />
            {/* a short beard along the jaw */}
            {kit.beard && <mesh geometry={parts.cap} material={parts.hair} position={[0, 0.082, 0.012]} rotation={[Math.PI + 0.5, 0, 0]} scale={[0.09, 0.078, 0.096]} />}
          </group>
          {arm(1, shoulderL, rollL, elbowL)}
          {arm(-1, shoulderR, rollR, elbowR)}
        </group>
      </group>
    </group>
  );
});

export default Player;
