"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { CatmullRomCurve3, ExtrudeGeometry, LatheGeometry, Shape, TubeGeometry, Vector2, Vector3, type Group, type Mesh } from "three";
import { awards } from "../../../data/portfolio";
import { useWorld } from "../../../lib/store";
import { atmo } from "../atmosphere/state";
import { canvasTexture } from "../textures/canvas";
import { Box, clickable, CREAM, Glow, GOLD, Shell, Sign } from "./common";

// The trophy room (Awards). Each award in `awards`
// (app/data/portfolio.ts) stands in its own lit case. The big cabinet
// on the back wall hides an Easter egg: click it fifteen times.

const GOLD_METAL = { color: "#e8c463", metalness: 1, roughness: 0.32 } as const;
const SILVER_METAL = { color: "#d7dbe2", metalness: 1, roughness: 0.3 } as const;
// display glass: barely there, and without a mirror finish to catch the lamps
const GLASS = { color: "#dfe9f7", transparent: true, opacity: 0.06, roughness: 0.12, metalness: 0, depthWrite: false } as const;

// Outlines that are spun round to make each trophy
function cupProfile(): Vector2[] {
  return [
    [0, 0],
    [0.11, 0],
    [0.11, 0.03],
    [0.04, 0.06],
    [0.025, 0.2],
    [0.05, 0.24],
    [0.13, 0.34],
    [0.16, 0.48],
    [0.165, 0.56],
    [0.15, 0.56],
    [0.14, 0.47],
    [0.0, 0.36],
  ].map(([x, y]) => new Vector2(x, y));
}

function vaseProfile(): Vector2[] {
  return [
    [0, 0],
    [0.09, 0],
    [0.09, 0.03],
    [0.05, 0.05],
    [0.04, 0.12],
    [0.1, 0.22],
    [0.12, 0.34],
    [0.08, 0.46],
    [0.06, 0.5],
    [0.085, 0.54],
    [0.07, 0.54],
    [0.0, 0.44],
  ].map(([x, y]) => new Vector2(x, y));
}

// The cup with the big handles
function bigCupProfile(): Vector2[] {
  return [
    [0, 0],
    [0.2, 0],
    [0.2, 0.05],
    [0.09, 0.1],
    [0.06, 0.24],
    [0.1, 0.3],
    [0.2, 0.42],
    [0.27, 0.62],
    [0.29, 0.84],
    [0.26, 0.86],
    [0.24, 0.64],
    [0.0, 0.46],
  ].map(([x, y]) => new Vector2(x, y));
}

function starShape(): Shape {
  const shape = new Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 0.2 : 0.085;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  shape.closePath();
  return shape;
}

function Trophy({ kind }: { kind: number }) {
  const spin = useRef<Group>(null);
  const geometry = useMemo(() => {
    if (kind === 3) return new ExtrudeGeometry(starShape(), { depth: 0.05, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2 });
    return new LatheGeometry(kind === 1 ? vaseProfile() : cupProfile(), 40);
  }, [kind]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    if (spin.current) spin.current.rotation.y = atmo.time * 0.25 + kind;
  });

  if (kind === 3) {
    return (
      <group>
        <Box size={[0.2, 0.08, 0.12]} position={[0, 0.04, 0]} color="#16181d" roughness={0.3} metalness={0.4} />
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.1, 8]} />
          <meshStandardMaterial {...GOLD_METAL} />
        </mesh>
        <group ref={spin} position={[0, 0.33, 0]}>
          <mesh geometry={geometry} position={[0, 0, -0.025]}>
            <meshStandardMaterial {...GOLD_METAL} />
          </mesh>
        </group>
      </group>
    );
  }
  return (
    <group ref={spin}>
      <mesh geometry={geometry}>
        <meshStandardMaterial {...(kind === 2 ? SILVER_METAL : GOLD_METAL)} side={2} />
      </mesh>
      {kind !== 1 &&
        [-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.19, 0.44, 0]} rotation={[0, 0, s * 0.2]}>
            <torusGeometry args={[0.07, 0.012, 8, 20, Math.PI * 1.3]} />
            <meshStandardMaterial {...(kind === 2 ? SILVER_METAL : GOLD_METAL)} />
          </mesh>
        ))}
    </group>
  );
}

