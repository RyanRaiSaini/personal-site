"use client";

import { profile } from "../../../data/portfolio";
import { Box, CREAM, Glow, GOLD, NAVY, ROYAL, Shell, Sign } from "./common";

// The ticket office (Résumé). Two lit windows in the concourse wall
// and, between them, the cover of today's matchday programme: my
// résumé.

function Window({ x }: { x: number }) {
  return (
    <group position={[x, 0, -4.4]}>
      {/* the booth: a warm room behind glass */}
      <Box size={[2.2, 1.5, 0.1]} position={[0, 1.85, -0.5]} color="#f1cf96" emissive="#f1b765" emissiveIntensity={1.1} roughness={0.9} />
      <Box size={[2.2, 1.5, 0.02]} position={[0, 1.85, 0.02]} color="#cfe2ff" opacity={0.14} roughness={0.03} metalness={0.4} />
      {/* frame */}
      <Box size={[2.4, 0.1, 0.16]} position={[0, 2.65, 0.02]} color="#1a1c22" metalness={0.6} roughness={0.4} />
      <Box size={[0.1, 1.6, 0.16]} position={[-1.15, 1.85, 0.02]} color="#1a1c22" metalness={0.6} roughness={0.4} />
      <Box size={[0.1, 1.6, 0.16]} position={[1.15, 1.85, 0.02]} color="#1a1c22" metalness={0.6} roughness={0.4} />
      {/* counter and the slot tickets come through */}
      <Box size={[2.5, 0.08, 0.5]} position={[0, 1.08, 0.18]} color="#d7dbe2" metalness={0.8} roughness={0.25} />
      <Box size={[2.4, 1.05, 0.12]} position={[0, 0.53, 0.02]} color={NAVY} roughness={0.6} />
      <Box size={[0.5, 0.05, 0.02]} position={[0, 1.2, 0.04]} color="#08090c" />
      {/* a silhouette of the clerk */}
      <Box size={[0.42, 0.5, 0.06]} position={[0.2, 1.52, -0.3]} color="#3a2d1c" roughness={1} />
      <mesh position={[0.2, 1.92, -0.3]}>
        <sphereGeometry args={[0.13, 16, 12]} />
        <meshStandardMaterial color="#3a2d1c" roughness={1} />
      </mesh>
    </group>
  );
}

// A post and belt of the queue barrier
function Barrier({ x, z, length }: { x: number; z: number; length: number }) {
  return (
    <group position={[x, 0, z]}>
      {[0, length].map((offset) => (
        <group key={offset} position={[0, 0, offset]}>
          <mesh position={[0, 0.5, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 1, 12]} />
            <meshStandardMaterial color="#d7dbe2" metalness={0.9} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.16, 0.18, 0.04, 20]} />
            <meshStandardMaterial color="#2a2d35" metalness={0.6} roughness={0.4} />
          </mesh>
        </group>
      ))}
      <Box size={[0.012, 0.06, length]} position={[0, 0.93, length / 2]} color={ROYAL} roughness={0.8} />
    </group>
  );
}

export default function TicketOffice() {
  return (
    <group>
      <ambientLight intensity={0.5} color="#e6ecff" />
      <pointLight position={[0, 3.2, 1]} intensity={26} distance={14} decay={1.5} color="#fff3e0" />
      <pointLight position={[0, 2.2, -3]} intensity={12} distance={8} decay={1.7} color="#ffd79a" />

      <Shell width={13} depth={12} back={4.5} height={3.8} floor="#3a3d44" wall="#2b2f38" ceiling="#101216" floorRoughness={0.35} floorMetalness={0.1} />

      {/* the wall band and the lit sign over the windows */}
      <Box size={[13, 0.9, 0.06]} position={[0, 3.25, -4.44]} color={NAVY} roughness={0.6} />
      <Glow size={[13, 0.03, 0.02]} position={[0, 2.8, -4.4]} color={[1.6, 1.3, 0.6]} />
      <Sign lines={[{ text: "TICKETS  ·  TAQUILLAS", size: 1, color: "#ffffff", spacing: 0.3 }]} width={5.6} height={0.42} position={[0, 3.27, -4.39]} background={null} glow={1.7} />

      <Window x={-3.9} />
      <Window x={3.9} />

      {/* the programme cover, in a lit frame between the windows */}
      <group position={[0, 1.75, -4.38]}>
        <Box size={[2.3, 3.0, 0.08]} position={[0, 0, 0]} color="#0c0d11" metalness={0.5} roughness={0.4} />
        <Sign
          lines={[
            { text: "OFFICIAL MATCHDAY PROGRAMME", size: 0.07, color: GOLD, weight: 600, spacing: 0.3 },
            { text: " ", size: 0.04 },
            { text: profile.firstName.toUpperCase(), size: 0.2, color: CREAM, weight: 800 },
            { text: "SAINI", size: 0.26, color: CREAM, weight: 800 },
            { text: `NUMBER ${profile.shirtNumber}`, size: 0.08, color: GOLD, weight: 700, spacing: 0.35 },
            { text: " ", size: 0.05 },
            { text: "THE RÉSUMÉ ISSUE", size: 0.1, color: "#ffffff", weight: 700, spacing: 0.2 },
            { text: "MATHEMATICS · AI · SOFTWARE", size: 0.06, color: "#9db8ff", weight: 600, spacing: 0.2 },
            { text: "FREE  ·  TAKE ONE", size: 0.06, color: GOLD, weight: 600, spacing: 0.3 },
          ]}
          width={2.1}
          height={2.8}
          position={[0, 0, 0.05]}
          background={ROYAL}
          border={GOLD}
          glow={1.15}
        />
        <Glow size={[1.6, 0.04, 0.08]} position={[0, 1.62, 0.2]} color={[2.4, 2.1, 1.5]} />
      </group>

      {/* a rack of programmes */}
      <group position={[1.9, 0, -2.6]} rotation={[0, -0.35, 0]}>
        <Box size={[0.9, 1.1, 0.4]} position={[0, 0.55, 0]} color="#16181d" metalness={0.4} roughness={0.5} />
        {[0, 1, 2].map((row) => (
          <group key={row} position={[0, 0.42 + row * 0.3, 0.21]} rotation={[-0.35, 0, 0]}>
            {[-0.27, 0, 0.27].map((x) => (
              <Box key={x} size={[0.22, 0.28, 0.02]} position={[x, 0.1, 0]} color={ROYAL} roughness={0.5} emissive={ROYAL} emissiveIntensity={0.25} />
            ))}
          </group>
        ))}
        <Sign lines={[{ text: "PROGRAMMES", size: 1, color: GOLD, spacing: 0.2 }]} width={0.8} height={0.12} position={[0, 1.2, 0.02]} background="#16181d" />
      </group>

      {/* queue barriers */}
      <Barrier x={-2.6} z={-2.2} length={3.4} />
      <Barrier x={-5.2} z={-2.2} length={3.4} />
      <Barrier x={5.2} z={-2.2} length={3.4} />

      {/* floor line leading to the windows */}
      <Box size={[0.12, 0.004, 9]} position={[0, 0.003, 0.4]} color={GOLD} roughness={0.5} />
    </group>
  );
}
