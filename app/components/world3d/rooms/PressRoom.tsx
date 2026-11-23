"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { type Group } from "three";
import { news, profile } from "../../../data/portfolio";
import { album } from "../../../data/photos";
import { useWorld } from "../../../lib/store";
import { atmo } from "../atmosphere/state";
import { canvasTexture } from "../textures/canvas";
import { useDisplayFont } from "../textures/text";
import { Box, clickable, CREAM, Glow, GOLD, NAVY, ROYAL, Shell, Sign, Tripod, TvCamera, usePhoto } from "./common";
import { POSE } from "./clerk";
import Person from "./Person";

// The press room (In the News). A press-conference desk in front of a
// sponsor-style backdrop, lit like a set by two studio lights, with two
// television cameras behind the rows of chairs. My All-Star photos are
// framed on the wall and a television shows the NBA film. Somebody left
// a basketball on the desk: click it.

// The wall behind the desk: a chequerboard of my initials and number
function backdropTexture(family: string | null) {
  return canvasTexture(512, 256, (ctx, w, h) => {
    const cell = 128;
    for (let row = 0; row < h / cell; row++) {
      for (let col = 0; col < w / cell; col++) {
        const dark = (row + col) % 2 === 0;
        ctx.fillStyle = dark ? ROYAL : "#f1f2f5";
        ctx.fillRect(col * cell, row * cell, cell, cell);
        if (!family) continue;
        ctx.fillStyle = dark ? "#f1f2f5" : ROYAL;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        if ((row * 2 + col) % 2 === 0) {
          ctx.font = `800 62px ${family}`;
          ctx.fillText("RS", col * cell + cell / 2, row * cell + cell / 2 + 3);
        } else {
          ctx.font = `700 25px ${family}`;
          ctx.fillText("RYAN SAINI", col * cell + cell / 2, row * cell + cell / 2 - 10);
          ctx.fillStyle = GOLD;
          ctx.font = `600 15px ${family}`;
          ctx.fillText("MATH · AI · SOFTWARE", col * cell + cell / 2, row * cell + cell / 2 + 18);
        }
      }
    }
  });
}