// A pedestal with a glass case, a trophy and a plaque
function Case({ x, z, turn, index }: { x: number; z: number; turn: number; index: number }) {
  const award = awards[index];
  return (
    <group position={[x, 0, z]} rotation={[0, turn, 0]}>
      <Box size={[0.9, 1.0, 0.9]} position={[0, 0.5, 0]} color="#2a2118" roughness={0.35} metalness={0.2} />
      <Box size={[0.92, 0.04, 0.92]} position={[0, 1.02, 0]} color={GOLD} roughness={0.3} metalness={0.9} />
      {/* light in the plinth, shining up at the trophy */}
      <Glow size={[0.5, 0.01, 0.5]} position={[0, 1.045, 0]} color={[1.8, 1.6, 1.2]} />
      <group position={[0, 1.06, 0]}>
        <Trophy kind={index} />
      </group>
      {/* glass */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[0.86, 0.92, 0.86]} />
        <meshStandardMaterial {...GLASS} />
      </mesh>
      <Sign
        lines={[
          { text: award.title.toUpperCase(), size: 0.36, color: CREAM, weight: 700 },
          { text: [award.from, award.amount].filter(Boolean).join("  ·  ").toUpperCase() || award.note.toUpperCase(), size: 0.26, color: GOLD, weight: 600, spacing: 0.08 },
        ]}
        width={0.84}
        height={0.4}
        position={[0, 0.6, 0.456]}
        background="#0e1015"
        border={GOLD}
      />
    </group>
  );
}

// The cabinet on the back wall: shelves of small cups behind glass.
// Fifteen clicks sets off the celebration.
function Cabinet() {
  const clicks = useRef(0);
  const glass = useRef<Mesh>(null);
  const flash = useRef(0);
  const cup = useMemo(() => new LatheGeometry(cupProfile(), 20), []);
  useEffect(() => () => cup.dispose(), [cup]);

  const click = () => {
    const world = useWorld.getState();
    if (world.show) return;
    clicks.current += 1;
    flash.current = 1;
    if (clicks.current >= 15) {
      clicks.current = 0;
      world.findEgg("fifteen");
      world.startShow({ kind: "fifteen" });
    }
  };

  useFrame((_, dt) => {
    flash.current = Math.max(0, flash.current - dt * 4);
    if (glass.current) {
      const m = glass.current.material as { opacity: number };
      m.opacity = GLASS.opacity + flash.current * 0.25;
    }
  });

  const shelves = [0.95, 1.6, 2.25];
  return (
    <group position={[0, 0, -4.2]}>
      <Box size={[4.6, 2.9, 0.5]} position={[0, 1.55, -0.05]} color="#0b0c10" roughness={0.4} />
      {/* the back of the cabinet, lit warm from behind the shelves */}
      <Box size={[4.4, 2.6, 0.06]} position={[0, 1.6, 0.0]} color="#2a1d0b" roughness={0.6} emissive="#5a3c12" emissiveIntensity={0.55} />
      <Box size={[4.7, 0.08, 0.6]} position={[0, 3.02, 0]} color={GOLD} metalness={0.9} roughness={0.3} />
      {shelves.map((y) => (
        <group key={y}>
          <Box size={[4.4, 0.04, 0.42]} position={[0, y - 0.02, 0.22]} color="#2a2114" roughness={0.4} />
          <Glow size={[4.3, 0.012, 0.02]} position={[0, y + 0.58, 0.06]} color={[2.2, 1.8, 1.0]} />
          {Array.from({ length: 5 }, (_, i) => (
            <mesh key={i} geometry={cup} position={[-1.7 + i * 0.85, y, 0.24]} scale={0.62 + ((i * 7 + Math.round(y * 10)) % 3) * 0.1}>
              <meshStandardMaterial {...((i + Math.round(y * 10)) % 2 ? SILVER_METAL : GOLD_METAL)} side={2} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh ref={glass} position={[0, 1.6, 0.46]} onClick={click} {...clickable}>
        <boxGeometry args={[4.4, 2.6, 0.03]} />
        <meshStandardMaterial {...GLASS} />
      </mesh>
    </group>
  );
}

// Brass posts with a red velvet rope sagging between them, in front of
// the cases
function Ropes({ posts }: { posts: [number, number][] }) {
  const ropes = useMemo(
    () =>
      posts.slice(1).map(([x1, z1], i) => {
        const [x0, z0] = posts[i];
        const curve = new CatmullRomCurve3([new Vector3(x0, 0.86, z0), new Vector3((x0 + x1) / 2, 0.68, (z0 + z1) / 2), new Vector3(x1, 0.86, z1)]);
        return new TubeGeometry(curve, 20, 0.022, 8, false);
      }),
    [posts],
  );
  useEffect(() => () => ropes.forEach((rope) => rope.dispose()), [ropes]);
  return (
    <group>
      {posts.map(([x, z]) => (
        <group key={`${x}${z}`} position={[x, 0, z]}>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[0.13, 0.15, 0.04, 20]} />
            <meshStandardMaterial {...GOLD_METAL} />
          </mesh>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.025, 0.03, 0.86, 12]} />
            <meshStandardMaterial {...GOLD_METAL} />
          </mesh>
          <mesh position={[0, 0.9, 0]}>
            <sphereGeometry args={[0.05, 16, 12]} />
            <meshStandardMaterial {...GOLD_METAL} />
          </mesh>
        </group>
      ))}
      {ropes.map((rope, i) => (
        <mesh key={i} geometry={rope}>
          <meshStandardMaterial color="#7a1020" roughness={0.85} />
        </mesh>
      ))}
    </group>
  );
}

// The egg: the big-eared cup rises out of the floor
function BigCup() {
  const group = useRef<Group>(null);
  const show = useWorld((s) => s.show);
  const geometry = useMemo(() => new LatheGeometry(bigCupProfile(), 48), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const active = show?.kind === "fifteen";

  useFrame((_, dt) => {
    if (!group.current) return;
    const target = active ? 0.95 : -1.4;
    group.current.position.y += (target - group.current.position.y) * Math.min(1, dt * 2.2);
    group.current.rotation.y += dt * (active ? 1.2 : 0);
    group.current.visible = group.current.position.y > -1.3;
  });

  return (
    <group ref={group} position={[0, -1.4, 1.6]} visible={false}>
      <mesh geometry={geometry}>
        <meshStandardMaterial {...SILVER_METAL} side={2} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.36, 0.6, 0]} rotation={[0, 0, s * -0.1]}>
          <torusGeometry args={[0.19, 0.022, 10, 28, Math.PI * 1.25]} />
          <meshStandardMaterial {...SILVER_METAL} />
        </mesh>
      ))}
      <pointLight position={[0, 1.2, 1]} intensity={active ? 14 : 0} distance={6} color="#fff2d0" />
    </group>
  );
}

