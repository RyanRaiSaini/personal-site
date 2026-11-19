import { BufferGeometry, Float32BufferAttribute } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { BOWL, type Ring } from "./dims";

// ------------------------------------------------------------------
// The shape of the bowl. The front wall of the stands is a rounded
// rectangle. Walking around it you pass eight pieces: four straight
// sides and four corners. Everything that follows the bowl (tiers,
// walls, the roof, the crowd, the big screen) is built by sweeping a
// cross-section around these pieces.
// ------------------------------------------------------------------

export type PathPoint = {
  x: number;
  z: number;
  nx: number; // outward direction (away from the pitch)
  nz: number;
  tx: number; // direction of travel around the bowl
  tz: number;
};

export type Piece = {
  index: number;
  kind: "straight" | "corner";
  // Which side of the ground this piece is on. North is +X, east is +Z.
  side: "east" | "south" | "west" | "north" | "corner";
  length: (d: number) => number;
  at: (t: number, d: number) => PathPoint;
};

// Piece indices, by name. North is +X and east is +Z, so the main stand
// (-Z) is the west stand.
export const PIECE = {
  east: 0, // +Z side, opposite the main stand
  cornerNE: 1,
  north: 2, // +X end
  cornerNW: 3,
  west: 4, // -Z side: the main stand
  cornerSW: 5,
  south: 6, // -X end
  cornerSE: 7,
} as const;

function straight(index: number, side: Piece["side"], x0: number, z0: number, x1: number, z1: number, nx: number, nz: number): Piece {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const tx = (x1 - x0) / len;
  const tz = (z1 - z0) / len;
  return {
    index,
    kind: "straight",
    side,
    length: () => len,
    at: (t, d) => ({ x: x0 + (x1 - x0) * t + nx * d, z: z0 + (z1 - z0) * t + nz * d, nx, nz, tx, tz }),
  };
}

function corner(index: number, cx: number, cz: number, r: number, a0: number, a1: number): Piece {
  return {
    index,
    kind: "corner",
    side: "corner",
    length: (d) => Math.abs(a1 - a0) * (r + d),
    at: (t, d) => {
      const a = a0 + (a1 - a0) * t;
      const nx = Math.cos(a);
      const nz = Math.sin(a);
      const dir = Math.sign(a1 - a0);
      return { x: cx + nx * (r + d), z: cz + nz * (r + d), nx, nz, tx: -nz * dir, tz: nx * dir };
    },
  };
}

export function bowlPieces(bowl: { hx: number; hz: number; r: number } = BOWL): Piece[] {
  const { hx, hz, r } = bowl;
  const sx = hx - r; // half-length of the straight parts
  const sz = hz - r;
  const H = Math.PI / 2;
  return [
    straight(0, "east", -sx, hz, sx, hz, 0, 1),
    corner(1, sx, sz, r, H, 0),
    straight(2, "north", hx, sz, hx, -sz, 1, 0),
    corner(3, sx, -sz, r, 0, -H),
    straight(4, "west", sx, -hz, -sx, -hz, 0, -1),
    corner(5, -sx, -sz, r, -H, -2 * H),
    straight(6, "south", -hx, -sz, -hx, sz, -1, 0),
    corner(7, -sx, sz, r, -2 * H, -3 * H),
  ];
}

export const PIECES = bowlPieces();

export type BandOptions = {
  pieces?: Piece[];
  // Texture size in metres: one repeat of the texture covers this much
  uSize?: number;
  vSize?: number;
  // Longest allowed segment along a straight, and segments per corner
  segmentLength?: number;
  cornerSegments?: number;
  // Leave a gap: return true to skip the stretch from t0 to t1 of a piece
  skip?: (piece: Piece, t0: number, t1: number) => boolean;
  // Restrict to some pieces
  only?: number[];
  // Keep the texture running continuously round the whole bowl instead
  // of restarting on each piece (for the scrolling screens)
  continuousU?: boolean;
};

