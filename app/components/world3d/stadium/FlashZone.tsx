"use client";

import { useEffect, useMemo } from "react";
import { contactText, profile } from "../../../data/portfolio";
import { Box, CREAM, GOLD, NAVY, ROYAL, Sign, TvCamera } from "../rooms/common";
import { canvasTexture } from "../textures/canvas";
import { useDisplayFont } from "../textures/text";
import { FLASH } from "./dims";

// ------------------------------------------------------------------
// The flash interview (Contact): on the grass by the tunnel, where a
// player stops to talk on his way off. A backdrop board, the
// broadcasters' microphones on stands, a camera and a light facing it,
// and two boards on the grass with how to reach me.
//
// Where it stands is FLASH in dims.ts; number 8's spot in front of it
// is in players/Cast.tsx (REST.contact), the camera's in spots.ts.
// ------------------------------------------------------------------

// The backdrop's repeating pattern: my initials and the word "Contact"
function backdropTexture(family: string | null) {
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
        ctx.font = even ? `800 54px ${family}` : `700 24px ${family}`;
        ctx.fillText(even ? "RS" : contactText.zone.backdrop.toUpperCase(), col * cell + cell / 2, row * cell + cell / 2 + 2);
      }
    }
  });
}

// A broadcaster's microphone on a stand, leaning toward the player,
// with a coloured cube on it (no names)
function MicStand({ x, z, flag, lean }: { x: number; z: number; flag: string; lean: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, lean, 0]}>
      {/* three feet and the pole */}
      {[0, 2.1, 4.2].map((a) => (
        <Box key={a} size={[0.02, 0.02, 0.28]} position={[Math.sin(a) * 0.12, 0.02, Math.cos(a) * 0.12]} rotation={[0, a, 0]} color="#1c1f25" metalness={0.6} roughness={0.4} />
      ))}
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.009, 0.009, 1.44, 6]} />
        <meshStandardMaterial color="#2b2e35" metalness={0.7} roughness={0.4} />
      </mesh>
      <group position={[0, 1.45, -0.08]} rotation={[-1.15, 0, 0]}>
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

// A board on an easel on the grass: what it is, and the address
function InfoBoard({ x, z, turn, title, value }: { x: number; z: number; turn: number; title: string; value: string }) {
  return (
    <group position={[x, 0, z]} rotation={[0, turn, 0]}>
      {[-0.55, 0.55].map((s) => (
        <Box key={s} size={[0.04, 1.1, 0.04]} position={[s, 0.55, -0.05]} rotation={[0.12, 0, 0]} color="#16181d" metalness={0.5} roughness={0.4} />
      ))}
      <Sign
        lines={[
          { text: title.toUpperCase(), size: 0.3, color: GOLD, weight: 700, spacing: 0.3 },
          { text: value, size: 0.3, color: "#ffffff", weight: 600, spacing: 0.02 },
        ]}
        width={1.5}
        height={0.5}
        position={[0, 1.0, 0.0]}
        rotation={[-0.12, 0, 0]}
        background="#0b1530"
        border={GOLD}
        glow={1.2}
      />
    </group>
  );
}

export default function FlashZone() {
  const family = useDisplayFont();
  const pattern = useMemo(() => {
    const texture = backdropTexture(family);
    texture.repeat.set(FLASH.width / 2.2, FLASH.height / 1.1);
    return texture;
  }, [family]);
  useEffect(() => () => pattern.dispose(), [pattern]);

  return (
    <group position={[FLASH.x, 0, FLASH.z]}>
      {/* the backdrop, facing the pitch, on two weighted feet */}
      <Box size={[FLASH.width + 0.1, FLASH.height + 0.1, 0.08]} position={[0, FLASH.height / 2 + 0.1, -0.05]} color="#0c0d11" metalness={0.4} roughness={0.5} />
      <mesh position={[0, FLASH.height / 2 + 0.1, 0]}>
        <planeGeometry args={[FLASH.width, FLASH.height]} />
        <meshStandardMaterial map={pattern} roughness={0.55} />
      </mesh>
      {[-FLASH.width / 2, FLASH.width / 2].map((x) => (
        <Box key={x} size={[0.1, 0.08, 0.9]} position={[x, 0.04, 0]} color="#16181d" />
      ))}

      {/* the microphones, a step in front of where he stands */}
      <MicStand x={-0.42} z={2.25} flag={ROYAL} lean={0.25} />
      <MicStand x={0.0} z={2.35} flag={GOLD} lean={0} />
      <MicStand x={0.42} z={2.25} flag="#7a1020" lean={-0.25} />

      {/* the camera and its light, out on the grass */}
      <TvCamera position={[2.4, 0, 4.9]} turn={0.45} />
      <group position={[-2.3, 0, 4.4]} rotation={[0, -0.45, 0]}>
        <mesh position={[0, 0.95, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.9, 8]} />
          <meshStandardMaterial color="#2b2e35" metalness={0.7} roughness={0.4} />
        </mesh>
        <Box size={[0.5, 0.34, 0.06]} position={[0, 1.95, 0]} rotation={[0.15, 0, 0]} color="#16181d" />
        <mesh position={[0, 1.95, -0.035]} rotation={[0.15, Math.PI, 0]}>
          <planeGeometry args={[0.44, 0.28]} />
          <meshBasicMaterial color={[3, 2.9, 2.6]} toneMapped={false} />
        </mesh>
      </group>

      {/* how to reach me, either side */}
      <InfoBoard x={-FLASH.width / 2 - 0.55} z={1.5} turn={0.45} title={contactText.zone.email} value={profile.email} />
      <InfoBoard x={FLASH.width / 2 + 0.55} z={1.5} turn={-0.45} title={contactText.zone.linkedin} value={profile.linkedinHandle} />
    </group>
  );
}