function basketballTexture() {
  return canvasTexture(
    256,
    128,
    (ctx, w, h) => {
      ctx.fillStyle = "#d9672a";
      ctx.fillRect(0, 0, w, h);
      // pebbled leather
      for (let i = 0; i < 1400; i++) {
        ctx.fillStyle = i % 2 ? "rgba(0,0,0,0.07)" : "rgba(255,255,255,0.05)";
        ctx.fillRect((i * 53) % w, (i * 97) % h, 2, 2);
      }
      ctx.strokeStyle = "#1b120c";
      ctx.lineWidth = 3;
      // the seams
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      for (const x of [0, w / 2, w]) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
      }
      ctx.stroke();
      for (const x of [w / 4, (3 * w) / 4]) {
        ctx.beginPath();
        ctx.ellipse(x, h / 2, w / 9, h / 2.1, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
    { repeat: false },
  );
}


// A framed photo with a picture light over it. Clicking opens the album.
function Frame({ src, width, height, position, rotation }: { src: string; width: number; height: number; position: [number, number, number]; rotation: [number, number, number] }) {
  const photo = usePhoto(src);
  const open = () => useWorld.getState().select("story", 1);
  return (
    <group position={position} rotation={rotation}>
      <Box size={[width + 0.14, height + 0.14, 0.05]} position={[0, 0, 0]} color="#16130e" roughness={0.4} metalness={0.2} />
      <Box size={[width + 0.05, height + 0.05, 0.052]} position={[0, 0, 0.002]} color={CREAM} roughness={0.9} />
      <mesh position={[0, 0, 0.032]} onClick={open} {...clickable}>
        <planeGeometry args={[width, height]} />
        {photo ? <meshBasicMaterial map={photo} toneMapped={false} color={[0.92, 0.92, 0.92]} /> : <meshStandardMaterial color="#20242c" />}
      </mesh>
      <Glow size={[width * 0.7, 0.03, 0.06]} position={[0, height / 2 + 0.16, 0.14]} color={[2.2, 1.9, 1.3]} />
    </group>
  );
}

// A softbox on a stand, turned toward the desk, with a warm lamp in it
function StudioLight({ position, turn }: { position: [number, number, number]; turn: number }) {
  return (
    <group position={position} rotation={[0, turn, 0]}>
      <Tripod height={0.7} spread={0.45} />
      <mesh position={[0, 1.15, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 1.0, 8]} />
        <meshStandardMaterial color="#1c1f25" metalness={0.7} roughness={0.35} />
      </mesh>
      <group position={[0, 1.85, 0]} rotation={[0.18, 0, 0]}>
        {/* the box, its face toward -Z, and the diffuser glowing */}
        <Box size={[0.78, 0.56, 0.34]} position={[0, 0, 0.12]} color="#121418" roughness={0.6} />
        <Glow size={[0.7, 0.48, 0.01]} position={[0, 0, -0.06]} color={[2.0, 1.85, 1.6]} />
      </group>
      <pointLight position={[0, 1.8, -0.5]} intensity={6} distance={6} decay={1.6} color="#ffe7c7" />
    </group>
  );
}

// A lighting bar hung from the ceiling in front of the stage, its lamps
// aimed down at the desk
function LightingRig() {
  const lamps = [-2.6, -1.3, 0, 1.3, 2.6];
  return (
    <group position={[0, 3.2, -1.3]}>
      {[-2.9, 2.9].map((x) => (
        <Box key={x} size={[0.03, 0.4, 0.03]} position={[x, 0.2, 0]} color="#1c1f25" metalness={0.7} roughness={0.35} />
      ))}
      <Box size={[6.2, 0.07, 0.07]} position={[0, 0, 0]} color="#1c1f25" metalness={0.7} roughness={0.35} />
      {lamps.map((x) => (
        <group key={x} position={[x, -0.2, 0]} rotation={[0.75, 0, 0]}>
          <Box size={[0.03, 0.18, 0.03]} position={[0, 0.12, 0]} color="#1c1f25" metalness={0.7} roughness={0.35} />
          <mesh>
            <cylinderGeometry args={[0.1, 0.12, 0.3, 16]} />
            <meshStandardMaterial color="#121418" metalness={0.5} roughness={0.4} />
          </mesh>
          {/* the lens, facing the desk */}
          <mesh position={[0, -0.152, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.1, 20]} />
            <meshBasicMaterial color={[2.6, 2.3, 1.8]} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Chair({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Box size={[0.46, 0.06, 0.44]} position={[0, 0.46, 0]} color="#14161b" roughness={0.6} />
      <Box size={[0.46, 0.5, 0.05]} position={[0, 0.76, 0.21]} color="#14161b" roughness={0.6} />
      <Sign lines={[{ text: "PRESS", size: 1, color: CREAM, spacing: 0.3 }]} width={0.3} height={0.07} position={[0, 0.9, 0.237]} background={null} />
      {[
        [-0.2, -0.19],
        [0.2, -0.19],
        [-0.2, 0.19],
        [0.2, 0.19],
      ].map(([lx, lz]) => (
        <Box key={`${lx}${lz}`} size={[0.03, 0.46, 0.03]} position={[lx, 0.23, lz]} color="#8d9199" metalness={0.8} roughness={0.3} />
      ))}
    </group>
  );
}

// The Easter egg: a basketball in a football stadium
function Basketball({ position }: { position: [number, number, number] }) {
  const ball = useRef<Group>(null);
  const bounce = useRef(-10);
  const texture = useMemo(() => basketballTexture(), []);
  useEffect(() => () => texture.dispose(), [texture]);

  const click = () => {
    const world = useWorld.getState();
    bounce.current = atmo.time;
    world.findEgg("basketball");
    world.select("story", 1);
    world.cheer();
  };

  useFrame(() => {
    if (!ball.current) return;
    const t = atmo.time - bounce.current;
    // three quick bounces, each lower than the last
    const hop = t >= 0 && t < 1.5 ? Math.abs(Math.sin(t * 7)) * 0.5 * Math.exp(-t * 2.4) : 0;
    ball.current.position.y = position[1] + hop;
    ball.current.rotation.y = atmo.time * 0.4;
    ball.current.rotation.x = t >= 0 && t < 1.5 ? t * 5 : 0;
  });

  return (
    <group ref={ball} position={position}>
      <mesh onClick={click} {...clickable} castShadow>
        <sphereGeometry args={[0.122, 28, 20]} />
        <meshStandardMaterial map={texture} roughness={0.75} />
      </mesh>
    </group>
  );
}

// The reporters in the chairs, seen from behind: [seat, row] (seats run
// left to right, rows front to back), which of the two men, his shirt,
// skin and hair, and whether his hand is up with a question
const REPORTERS: { seat: number; row: number; man: 0 | 1; shirt: string; skin: number; hair: string; hand?: boolean; mirrored?: boolean }[] = [
  { seat: 0, row: 0, man: 1, shirt: "#2b2f3a", skin: 0.15, hair: "#2a1d14" },
  { seat: 1, row: 0, man: 0, shirt: "#e9e6df", skin: 0.6, hair: "#0e0b09", mirrored: true },
  { seat: 3, row: 0, man: 0, shirt: "#6b7f99", skin: 0.3, hair: "#4a3422", hand: true },
  { seat: 5, row: 0, man: 1, shirt: "#8a2b2b", skin: 0.85, hair: "#0e0b09", mirrored: true },
  { seat: 0, row: 1, man: 0, shirt: "#1c2a4a", skin: 0.45, hair: "#1a120c" },
  { seat: 2, row: 1, man: 1, shirt: "#d8d2c4", skin: 0.2, hair: "#6b5030", mirrored: true },
  { seat: 4, row: 1, man: 1, shirt: "#3d5a3a", skin: 0.7, hair: "#0e0b09" },
  { seat: 5, row: 1, man: 0, shirt: "#c9c3b5", skin: 0.1, hair: "#8a8580", mirrored: true },
];

export default function PressRoom() {
  const family = useDisplayFont();
  const backdrop = useMemo(() => {
    const t = backdropTexture(family);
    t.repeat.set(2.56, 1.8);
    return t;
  }, [family]);
  useEffect(() => () => backdrop.dispose(), [backdrop]);

  const film = news.find((item) => item.kind === "video") ?? news[0];
  const rows = [1.3, 2.5];
  // three a side, with an aisle down the middle
  const seats = [-2.45, -1.75, -1.05, 1.05, 1.75, 2.45];

  return (
    <group>
      <hemisphereLight intensity={0.4} color="#e8edff" groundColor="#14161b" />
      {/* the set: light on the desk and the backdrop, the audience kept darker */}
      <pointLight position={[0, 2.7, -1.2]} intensity={18} distance={9} decay={1.6} color="#fff6e8" />
      <pointLight position={[0, 2.9, 3]} intensity={6} distance={10} decay={1.7} color="#dfe6ff" />

      <Shell width={12.6} depth={12} back={4.5} height={3.6} floor="#1a1d24" wall="#20242d" ceiling="#0c0e12" floorSurface={{ name: "laminate", tile: 2.5, tint: "#6d6258", roughness: 0.6 }} />

      {/* ceiling light panels */}
      {[-3, 0, 3].map((x) => [-2, 1.5].map((z) => <Glow key={`${x}${z}`} size={[1.5, 0.02, 0.7]} position={[x, 3.58, z]} color={[0.55, 0.56, 0.6]} />))}

      {/* studio lights either side of the desk, and cameras behind the chairs */}
      {/* lamps over the stage, a softbox and a camera on the right, and a
          camera at the back of the centre aisle */}
      <LightingRig />
      <StudioLight position={[3.05, 0, -1.55]} turn={1.13} />
      <TvCamera position={[3.25, 0, -0.25]} turn={0.87} />
      <TvCamera position={[0, 0, 3.3]} turn={0} low={0.2} />
      {/* and the pool cameras: one on the left, one at the back corner */}
      <TvCamera position={[-3.3, 0, -0.1]} turn={-0.87} />
      <TvCamera position={[-2.6, 0, 3.7]} turn={-0.35} low={0.1} />

      {/* carpet under the reporters' chairs, edged in gold */}
      <Box size={[6.2, 0.012, 3.4]} position={[0, 0.006, 1.9]} color="#15214a" roughness={0.95} />
      {[-1, 1].map((side) => (
        <Box key={side} size={[6.2, 0.014, 0.05]} position={[0, 0.007, 1.9 + side * 1.7]} color="#8a6d2a" roughness={0.6} />
      ))}

      {/* the backdrop */}
      <mesh position={[0.6, 1.95, -4.46]}>
        <planeGeometry args={[7.2, 3.1]} />
        <meshStandardMaterial map={backdrop} roughness={0.55} />
      </mesh>

      {/* the desk on its low stage */}
      <Box size={[6.4, 0.22, 2.2]} position={[0, 0.11, -3.2]} color="#0f1218" roughness={0.5} />
      <Box size={[4.8, 0.06, 0.8]} position={[0, 0.98, -3.0]} color="#e9ebf0" roughness={0.3} />
      <Box size={[4.8, 0.74, 0.05]} position={[0, 0.59, -2.62]} color={NAVY} roughness={0.5} />
      <Glow size={[4.8, 0.02, 0.01]} position={[0, 0.93, -2.59]} color={[1.6, 1.3, 0.6]} />
      <Sign lines={[{ text: "PRESS CONFERENCE", size: 1, color: CREAM, spacing: 0.3 }]} width={3} height={0.26} position={[0, 0.58, -2.59]} background={null} />
      {/* microphones */}
      {[-0.5, -0.17, 0.17, 0.5].map((x, i) => (
        <group key={x} position={[x, 1.01, -2.78]} rotation={[0.5, (i - 1.5) * -0.2, 0]}>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.012, 0.012, 0.24, 8]} />
            <meshStandardMaterial color="#2b2e35" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.27, 0]}>
            <capsuleGeometry args={[0.028, 0.06, 4, 10]} />
            <meshStandardMaterial color={i % 2 ? "#12327e" : "#17191e"} roughness={0.8} />
          </mesh>
        </group>
      ))}
      {/* the name card */}
      <Sign
        lines={[
          { text: profile.shortName.toUpperCase(), size: 0.62, color: NAVY, weight: 800 },
          { text: profile.location.toUpperCase(), size: 0.3, color: "#8a6a12", weight: 600, spacing: 0.2 },
        ]}
        width={0.62}
        height={0.2}
        position={[1.5, 1.115, -2.72]}
        rotation={[-0.25, 0, 0]}
        background="#ffffff"
        border={GOLD}
      />

      {/* rows of chairs for the reporters, most of them taken */}
      {rows.map((z) => seats.map((x) => <Chair key={`${x}${z}`} x={x} z={z} />))}
      {REPORTERS.map((r) => (
        <Person key={`${r.seat}${r.row}`} look={{ sheet: "crowd-back", man: r.man, pose: r.hand ? POSE.armUp : POSE.sit, shirt: r.shirt, skin: r.skin, hair: r.hair }} position={[seats[r.seat], 0, rows[r.row] - 0.02]} mirrored={r.mirrored} />
      ))}
      {/* left on the end of the desk, where it can't be missed */}
      <Basketball position={[-1.95, 1.132, -3.0]} />

      {/* back wall, left of the backdrop: photos from All-Star weekend */}
      <Frame src={album[0].thumb} width={1.86} height={1.24} position={[-4.75, 2.28, -4.44]} rotation={[0, 0, 0]} />
      <Frame src={album[1].thumb} width={0.84} height={1.12} position={[-5.28, 0.92, -4.44]} rotation={[0, 0, 0]} />
      <Frame src={album[4].thumb} width={0.98} height={0.98} position={[-4.2, 0.86, -4.44]} rotation={[0, 0, 0]} />
      <Sign lines={[{ text: "NBA ALL-STAR 2026", size: 1, color: GOLD, spacing: 0.25 }]} width={2.3} height={0.17} position={[-4.75, 3.22, -4.44]} background={null} glow={1.4} />

      {/* right wall: the television */}
      <group position={[6.26, 1.85, -0.6]} rotation={[0, -Math.PI / 2, 0]}>
        <Box size={[3.1, 1.8, 0.07]} position={[0, 0, 0]} color="#08090c" roughness={0.3} />
        <Sign
          lines={[
            { text: film.outlet.toUpperCase(), size: 0.16, color: "#f2cf6b", weight: 700, spacing: 0.3 },
            { text: film.title.toUpperCase(), size: 0.3, color: "#ffffff", weight: 800 },
            { text: "▶  WATCH THE FILM IN THE PANEL", size: 0.14, color: "#9db8ff", weight: 600, spacing: 0.15 },
          ]}
          width={2.96}
          height={1.66}
          position={[0, 0, 0.04]}
          background="#0b1530"
          glow={1.25}
        />
      </group>
    </group>
  );
}