// One strip of surface between two rings of the cross-section, all the
// way round the bowl. The direction from `a` to `b` decides which way
// the surface faces: going outward and up gives a surface you can sit
// on, going straight up gives a wall that faces the pitch, and going
// inward gives a ceiling.
export function sweepBand(a: Ring, b: Ring, options: BandOptions = {}): BufferGeometry {
  const pieces = options.pieces ?? PIECES;
  const uSize = options.uSize ?? 1;
  const vSize = options.vSize ?? 1;
  const segLen = options.segmentLength ?? 6;
  const cornerSegs = options.cornerSegments ?? 14;

  const positions: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const dd = b.d - a.d;
  const dy = b.y - a.y;
  const profileLen = Math.hypot(dd, dy) || 1;
  // Normal of the strip within the cross-section plane
  const nd = -dy / profileLen;
  const ny = dd / profileLen;
  const dMid = (a.d + b.d) / 2;
  let travelled = 0;

  for (const piece of pieces) {
    const len = piece.length(dMid);
    const start = options.continuousU ? travelled : 0;
    travelled += len;
    if (options.only && !options.only.includes(piece.index)) continue;
    const n = piece.kind === "corner" ? cornerSegs : Math.max(1, Math.ceil(len / segLen));
    for (let i = 0; i < n; i++) {
      const t0 = i / n;
      const t1 = (i + 1) / n;
      if (options.skip?.(piece, t0, t1)) continue;
      const base = positions.length / 3;
      for (const t of [t0, t1]) {
        const pa = piece.at(t, a.d);
        const pb = piece.at(t, b.d);
        positions.push(pa.x, a.y, pa.z, pb.x, b.y, pb.z);
        for (let k = 0; k < 2; k++) normals.push(nd * pa.nx, ny, nd * pa.nz);
        const u = (start + t * len) / uSize;
        uvs.push(u, 0, u, profileLen / vSize);
      }
      // a0, b0, a1, b1
      indices.push(base, base + 1, base + 2, base + 2, base + 1, base + 3);
    }
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  fixWinding(geometry);
  return geometry;
}

// Makes every triangle face the same way as the normals we wrote, so
// the surface is visible from the side it is meant to be seen from.
function fixWinding(geometry: BufferGeometry) {
  const pos = geometry.getAttribute("position");
  const nor = geometry.getAttribute("normal");
  const index = geometry.getIndex();
  if (!index || index.count < 3) return;
  const [i0, i1, i2] = [index.getX(0), index.getX(1), index.getX(2)];
  const ax = pos.getX(i1) - pos.getX(i0);
  const ay = pos.getY(i1) - pos.getY(i0);
  const az = pos.getZ(i1) - pos.getZ(i0);
  const bx = pos.getX(i2) - pos.getX(i0);
  const by = pos.getY(i2) - pos.getY(i0);
  const bz = pos.getZ(i2) - pos.getZ(i0);
  const fx = ay * bz - az * by;
  const fy = az * bx - ax * bz;
  const fz = ax * by - ay * bx;
  const dot = fx * nor.getX(i0) + fy * nor.getY(i0) + fz * nor.getZ(i0);
  if (dot < 0) {
    const arr = index.array;
    for (let i = 0; i < arr.length; i += 3) {
      const tmp = arr[i + 1];
      arr[i + 1] = arr[i + 2];
      arr[i + 2] = tmp;
    }
    index.needsUpdate = true;
  }
}

export function sweepBands(bands: { a: Ring; b: Ring }[], options: BandOptions = {}): BufferGeometry {
  const parts = bands.map(({ a, b }) => sweepBand(a, b, options));
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  return merged ?? new BufferGeometry();
}

// A flat ring-shaped floor or ceiling between two offsets at one height
export function sweepFlat(dInner: number, dOuter: number, y: number, facing: "up" | "down", options: BandOptions = {}): BufferGeometry {
  return facing === "up" ? sweepBand({ d: dInner, y }, { d: dOuter, y }, options) : sweepBand({ d: dOuter, y }, { d: dInner, y }, options);
}

// The distance all the way round the bowl at offset `d`
export function perimeter(d: number): number {
  return PIECES.reduce((sum, piece) => sum + piece.length(d), 0);
}

// The outline of the bowl at offset `d`, as points (for flat shapes
// such as the roof opening)
export function outline(d: number, cornerSegments = 12): { x: number; z: number }[] {
  const points: { x: number; z: number }[] = [];
  for (const piece of PIECES) {
    const n = piece.kind === "corner" ? cornerSegments : 1;
    for (let i = 0; i < n; i++) {
      const p = piece.at(i / n, d);
      points.push({ x: p.x, z: p.z });
    }
  }
  return points;
}
