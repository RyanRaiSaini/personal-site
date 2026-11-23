"use client";

import { profile, resumeText } from "../../../data/portfolio";
import { headshot } from "../../../data/photos";
import Person from "./Person";
import { Box, Glow, GOLD, NAVY, ROYAL, Shell, Sign, usePhoto } from "./common";
import { useSurface } from "./surfaces";

// The ticket office (Résumé). Two lit windows in the concourse wall
// and, between them, my résumé itself, framed: a picture of its first
// page (public/resume/resume-page.webp, made by `npm run resume:image`).
// Beside it, a framed player profile with my photo and a board of
// numbers from the résumé; the colours of the club shop on the right
// wall; club-blue walls with a navy band, a lit ceiling, and gold
// markings on the floor leading to each window.

// the résumé picture's shape, width by height (scripts/resume-image.mjs)
const PAGE_SHAPE = 1200 / 1687;

// The person serving at a window: one of the crowd's people, seated on a
// stool behind the counter, in the club's navy staff polo (Person.tsx)
function Clerk({ which }: { which: 0 | 1 }) {
  return <Person look={{ man: which, shirt: NAVY, skin: which ? 0.55 : 0.2 }} position={[which ? 0.25 : -0.25, 0, -0.035]} lift={0.68} mirrored={which === 1} />;
}

function Window({ x, clerk }: { x: number; clerk: 0 | 1 }) {
  return (
    <group position={[x, 0, -4.4]}>
      <Clerk which={clerk} />
      {/* the booth: a warm room behind glass (kept in front of the wall, or the wall hides it) */}
      <Box size={[2.2, 1.5, 0.02]} position={[0, 1.85, -0.06]} color="#f1cf96" emissive="#f4b864" emissiveIntensity={0.9} roughness={0.9} />
      <Box size={[2.2, 0.3, 0.02]} position={[0, 2.45, -0.05]} color="#2a2f3a" roughness={0.7} />
      <Box size={[2.2, 1.5, 0.01]} position={[0, 1.85, 0.03]} color="#dfe9f7" opacity={0.07} roughness={0.15} metalness={0} />
      {/* frame */}
      <Box size={[2.4, 0.1, 0.16]} position={[0, 2.65, 0.02]} color="#1a1c22" metalness={0.6} roughness={0.4} />
      <Box size={[0.1, 1.6, 0.16]} position={[-1.15, 1.85, 0.02]} color="#1a1c22" metalness={0.6} roughness={0.4} />
      <Box size={[0.1, 1.6, 0.16]} position={[1.15, 1.85, 0.02]} color="#1a1c22" metalness={0.6} roughness={0.4} />
      {/* counter and the slot tickets come through */}
      <Box size={[2.5, 0.08, 0.5]} position={[0, 1.08, 0.18]} color="#d7dbe2" metalness={0.8} roughness={0.25} />
      <Box size={[2.4, 1.05, 0.12]} position={[0, 0.53, 0.02]} color={NAVY} roughness={0.6} />
      <Box size={[0.5, 0.05, 0.02]} position={[0, 1.2, 0.04]} color="#08090c" />
      {/* a lit sign in the window: open */}
      <Sign lines={[{ text: resumeText.windowSign.toUpperCase(), size: 1, color: "#7dffb0", weight: 800, spacing: 0.3 }]} width={0.62} height={0.2} position={[0.62, 2.4, -0.03]} background="#06140c" border="#2a7a4a" glow={1.6} />
    </group>
  );
}

// The matchday board, hung from the ceiling on two rods
function FixtureBoard() {
  const text = resumeText.board;
  return (
    <group position={[0, 3.38, -1.0]}>
      {[-1.7, 1.7].map((x) => (
        <Box key={x} size={[0.025, 0.5, 0.025]} position={[x, 0.6, 0]} color="#1a1c22" metalness={0.7} roughness={0.35} />
      ))}
      <Box size={[4.3, 0.78, 0.12]} position={[0, 0, -0.07]} color="#0a0c11" metalness={0.4} roughness={0.4} />
      <Sign
        lines={[
          { text: text.heading.toUpperCase(), size: 0.2, color: GOLD, weight: 700, spacing: 0.3 },
          { text: `${profile.shortName.toUpperCase()}  ·  ${text.fixture.toUpperCase()}`, size: 0.34, color: "#ffffff", weight: 800, spacing: 0.08 },
          { text: text.gate.toUpperCase(), size: 0.2, color: "#9db8ff", weight: 600, spacing: 0.2 },
        ]}
        width={4.16}
        height={0.66}
        position={[0, 0, 0.0]}
        background="#070a14"
        border={GOLD}
        glow={1.2}
      />
    </group>
  );
}

// A lamp on a cord, its shade lit from underneath
function Pendant({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 3.45, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.7, 6]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 3.0, 0]}>
        <cylinderGeometry args={[0.06, 0.26, 0.24, 24, 1, true]} />
        <meshStandardMaterial color="#1a2a5c" metalness={0.5} roughness={0.35} side={2} />
      </mesh>
      <Glow size={[0.3, 0.005, 0.3]} position={[0, 2.9, 0]} rotation={[0, Math.PI / 4, 0]} color={[2.2, 1.9, 1.4]} />
    </group>
  );
}

