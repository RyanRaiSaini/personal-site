"use client";

import { useEffect, useMemo } from "react";
import { profile } from "../../../data/portfolio";
import { canvasTexture } from "../textures/canvas";
import { useDisplayFont } from "../textures/text";
import { Box, CREAM, Glow, GOLD, NAVY, ROYAL, Shell, Sign, TvCamera } from "./common";

// The mixed zone (Contact): the corridor where players stop to talk to
// reporters on the way out. An interview board, a crowd barrier with
// the broadcasters' microphones clamped to it, and a camera rolling.

function boardTexture(family: string | null) {
  return canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = NAVY;
    ctx.fillRect(0, 0, w, h);
    if (!family) return;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const cell = 128;
    for (let row = 0; row < h / cell; row++) {
      for (let col = 0; col < w / cell; col++) {
        const even = (row + col) % 2 === 0;
        ctx.fillStyle = even ? GOLD : CREAM;
        ctx.font = even ? `800 54px ${family}` : `700 22px ${family}`;
        ctx.fillText(even ? "RS" : "CONTACT", col * cell + cell / 2, row * cell + cell / 2 + 2);
      }
    }
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    for (let x = 0; x <= w; x += cell) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
  });
}

// One section of metal crowd barrier
function Fence({ x, z }: { x: number; z: number }) {
  const metal = { color: "#c9ccd2", metalness: 0.9, roughness: 0.3 } as const;
  return (
    <group position={[x, 0, z]}>
      <Box size={[2.2, 0.04, 0.04]} position={[0, 1.05, 0]} {...metal} />
      <Box size={[2.2, 0.04, 0.04]} position={[0, 0.2, 0]} {...metal} />
      {Array.from({ length: 12 }, (_, i) => (
        <Box key={i} size={[0.02, 0.85, 0.02]} position={[-1.0 + i * 0.182, 0.62, 0]} {...metal} />
      ))}
      {[-1.1, 1.1].map((s) => (
        <group key={s}>
          <Box size={[0.05, 1.1, 0.05]} position={[s, 0.55, 0]} {...metal} />
          <Box size={[0.05, 0.03, 0.6]} position={[s, 0.015, 0]} {...metal} />
        </group>
      ))}
    </group>
  );
}

// A broadcaster's microphone clamped to the top rail of the barrier,
// leaning toward the player, with a coloured cube on it (no names)
function Mic({ x, flag, lean }: { x: number; flag: string; lean: number }) {
  return (
    <group position={[x, 1.07, 0.6]} rotation={[0, lean, 0]}>
      <Box size={[0.07, 0.05, 0.07]} position={[0, 0, 0]} color="#1c1f25" metalness={0.6} roughness={0.4} />
      <mesh position={[0, 0.12, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.22, 6]} />
        <meshStandardMaterial color="#2b2e35" metalness={0.7} roughness={0.4} />
      </mesh>
      <group position={[0, 0.25, -0.06]} rotation={[-1.05, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.018, 0.014, 0.2, 12]} />
          <meshStandardMaterial color="#17191e" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.13, 0]}>
          <sphereGeometry args={[0.034, 14, 10]} />
          <meshStandardMaterial color="#3a3d44" roughness={0.95} />
        </mesh>
        <Box size={[0.075, 0.075, 0.075]} position={[0, 0.03, 0]} color={flag} roughness={0.55} />
      </group>
    </group>
  );
}

