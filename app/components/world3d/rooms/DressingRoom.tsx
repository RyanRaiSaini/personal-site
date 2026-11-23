"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { DoubleSide, type CanvasTexture, type Group, type Material } from "three";
import { bench, squad } from "../../../data/portfolio";
import { atmo } from "../atmosphere/state";
import { ballTexture } from "../players/Cast";
import { canvasTexture } from "../textures/canvas";
import { useDisplayFont } from "../textures/text";
import { Box, Glow, GOLD, NAVY, Shell, Sign } from "./common";
import { useSurface } from "./surfaces";

// The dressing room (Skills), dressed as a top club's is on matchday:
// white walls and ceiling, walnut lockers with quilted white leather
// backs and padded seats, a lit plate over every locker, a white carpet
// in the middle. A shirt hangs in every locker: the starting eleven
// along the back wall, the bench down the left (`squad` and `bench` in
// app/data/portfolio.ts). Each seat has a folded towel and a bottle,
// boots in every player's own colours wait underneath, the tactics
// board on the right wall shows the eleven in their 4-3-3, and the
// match ball sits in a pool of light on the carpet.
//
// Walnut, leather, plaster and the floor are real materials (surfaces.ts).

const BAY = 1.04; // width of one locker bay
const WALL = "#eceae4";

// Boot colours, [upper, sole and stripe], as a squad's boots are: every
// player his own pair
const BOOTS: [string, string][] = [
  ["#e8f43a", "#151515"],
  ["#1d4fd8", "#f2f2f2"],
  ["#f2f2f2", "#c9a227"],
  ["#ff4f9a", "#1b1b1b"],
  ["#ff7a1a", "#1b2a5a"],
  ["#141414", "#2cff9e"],
  ["#c8102e", "#f2f2f2"],
  ["#1fc8c8", "#101828"],
  ["#7b3cff", "#f2e94e"],
  ["#d9dde3", "#ff3b3b"],
  ["#0e7a3c", "#f2f2f2"],
];

// A white shirt seen from the back, with a name and a number
export function shirtTexture(family: string, name: string, number: number | string): CanvasTexture {
  return canvasTexture(
    256,
    288,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      // body and sleeves (the canvas is 256 x 288)
      ctx.beginPath();
      ctx.moveTo(88, 14);
      ctx.quadraticCurveTo(128, 34, 168, 14);
      ctx.lineTo(206, 26);
      ctx.lineTo(250, 78);
      ctx.lineTo(214, 108);
      ctx.lineTo(196, 90);
      ctx.lineTo(198, 276);
      ctx.lineTo(58, 276);
      ctx.lineTo(60, 90);
      ctx.lineTo(42, 108);
      ctx.lineTo(6, 78);
      ctx.lineTo(50, 26);
      ctx.closePath();
      const cloth = ctx.createLinearGradient(0, 0, w, 0);
      cloth.addColorStop(0, "#dfe2e8");
      cloth.addColorStop(0.5, "#ffffff");
      cloth.addColorStop(1, "#dfe2e8");
      ctx.fillStyle = cloth;
      ctx.fill();
      // soft folds
      ctx.strokeStyle = "rgba(20,30,60,0.08)";
      ctx.lineWidth = 3;
      for (const x of [92, 128, 164]) {
        ctx.beginPath();
        ctx.moveTo(x, 110);
        ctx.quadraticCurveTo(x + 4, 190, x - 2, 272);
        ctx.stroke();
      }
      // gold trim on the collar and cuffs
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(88, 14);
      ctx.quadraticCurveTo(128, 34, 168, 14);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(8, 80);
      ctx.lineTo(42, 106);
      ctx.moveTo(248, 80);
      ctx.lineTo(214, 106);
      ctx.stroke();

      // name, shrunk to fit across the shoulders
      ctx.fillStyle = NAVY;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      let size = 32;
      ctx.font = `700 ${size}px ${family}`;
      const label = name.toUpperCase();
      const wide = ctx.measureText(label).width;
      if (wide > 124) {
        size *= 124 / wide;
        ctx.font = `700 ${size}px ${family}`;
      }
      ctx.fillText(label, w / 2, 76);
      ctx.font = `800 132px ${family}`;
      ctx.fillText(String(number), w / 2, 176);
    },
    { repeat: false, anisotropy: 16 },
  );
}