// My photo in a frame, with a plate: the player profile
function Profile({ x }: { x: number }) {
  const photo = usePhoto(headshot.thumb);
  const wide = 1.0;
  const tall = (wide * headshot.height) / headshot.width;
  return (
    <group position={[x, 1.72, -4.38]}>
      <Box size={[wide + 0.16, tall + 0.5, 0.06]} position={[0, -0.17, 0]} color="#0c0d11" metalness={0.5} roughness={0.4} />
      <Box size={[wide + 0.08, tall + 0.08, 0.065]} position={[0, 0, 0.002]} color={GOLD} metalness={0.8} roughness={0.35} />
      <mesh position={[0, 0, 0.04]}>
        <planeGeometry args={[wide, tall]} />
        {photo ? <meshBasicMaterial map={photo} toneMapped={false} color={[0.95, 0.95, 0.95]} /> : <meshStandardMaterial color="#20242c" />}
      </mesh>
      <Sign
        lines={[
          { text: resumeText.profileTitle.toUpperCase(), size: 0.36, color: GOLD, weight: 700, spacing: 0.25 },
          { text: profile.name.toUpperCase(), size: 0.46, color: "#ffffff", weight: 800, spacing: 0.06 },
        ]}
        width={wide + 0.1}
        height={0.3}
        position={[0, -tall / 2 - 0.23, 0.04]}
        background={null}
      />
    </group>
  );
}

// A board of numbers from the résumé, lit like a stadium screen
function Stats({ x }: { x: number }) {
  const stats = resumeText.stats;
  return (
    <group position={[x, 1.62, -4.38]}>
      <Box size={[1.1, 2.1, 0.06]} position={[0, 0, -0.02]} color="#0c0d11" metalness={0.5} roughness={0.4} />
      <Sign
        lines={[
          { text: stats.title.toUpperCase(), size: 0.085, color: GOLD, weight: 800, spacing: 0.2 },
          { text: " ", size: 0.04 },
          ...stats.items.flatMap((item, i) => [
            ...(i ? [{ text: " ", size: 0.035 }] : []),
            { text: item.value, size: 0.12, color: "#ffffff", weight: 800 },
            { text: item.label.toUpperCase(), size: 0.045, color: "#9db8ff", weight: 600, spacing: 0.12 },
          ]),
        ]}
        width={1.0}
        height={2.0}
        position={[0, 0, 0.02]}
        background="#07102a"
        border={GOLD}
        glow={1.05}
      />
    </group>
  );
}

// My résumé, framed behind glass: the first page, as printed
function ResumeOnWall() {
  const page = usePhoto("/resume/resume-page.webp");
  const tall = 2.34;
  const wide = tall * PAGE_SHAPE;
  return (
    <group position={[0, 1.5, -4.38]}>
      {/* a black frame with a white mount, as a print is framed */}
      <Box size={[wide + 0.22, tall + 0.12, 0.07]} position={[0, 0, 0]} color="#0c0d11" metalness={0.5} roughness={0.4} />
      <Box size={[wide + 0.12, tall + 0.04, 0.072]} position={[0, 0, 0.001]} color={GOLD} metalness={0.8} roughness={0.35} />
      <Box size={[wide + 0.08, tall, 0.074]} position={[0, 0, 0.002]} color="#f4f2ec" roughness={0.9} />
      <mesh position={[0, 0, 0.041]}>
        <planeGeometry args={[wide, tall - 0.04]} />
        {/* keyed, so the paper is a new material once the picture arrives: one
            that is only given a map later keeps the shader it was built without */}
        {page ? <meshBasicMaterial key="page" map={page} toneMapped={false} color={[0.9, 0.9, 0.88]} /> : <meshStandardMaterial key="blank" color="#f4f2ec" roughness={0.9} />}
      </mesh>
    </group>
  );
}