export default function MixedZone() {
  const family = useDisplayFont();
  const board = useMemo(() => {
    const t = boardTexture(family);
    t.repeat.set(2.6, 1.4);
    return t;
  }, [family]);
  useEffect(() => () => board.dispose(), [board]);

  return (
    <group>
      <hemisphereLight intensity={0.55} color="#e6ecff" groundColor="#121a30" />
      <pointLight position={[0, 2.7, 0.5]} intensity={18} distance={13} decay={1.5} color="#ffffff" />
      <pointLight position={[-3, 2, 2.5]} intensity={9} distance={8} decay={1.7} color="#cfe0ff" />

      <Shell width={12} depth={12} back={4.5} height={3.5} floor="#0e1a38" wall="#1a1e27" ceiling="#0b0d11" floorRoughness={0.95} />

      {/* ceiling strip lights */}
      {[-2.4, 0.6, 3.6].map((z) => (
        <Glow key={z} size={[7, 0.02, 0.12]} position={[0, 3.48, z]} color={[0.7, 0.7, 0.75]} />
      ))}

      {/* the interview board */}
      <group position={[0, 0, -3.3]}>
        <Box size={[6.6, 2.7, 0.1]} position={[0, 1.4, -0.06]} color="#0c0d11" metalness={0.4} roughness={0.5} />
        <mesh position={[0, 1.4, 0]}>
          <planeGeometry args={[6.4, 2.5]} />
          <meshStandardMaterial map={board} roughness={0.5} emissive="#ffffff" emissiveMap={board} emissiveIntensity={0.18} />
        </mesh>
        {[-3.2, 3.2].map((x) => (
          <Box key={x} size={[0.08, 0.1, 0.9]} position={[x, 0.05, 0]} color="#16181d" />
        ))}
      </group>

      <Sign lines={[{ text: "MIXED ZONE", size: 1, color: "#ffffff", spacing: 0.4 }]} width={3.2} height={0.3} position={[0, 3.2, -4.44]} background={null} glow={1.6} />
      <Glow size={[12, 0.03, 0.02]} position={[0, 2.95, -4.46]} color={[1.6, 1.3, 0.6]} />

      {/* how to reach me, on the side walls */}
      <Sign
        lines={[
          { text: "EMAIL", size: 0.32, color: GOLD, weight: 700, spacing: 0.3 },
          { text: profile.email, size: 0.3, color: "#ffffff", weight: 600, spacing: 0.02 },
        ]}
        width={3.6}
        height={0.9}
        position={[-5.96, 1.9, -0.6]}
        rotation={[0, Math.PI / 2, 0]}
        background="#0b1530"
        border={GOLD}
        glow={1.2}
      />
      <Sign
        lines={[
          { text: "LINKEDIN", size: 0.32, color: GOLD, weight: 700, spacing: 0.3 },
          { text: profile.linkedinHandle, size: 0.34, color: "#ffffff", weight: 600, spacing: 0.02 },
        ]}
        width={3.6}
        height={0.9}
        position={[5.96, 1.9, -0.6]}
        rotation={[0, -Math.PI / 2, 0]}
        background="#0b1530"
        border={GOLD}
        glow={1.2}
      />

      {/* the barrier between the player and the press, and their microphones */}
      <Fence x={-2.3} z={0.6} />
      <Fence x={0} z={0.6} />
      <Fence x={2.3} z={0.6} />
      <Mic x={-1.05} flag={ROYAL} lean={-0.35} />
      <Mic x={-0.4} flag={GOLD} lean={-0.12} />
      <Mic x={0.45} flag={CREAM} lean={0.1} />
      <Mic x={1.1} flag="#7a1020" lean={0.3} />
      {/* a camera behind the barrier, on the player */}
      <TvCamera position={[-1.3, 0, 1.95]} turn={-0.38} />

      {/* a camera light on a stand */}
      <group position={[3.4, 0, 2.3]}>
        <mesh position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.8, 8]} />
          <meshStandardMaterial color="#2b2e35" metalness={0.7} roughness={0.4} />
        </mesh>
        <Box size={[0.5, 0.34, 0.06]} position={[0, 1.9, 0]} rotation={[0.2, -0.7, 0]} color="#16181d" />
        <Glow size={[0.44, 0.28, 0.01]} position={[-0.02, 1.9, -0.035]} rotation={[0.2, -0.7, 0]} color={[3, 2.9, 2.6]} />
      </group>
    </group>
  );
}