function Shirt({ name, number, position, rotation, index }: { name: string; number: number | string; position: [number, number, number]; rotation?: [number, number, number]; index: number }) {
  const family = useDisplayFont();
  const group = useRef<Group>(null);
  const texture = useMemo(() => (family ? shirtTexture(family, name, number) : null), [family, name, number]);
  useEffect(() => () => texture?.dispose(), [texture]);

  // A slight sway, as if someone just walked past
  useFrame(() => {
    if (group.current) group.current.rotation.z = Math.sin(atmo.time * 0.9 + index * 1.7) * 0.025;
  });

  if (!texture) return null;
  return (
    <group position={position} rotation={rotation}>
      <group ref={group} position={[0, 0.46, 0]}>
        {/* the hanger hook */}
        <mesh position={[0, 0.03, 0]}>
          <torusGeometry args={[0.035, 0.008, 6, 12, Math.PI]} />
          <meshStandardMaterial color="#c9ccd2" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0, -0.46, 0]}>
          <planeGeometry args={[0.8, 0.9]} />
          <meshStandardMaterial map={texture} transparent alphaTest={0.4} side={DoubleSide} forceSinglePass roughness={0.9} />
        </mesh>
      </group>
    </group>
  );
}

// The materials every locker shares, made once for the room
type Finishes = { walnut: Material; leather: Material; seat: Material };

// One locker bay: walnut sides and top, a quilted leather back, a padded
// seat, a lit plate with the number and name, a towel, a bottle and a
// shirt on the rail
function Bay({ x, name, number, index, finish }: { x: number; name: string; number: number; index: number; finish: Finishes }) {
  return (
    <group position={[x, 0, 0]}>
      <Box size={[0.06, 2.35, 0.62]} position={[-BAY / 2, 1.175, 0.31]} material={finish.walnut} />
      <Box size={[BAY, 0.06, 0.62]} position={[0, 2.32, 0.31]} material={finish.walnut} />
      {/* the seat: walnut base, a padded white cushion */}
      <Box size={[BAY, 0.42, 0.5]} position={[0, 0.21, 0.27]} material={finish.walnut} />
      <Box size={[BAY - 0.04, 0.09, 0.54]} position={[0, 0.465, 0.29]} material={finish.seat} />
      {/* the back: quilted leather, in three padded panels */}
      {[0.85, 1.45, 2.0].map((y, i) => (
        <Box key={y} size={[BAY - 0.08, i === 2 ? 0.42 : 0.56, 0.05]} position={[0, y, 0.045]} material={finish.leather} />
      ))}
      {/* light under the top, washing down the leather */}
      <Glow size={[BAY - 0.2, 0.02, 0.04]} position={[0, 2.27, 0.5]} color={[2.2, 2.0, 1.6]} />
      {/* rail */}
      <mesh position={[0, 2.12, 0.3]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, BAY - 0.1, 8]} />
        <meshStandardMaterial color="#c9ccd2" metalness={0.85} roughness={0.28} />
      </mesh>
      {/* the plate over the locker, lit from behind */}
      <Sign
        lines={[
          { text: String(number), size: 0.5, color: GOLD, weight: 800 },
          { text: name.toUpperCase(), size: 0.26, color: "#ffffff", weight: 700, spacing: 0.06 },
        ]}
        width={0.8}
        height={0.3}
        position={[0, 2.56, 0.07]}
        background="#0b1430"
        border={GOLD}
        glow={1.4}
      />
      <Shirt name={name} number={number} position={[0, 1.55, 0.32]} index={index} />
      <Towel x={((index * 29) % 5) * 0.06 - 0.12} turn={((index * 13) % 7) * 0.06 - 0.18} />
      <Bottle x={0.36 - ((index * 17) % 3) * 0.04} />
    </group>
  );
}

// A folded white towel with a navy stripe, on the seat
function Towel({ x, turn }: { x: number; turn: number }) {
  return (
    <group position={[x, 0.54, 0.32]} rotation={[0, turn, 0]}>
      <Box size={[0.34, 0.06, 0.24]} position={[0, 0, 0]} color="#f4f4f1" roughness={1} />
      <Box size={[0.342, 0.062, 0.03]} position={[0, 0, 0.07]} color={NAVY} roughness={1} />
    </group>
  );
}

