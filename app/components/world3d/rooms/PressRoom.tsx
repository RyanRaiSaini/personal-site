"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { SRGBColorSpace, TextureLoader, type Group, type Texture } from "three";
import { news, profile } from "../../../data/portfolio";
import { album } from "../../../data/photos";
import { useWorld } from "../../../lib/store";
import { atmo } from "../atmosphere/state";
import { canvasTexture } from "../textures/canvas";
import { useDisplayFont } from "../textures/text";
import { Box, clickable, CREAM, Glow, GOLD, NAVY, ROYAL, Shell, Sign } from "./common";

// The press room (In the News). A press-conference desk in front of a
// sponsor-style backdrop, rows of chairs, my All-Star photos framed on
// the wall, and a television showing the NBA film. Somebody left a
// basketball on one of the chairs: click it.

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
          ctx.fillText("RS8", col * cell + cell / 2, row * cell + cell / 2 + 3);
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

function usePhoto(src: string): Texture | null {
  const [texture, setTexture] = useState<Texture | null>(null);
  useEffect(() => {
    let alive = true;
    let loaded: Texture | null = null;
    new TextureLoader().load(src, (t) => {
      t.colorSpace = SRGBColorSpace;
      t.anisotropy = 8;
      loaded = t;
      if (alive) setTexture(t);
      else t.dispose();
    });
    return () => {
      alive = false;
      loaded?.dispose();
    };
  }, [src]);
  return texture;
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

function Chair({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Box size={[0.46, 0.06, 0.44]} position={[0, 0.46, 0]} color="#14161b" roughness={0.6} />
      <Box size={[0.46, 0.5, 0.05]} position={[0, 0.76, 0.21]} color="#14161b" roughness={0.6} />
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

export default function PressRoom() {
  const family = useDisplayFont();
  const backdrop = useMemo(() => {
    const t = backdropTexture(family);
    t.repeat.set(3.2, 1.8);
    return t;
  }, [family]);
  useEffect(() => () => backdrop.dispose(), [backdrop]);

  const film = news.find((item) => item.kind === "video") ?? news[0];
  const rows = [1.3, 2.5];
  const seats = [-2.1, -1.4, -0.7, 0, 0.7, 1.4, 2.1];

  return (
    <group>
      <ambientLight intensity={0.6} color="#eef2ff" />
      <pointLight position={[0, 3.2, -1.5]} intensity={30} distance={14} decay={1.5} color="#ffffff" />
      <pointLight position={[0, 3.1, 3]} intensity={14} distance={12} decay={1.6} color="#fff1dc" />

      <Shell width={12.6} depth={12} back={4.5} height={3.6} floor="#1a1d24" wall="#20242d" ceiling="#0c0e12" floorRoughness={0.6} />

      {/* ceiling light panels */}
      {[-3, 0, 3].map((x) => [-2, 1.5].map((z) => <Glow key={`${x}${z}`} size={[1.5, 0.02, 0.7]} position={[x, 3.58, z]} color={[2.6, 2.6, 2.7]} />))}

      {/* the backdrop */}
      <mesh position={[0, 1.95, -4.46]}>
        <planeGeometry args={[9, 3.1]} />
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
          { text: `NUMBER ${profile.shirtNumber}`, size: 0.34, color: "#8a6a12", weight: 600, spacing: 0.2 },
        ]}
        width={0.62}
        height={0.2}
        position={[1.5, 1.115, -2.72]}
        rotation={[-0.25, 0, 0]}
        background="#ffffff"
        border={GOLD}
      />

      {/* rows of chairs for the reporters */}
      {rows.map((z) => seats.map((x) => <Chair key={`${x}${z}`} x={x} z={z} />))}
      <Basketball position={[-1.4, 0.612, 1.3]} />

      {/* left wall: photos from All-Star weekend */}
      <Frame src={album[0].thumb} width={1.8} height={1.2} position={[-6.26, 1.75, -1.6]} rotation={[0, Math.PI / 2, 0]} />
      <Frame src={album[1].thumb} width={0.9} height={1.2} position={[-6.26, 1.75, 0.4]} rotation={[0, Math.PI / 2, 0]} />
      <Frame src={album[4].thumb} width={1.1} height={1.1} position={[-6.26, 1.75, 2.0]} rotation={[0, Math.PI / 2, 0]} />
      <Sign lines={[{ text: "NBA ALL-STAR 2026", size: 1, color: GOLD, spacing: 0.25 }]} width={2.6} height={0.2} position={[-6.26, 2.72, -0.3]} rotation={[0, Math.PI / 2, 0]} background={null} glow={1.4} />

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
