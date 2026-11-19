"use client";

import { useEffect, useMemo } from "react";
import { canvasTexture, grain, roundRect } from "../textures/canvas";
import { BACK_WALL, FRONT_WALL_HEIGHT, ROOF, SEATING, TIERS, TUNNEL } from "./dims";
import { PIECE, sweepBand, sweepBands, type Piece } from "./path";

// The bowl: four tiers of seats, the walls between them, the wall at
// the front and the wall at the back. The crowd sits on top of this
// (Crowd.tsx).

// One blue seat on a concrete step. The texture repeats once per seat.
function seatTexture() {
  return canvasTexture(64, 64, (ctx, w, h) => {
    ctx.fillStyle = "#585d66";
    ctx.fillRect(0, 0, w, h);
    // the riser of the step behind the seat
    ctx.fillStyle = "#3c4048";
    ctx.fillRect(0, 0, w, 10);
    // the seat: back and pan
    ctx.fillStyle = "#163c8f";
    roundRect(ctx, 8, 14, w - 16, 20, 5);
    ctx.fill();
    ctx.fillStyle = "#1d4fb5";
    roundRect(ctx, 8, 30, w - 16, 22, 6);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fillRect(10, 32, w - 20, 3);
    grain(ctx, w, h, 9, 11);
  });
}

// The wall between the first and second tiers: a strip of dark glass
// with warm light behind it, where the boxes are
function boxesTexture() {
  return canvasTexture(256, 64, (ctx, w, h) => {
    ctx.fillStyle = "#0b0d12";
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) {
      const x = i * 64 + 4;
      const glow = ctx.createLinearGradient(0, 14, 0, 50);
      glow.addColorStop(0, "#ffd9a0");
      glow.addColorStop(1, "#b9742c");
      ctx.fillStyle = glow;
      ctx.fillRect(x, 16, 56, 30);
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(x + 27, 16, 2, 30);
    }
    ctx.fillStyle = "#1a1d26";
    ctx.fillRect(0, 50, w, 14);
  });
}

function concreteTexture(base: string, seed: number) {
  return canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, w, h);
    grain(ctx, w, h, 12, seed);
  });
}

export default function Stands() {
  const assets = useMemo(() => {
    const seats = seatTexture();
    const boxes = boxesTexture();
    const concrete = concreteTexture("#2a2d35", 3);
    const wall = concreteTexture("#12203f", 5);

    // No seats where the tunnel comes out of the main stand
    const skipTunnel = (piece: Piece, t0: number, t1: number) => {
      if (piece.index !== PIECE.west) return false;
      const len = piece.length(0);
      const x0 = len / 2 - t0 * len;
      const x1 = len / 2 - t1 * len;
      return Math.max(Math.abs(x0), Math.abs(x1)) <= TUNNEL.halfWidth + 0.01;
    };

    const tiers = TIERS.map(({ from, to }, i) =>
      sweepBand(from, to, {
        uSize: SEATING.seatWidth,
        vSize: Math.hypot(to.d - from.d, to.y - from.y) / Math.round((to.d - from.d) / SEATING.rowDepth),
        segmentLength: i === 0 ? TUNNEL.halfWidth : 8,
        cornerSegments: 16,
      }),
    );

    // Walls between the tiers. Each one drops from the front of the
    // tier above to the back of the tier below.
    const fascias = sweepBands(
      [
        { a: { d: TIERS[1].to.d, y: TIERS[1].to.y }, b: { d: TIERS[1].to.d, y: TIERS[2].from.y } },
        { a: { d: TIERS[2].to.d, y: TIERS[2].to.y }, b: { d: TIERS[2].to.d, y: TIERS[3].from.y } },
        // little ledges at the front of each upper tier
        { a: { d: TIERS[0].to.d, y: TIERS[1].from.y }, b: { d: TIERS[1].from.d, y: TIERS[1].from.y } },
        { a: { d: TIERS[1].to.d, y: TIERS[2].from.y }, b: { d: TIERS[2].from.d, y: TIERS[2].from.y } },
        { a: { d: TIERS[2].to.d, y: TIERS[3].from.y }, b: { d: TIERS[3].from.d, y: TIERS[3].from.y } },
      ],
      { uSize: 4, vSize: 4, cornerSegments: 16 },
    );

    const boxesBand = sweepBand({ d: TIERS[0].to.d, y: TIERS[0].to.y }, { d: TIERS[0].to.d, y: TIERS[1].from.y }, { uSize: 12.8, vSize: TIERS[1].from.y - TIERS[0].to.y, cornerSegments: 16 });

    const frontWall = sweepBands(
      [
        { a: { d: 0, y: 0 }, b: { d: 0, y: FRONT_WALL_HEIGHT } },
        { a: { d: 0, y: FRONT_WALL_HEIGHT }, b: { d: TIERS[0].from.d, y: FRONT_WALL_HEIGHT } },
      ],
      { uSize: 4, vSize: 4, segmentLength: TUNNEL.halfWidth, cornerSegments: 16, skip: skipTunnel },
    );

    const backWall = sweepBand({ d: BACK_WALL.d, y: BACK_WALL.y }, { d: BACK_WALL.d, y: ROOF.outerY }, { uSize: 6, vSize: 6, cornerSegments: 16 });

    return { seats, boxes, concrete, wall, tiers, fascias, boxesBand, frontWall, backWall };
  }, []);

  useEffect(() => {
    return () => {
      assets.seats.dispose();
      assets.boxes.dispose();
      assets.concrete.dispose();
      assets.wall.dispose();
      assets.tiers.forEach((g) => g.dispose());
      assets.fascias.dispose();
      assets.boxesBand.dispose();
      assets.frontWall.dispose();
      assets.backWall.dispose();
    };
  }, [assets]);

  return (
    <group>
      {assets.tiers.map((geometry, i) => (
        <mesh key={i} geometry={geometry} receiveShadow>
          <meshStandardMaterial map={assets.seats} roughness={0.85} metalness={0} />
        </mesh>
      ))}
      <mesh geometry={assets.fascias} receiveShadow>
        <meshStandardMaterial map={assets.concrete} roughness={0.9} />
      </mesh>
      <mesh geometry={assets.boxesBand}>
        <meshStandardMaterial map={assets.boxes} emissiveMap={assets.boxes} emissive="#ffffff" emissiveIntensity={0.55} roughness={0.35} metalness={0.2} />
      </mesh>
      <mesh geometry={assets.frontWall} receiveShadow>
        <meshStandardMaterial map={assets.wall} roughness={0.8} />
      </mesh>
      <mesh geometry={assets.backWall}>
        <meshStandardMaterial map={assets.concrete} roughness={0.95} />
      </mesh>
    </group>
  );
}