// A rail of scarves on a wall, the colours of the club shop
function Scarves({ position, rotation }: { position: [number, number, number]; rotation: [number, number, number] }) {
  const colours: [string, string][] = [
    [ROYAL, GOLD],
    ["#f2f2ee", NAVY],
    [GOLD, NAVY],
    ["#7a1020", GOLD],
    [NAVY, "#f2f2ee"],
    ["#f2f2ee", ROYAL],
    [ROYAL, "#f2f2ee"],
    [GOLD, "#7a1020"],
  ];
  const gap = 0.36;
  return (
    <group position={position} rotation={rotation}>
      <Box size={[colours.length * gap + 0.3, 0.035, 0.035]} position={[0, 2.25, 0.08]} color="#c9ccd2" metalness={0.85} roughness={0.3} />
      <Sign lines={[{ text: "CLUB SHOP", size: 1, color: GOLD, spacing: 0.3 }]} width={1.8} height={0.2} position={[0, 2.55, 0.02]} background={null} glow={1.3} />
      {colours.map(([main, band], i) => {
        const x = (i - (colours.length - 1) / 2) * gap;
        const sway = ((i * 37) % 5) * 0.02 - 0.04;
        return (
          <group key={i} position={[x, 2.25, 0.09]} rotation={[0, 0, sway]}>
            <Box size={[0.24, 1.3, 0.025]} position={[0, -0.65, 0]} color={main} roughness={0.9} />
            {[-0.25, -0.95].map((y) => (
              <Box key={y} size={[0.24, 0.12, 0.028]} position={[0, y, 0]} color={band} roughness={0.9} />
            ))}
            <Box size={[0.2, 0.08, 0.02]} position={[0, -1.34, 0]} color={band} roughness={1} />
          </group>
        );
      })}
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
  // the carpet: a real woven surface (surfaces.ts) in navy
  const carpet = useSurface("fabric", { repeat: [6, 4], tint: "#1a2656", roughness: 1, bumps: 0.8 });
  return (
    <group>
      <hemisphereLight intensity={0.6} color="#eef2ff" groundColor="#1c1e24" />
      {/* lamps kept well below the ceiling, so they do not make a hot spot on it */}
      <pointLight position={[0, 2.7, 2]} intensity={16} distance={14} decay={1.5} color="#fff3e0" />
      <pointLight position={[0, 2.0, -2.6]} intensity={8} distance={7} decay={1.7} color="#ffd79a" />

      <Shell width={13} depth={12} back={4.5} height={3.8} floor="#3d414b" wall="#1c3c94" ceiling="#1a1e28" floorSurface={{ name: "concrete", tile: 4, tint: "#8f98a6", roughness: 0.4, grey: true }} />
      {/* panels of light in the ceiling, as down a concourse */}
      {[-3.9, 0, 3.9].map((x) => [-2.4, 1.2, 4.6].map((z) => <Glow key={`${x}${z}`} size={[1.6, 0.02, 0.5]} position={[x, 3.78, z]} color={[0.72, 0.7, 0.66]} />))}

      {/* the wall band and the lit sign over the windows */}
      <Box size={[13, 0.9, 0.06]} position={[0, 3.25, -4.44]} color={NAVY} roughness={0.6} />
      <Glow size={[13, 0.03, 0.02]} position={[0, 2.8, -4.4]} color={[1.6, 1.3, 0.6]} />
      <Sign lines={[{ text: resumeText.sign.toUpperCase(), size: 1, color: "#ffffff", spacing: 0.3 }]} width={4.6} height={0.42} position={[0, 3.27, -4.39]} background={null} glow={1.7} />

      {/* a royal-blue band round the walls, topped with gold */}
      <Box size={[13, 1.0, 0.02]} position={[0, 0.5, -4.47]} color={NAVY} roughness={0.7} />
      <Glow size={[13, 0.025, 0.02]} position={[0, 1.01, -4.46]} color={[1.4, 1.15, 0.55]} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Box size={[0.02, 1.0, 12]} position={[side * 6.48, 0.5, 1.5]} color={NAVY} roughness={0.7} />
          <Glow size={[0.02, 0.025, 12]} position={[side * 6.47, 1.01, 1.5]} color={[1.4, 1.15, 0.55]} />
        </group>
      ))}
      {/* carpet under the queues, edged in gold */}
      {[-3.9, 3.9].map((x) => (
        <group key={x}>
          <Box size={[3.2, 0.012, 4.6]} position={[x, 0.006, -0.6]} material={carpet} />
          {[-1, 1].map((side) => (
            <Box key={side} size={[0.05, 0.014, 4.6]} position={[x + side * 1.6, 0.007, -0.6]} color="#8a6d2a" roughness={0.6} />
          ))}
        </group>
      ))}

      <Window x={-3.9} clerk={0} />
      <Window x={3.9} clerk={1} />
      <Stats x={-1.82} />
      <Profile x={1.82} />
      <Scarves position={[6.42, 0, -0.2]} rotation={[0, -Math.PI / 2, 0]} />
      {/* gold markings on the floor, one to each window */}
      {[-3.9, 3.9].map((x) => (
        <Sign key={x} lines={[{ text: "GATE A  \u25B2", size: 1, color: GOLD, weight: 800, spacing: 0.25 }]} width={2.2} height={0.42} position={[x, 0.016, 0.9]} rotation={[-Math.PI / 2, 0, 0]} background={null} />
      ))}
      <Pendant x={-3.9} z={-3.1} />
      <Pendant x={3.9} z={-3.1} />
      <FixtureBoard />

      {/* my résumé, framed between the windows; its top stays below the
          line of light, clear of the sign */}
      <ResumeOnWall />

      {/* a rack of programmes */}
      <group position={[-5.6, 0, -2.4]} rotation={[0, 0.7, 0]}>
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

      {/* a brass inlay in the floor, leading to the windows */}
      <Box size={[0.06, 0.004, 9]} position={[0, 0.003, 0.4]} color="#5a4824" metalness={0.15} roughness={0.7} />
    </group>
  );
}