// A squeezy bottle on the seat's corner
function Bottle({ x }: { x: number }) {
  return (
    <group position={[x, 0.51, 0.46]}>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.035, 0.035, 0.2, 14]} />
        <meshStandardMaterial color="#d6e6ff" roughness={0.25} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0.215, 0]}>
        <cylinderGeometry args={[0.012, 0.025, 0.04, 10]} />
        <meshStandardMaterial color={NAVY} roughness={0.5} />
      </mesh>
    </group>
  );
}

// A pair of boots, left under a locker: a stiff sole plate with studs,
// a rounded upper, a heel and a stripe down the outside
function Boots({ x, z, turn, colours }: { x: number; z: number; turn: number; colours: [string, string] }) {
  const [upper, trim] = colours;
  return (
    <group position={[x, 0, z]} rotation={[0, turn, 0]}>
      {[-0.075, 0.075].map((side) => (
        <group key={side} position={[side, 0, side * 0.4]} rotation={[0, side * 0.6, 0]}>
          {/* sole plate and studs */}
          <Box size={[0.095, 0.014, 0.275]} position={[0, 0.019, 0]} color={trim} roughness={0.45} />
          {[-0.09, -0.03, 0.04, 0.1].map((sz) =>
            [-0.03, 0.03].map((sx) => (
              <mesh key={`${sz}${sx}`} position={[sx, 0.006, sz]}>
                <cylinderGeometry args={[0.008, 0.01, 0.012, 8]} />
                <meshStandardMaterial color={trim} roughness={0.4} />
              </mesh>
            )),
          )}
          {/* the upper: a rounded toe running back to the heel */}
          <mesh position={[0, 0.058, 0.02]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.62]}>
            <capsuleGeometry args={[0.046, 0.16, 6, 14]} />
            <meshPhysicalMaterial color={upper} roughness={0.35} clearcoat={0.7} clearcoatRoughness={0.25} />
          </mesh>
          {/* ankle and heel */}
          <mesh position={[0, 0.1, -0.085]}>
            <cylinderGeometry args={[0.04, 0.045, 0.07, 14]} />
            <meshPhysicalMaterial color={upper} roughness={0.4} clearcoat={0.5} />
          </mesh>
          <Box size={[0.08, 0.05, 0.03]} position={[0, 0.06, -0.125]} color={trim} roughness={0.4} />
          {/* the stripe along the outside */}
          <Box size={[0.004, 0.022, 0.15]} position={[side > 0 ? 0.047 : -0.047, 0.06, 0.01]} rotation={[0.25, 0, 0]} color={trim} roughness={0.4} />
        </group>
      ))}
    </group>
  );
}