// Polished dark stone in large square tiles
function floorTexture() {
  return canvasTexture(512, 512, (ctx, w, h) => {
    ctx.fillStyle = "#0c0d11";
    ctx.fillRect(0, 0, w, h);
    // a faint cloud, so the stone is not flat paint
    const cloud = ctx.createRadialGradient(w * 0.3, h * 0.35, 10, w * 0.5, h * 0.5, w * 0.75);
    cloud.addColorStop(0, "rgba(255,255,255,0.035)");
    cloud.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = cloud;
    ctx.fillRect(0, 0, w, h);
    // the joint between tiles
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);
  });
}

export default function TrophyRoom() {
  const stone = useMemo(() => {
    const t = floorTexture();
    t.repeat.set(6, 6);
    return t;
  }, []);
  useEffect(() => () => stone.dispose(), [stone]);

  const places: { x: number; z: number; turn: number }[] = [
    { x: -2.4, z: -1.05, turn: 0.2 },
    { x: -0.8, z: -1.4, turn: 0.06 },
    { x: 0.8, z: -1.4, turn: -0.06 },
    { x: 2.4, z: -1.05, turn: -0.2 },
  ];

  return (
    <group>
      <hemisphereLight intensity={0.55} color="#fff1dc" groundColor="#1a140c" />
      {places.map((p, i) => (
        <pointLight key={i} position={[p.x, 2.85, p.z + 0.5]} intensity={9} distance={6} decay={1.6} color="#ffe6bd" />
      ))}
      <pointLight position={[0, 2.6, 4.5]} intensity={12} distance={14} decay={1.4} color="#ffe0b0" />

      <Shell width={12} depth={12} back={4.5} height={3.6} floor="#0a0b0f" wall="#15120e" ceiling="#070709" floorMap={stone} floorRoughness={0.22} floorMetalness={0.2} />

      {/* slatted side walls with a warm line of light */}
      {[-1, 1].map((s) => (
        <group key={s}>
          {Array.from({ length: 16 }, (_, i) => (
            <Box key={i} size={[0.05, 3.2, 0.12]} position={[s * 5.95, 1.6, -4 + i * 0.7]} color="#3a2a17" roughness={0.5} />
          ))}
          <Glow size={[0.02, 0.03, 11]} position={[s * 5.97, 0.12, 1.2]} color={[1.9, 1.4, 0.7]} />
        </group>
      ))}

      <Sign lines={[{ text: "SILVERWARE", size: 1, color: GOLD, spacing: 0.5 }]} width={3.4} height={0.3} position={[0, 3.3, -4.38]} background={null} glow={1.6} />

      {/* a runner up the middle of the room to the cabinet */}
      <Box size={[1.5, 0.012, 9.2]} position={[0, 0.006, 1.0]} color="#13204a" roughness={0.95} />
      {[-1, 1].map((side) => (
        <Box key={side} size={[0.05, 0.014, 9.2]} position={[side * 0.75, 0.007, 1.0]} color="#8a6d2a" roughness={0.6} />
      ))}
      {/* far enough forward that, from the door, they pass under the plaques */}
      <Ropes posts={[[-3.3, 1.25], [-1.9, 1.6], [-0.8, 1.6]]} />
      <Ropes posts={[[0.8, 1.6], [1.9, 1.6], [3.3, 1.25]]} />

      <Cabinet />
      {places.map((p, i) => (awards[i] ? <Case key={awards[i].id} x={p.x} z={p.z} turn={p.turn} index={i} /> : null))}
      <BigCup />
    </group>
  );
}