// The tactics board on the right wall: the starting eleven where they play
function TacticsBoard({ family }: { family: string | null }) {
  const board = useMemo(
    () =>
      canvasTexture(
        1024,
        700,
        (ctx, w, h) => {
          ctx.fillStyle = "#f7f7f3";
          ctx.fillRect(0, 0, w, h);
          // the pitch, drawn in marker, attacking upward
          const px = 120;
          const py = 40;
          const pw = w - 240;
          const ph = h - 80;
          ctx.fillStyle = "#e9f2e6";
          ctx.fillRect(px, py, pw, ph);
          ctx.strokeStyle = "#2b6b3a";
          ctx.lineWidth = 4;
          ctx.strokeRect(px, py, pw, ph);
          ctx.beginPath();
          ctx.moveTo(px, py + ph / 2);
          ctx.lineTo(px + pw, py + ph / 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(px + pw / 2, py + ph / 2, 70, 0, Math.PI * 2);
          ctx.stroke();
          ctx.strokeRect(px + pw / 2 - 160, py, 320, 110);
          ctx.strokeRect(px + pw / 2 - 160, py + ph - 110, 320, 110);
          if (!family) return;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          for (const player of squad) {
            const cx = px + (player.x / 100) * pw;
            const cy = py + ph - (player.y / 100) * ph;
            ctx.fillStyle = NAVY;
            ctx.beginPath();
            ctx.arc(cx, cy, 30, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.font = `800 30px ${family}`;
            ctx.fillText(String(player.number), cx, cy + 1);
            ctx.fillStyle = "#c8102e";
            ctx.font = `700 26px ${family}`;
            ctx.fillText(player.name.toUpperCase(), cx, cy + 50);
          }
        },
        { repeat: false, anisotropy: 8 },
      ),
    [family],
  );
  useEffect(() => () => board.dispose(), [board]);
  return (
    <group position={[6.64, 1.55, -0.6]} rotation={[0, -Math.PI / 2, 0]}>
      <Box size={[2.5, 1.75, 0.05]} position={[0, 0, -0.02]} color="#c9ccd2" metalness={0.8} roughness={0.3} />
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[2.4, 1.64]} />
        <meshStandardMaterial map={board} roughness={0.35} />
      </mesh>
      {/* the marker tray */}
      <Box size={[1.2, 0.04, 0.08]} position={[0, -0.9, 0.04]} color="#c9ccd2" metalness={0.8} roughness={0.3} />
      {["#c8102e", NAVY, "#1d7a3a"].map((c, i) => (
        <mesh key={c} position={[-0.2 + i * 0.12, -0.87, 0.05]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.012, 0.012, 0.13, 8]} />
          <meshStandardMaterial color={c} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

// The match ball, on the front edge of the crest in a pool of light
function MatchBall() {
  const ball = useRef<Group>(null);
  const leather = useMemo(() => ballTexture(), []);
  useEffect(() => () => leather.dispose(), [leather]);
  useFrame(() => {
    if (ball.current) ball.current.rotation.y = atmo.time * 0.3;
  });
  return (
    <group position={[0, 0, 2.75]}>
      <group ref={ball} position={[0, 0.115, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.115, 28, 20]} />
          <meshStandardMaterial map={leather} roughness={0.42} />
        </mesh>
      </group>
      <pointLight position={[0, 1.6, 0.2]} intensity={3} distance={2.6} decay={1.6} color="#fff3dc" />
    </group>
  );
}

// A mesh bag of training balls, slumped in the corner
function BallBag({ x, z }: { x: number; z: number }) {
  const balls: [number, number, number][] = [
    [0, 0.11, 0],
    [0.2, 0.11, 0.05],
    [0.09, 0.11, 0.2],
    [0.1, 0.3, 0.08],
  ];
  return (
    <group position={[x, 0, z]}>
      {balls.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.11, 18, 12]} />
          <meshStandardMaterial color={i % 2 ? "#f2f2ee" : "#d8b24e"} roughness={0.5} />
        </mesh>
      ))}
      {/* the net round them */}
      <mesh position={[0.1, 0.2, 0.08]}>
        <sphereGeometry args={[0.3, 12, 10]} />
        <meshStandardMaterial color="#10182e" wireframe transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

// The round carpet in the middle: white, with a navy ring, gold rings
// and my initials
function carpetTexture(family: string | null) {
  return canvasTexture(
    1024,
    1024,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#e4e1d8";
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 500, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = NAVY;
      ctx.lineWidth = 26;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 470, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 8;
      for (const r of [430, 250]) {
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (family) {
        ctx.fillStyle = NAVY;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `800 230px ${family}`;
        ctx.fillText("RS", w / 2, h / 2 + 12);
      }
    },
    { repeat: false },
  );
}

export default function DressingRoom() {
  const family = useDisplayFont();
  const carpet = useMemo(() => carpetTexture(family), [family]);
  useEffect(() => () => carpet.dispose(), [carpet]);
  // the carpet: the drawing above on a real woven surface
  const weave = useSurface("fabric", { repeat: [6, 6], bumps: 0.5 });
  const rug = useMemo(() => {
    const material = weave.clone();
    material.map = carpet;
    material.alphaTest = 0.5;
    return material;
  }, [weave, carpet]);
  useEffect(() => () => rug.dispose(), [rug]);

  const walnut = useSurface("walnut", { repeat: [1, 2], roughness: 0.75, tint: "#e0aa78" });
  const leather = useSurface("leather", { repeat: [1, 1], roughness: 0.9, bumps: 0.8 });
  const seat = useSurface("leather", { repeat: [1, 0.5], roughness: 0.9, bumps: 0.8 });
  const finish = useMemo(() => ({ walnut, leather, seat }), [walnut, leather, seat]);

  // Bench players wear the numbers after the starting eleven
  const benchNumbers = [12, 14, 15, 17, 18, 19, 20];
  // eleven bays along the back wall, centred
  const startX = -((squad.length - 1) * BAY) / 2;

  return (
    <group>
      <hemisphereLight intensity={0.55} color="#f4f6ff" groundColor="#3a3a40" />
      <pointLight position={[0, 3.0, 1.5]} intensity={11} distance={16} decay={1.5} color="#fff4e2" />
      <pointLight position={[0, 2.6, -2.6]} intensity={12} distance={10} decay={1.7} color="#ffe9c8" />
      <pointLight position={[-4.5, 2.6, 1.0]} intensity={7} distance={8} decay={1.7} color="#fff4e2" />

      <Shell width={13.4} depth={11.5} back={4.5} height={3.6} floor="#2a2c31" wall={WALL} ceiling="#f2f1ed" floorSurface={{ name: "rubber", tile: 1.2, tint: "#8a8f99", roughness: 0.9 }} />
      {/* the carpet in the middle */}
      <mesh position={[0, 0.012, 1.2]} rotation={[-Math.PI / 2, 0, 0]} material={rug}>
        <planeGeometry args={[6.4, 6.4]} />
      </mesh>

      {/* the ceiling: a ring of light over the carpet, downlights over the lockers */}
      <mesh position={[0, 3.56, 1.2]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.3, 0.045, 8, 64]} />
        <meshBasicMaterial color={[1.6, 1.55, 1.45]} toneMapped={false} />
      </mesh>
      {[-5, -3, -1, 1, 3, 5].map((x) => (
        <Glow key={x} size={[0.16, 0.01, 0.16]} position={[x, 3.595, -3.4]} color={[2.2, 2.1, 1.9]} />
      ))}

      {/* a navy band and a gold line above the lockers, and the room's name */}
      <Box size={[13.4, 0.6, 0.02]} position={[0, 3.25, -4.49]} color={NAVY} roughness={0.7} />
      <Glow size={[13.4, 0.03, 0.02]} position={[0, 2.93, -4.47]} color={[1.6, 1.3, 0.6]} />
      <Sign lines={[{ text: "THE STARTING ELEVEN", size: 1, color: "#ffffff", spacing: 0.3 }]} width={6} height={0.34} position={[0, 3.25, -4.46]} background={null} glow={1.3} />

      {/* back wall: the starting eleven */}
      <group position={[0, 0, -4.48]}>
        {squad.map((player, i) => (
          <Bay key={player.number} x={startX + i * BAY} name={player.name} number={player.number} index={i} finish={finish} />
        ))}
        <Box size={[0.06, 2.35, 0.62]} position={[startX + (squad.length - 0.5) * BAY, 1.175, 0.31]} material={walnut} />
      </group>

      {/* left wall: the bench */}
      <group position={[-6.68, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        {bench.map((name, i) => (
          <Bay key={name} x={-3.4 + i * BAY} name={name} number={benchNumbers[i] ?? 20 + i} index={i + 11} finish={finish} />
        ))}
        <Box size={[0.06, 2.35, 0.62]} position={[-3.4 + (bench.length - 0.5) * BAY, 1.175, 0.31]} material={walnut} />
      </group>
      <Box size={[0.02, 0.6, 7.5]} position={[-6.69, 3.25, 0.15]} color={NAVY} roughness={0.7} />
      <Sign lines={[{ text: "THE BENCH", size: 1, color: "#ffffff", spacing: 0.3 }]} width={3.4} height={0.32} position={[-6.66, 3.25, -0.4]} rotation={[0, Math.PI / 2, 0]} background={null} glow={1.3} />

      <TacticsBoard family={family} />
      <MatchBall />
      {/* boots under every locker, toes out, every pair its own colours */}
      {squad.map((player, i) => (
        <Boots key={player.number} x={startX + i * BAY} z={-3.5} turn={((i * 37) % 7) * 0.05 - 0.15} colours={BOOTS[i % BOOTS.length]} />
      ))}
      {bench.map((name, i) => (
        <Boots key={name} x={-5.7} z={3.4 - i * BAY} turn={Math.PI / 2 + ((i * 23) % 5) * 0.06 - 0.12} colours={BOOTS[(i * 4 + 3) % BOOTS.length]} />
      ))}
      <BallBag x={-5.4} z={4.6} />
    </group>
  );
}
