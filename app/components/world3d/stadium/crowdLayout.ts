import { seeded } from "../textures/canvas";
import { MOSAIC, SEATING, TIERS, TUNNEL } from "./dims";
import { PIECE, PIECES } from "./path";

// ------------------------------------------------------------------
// Where every fan sits. Walks each row of each tier round the bowl and
// puts a fan in most seats, leaving aisles, a few empty seats and the
// space above the tunnel. The fans in the second tier of the main
// stand are placed on an exact grid, because they hold up the cards
// that show my GitHub contributions.
// ------------------------------------------------------------------

export type CrowdLayout = {
  count: number;
  positions: Float32Array; // x, y, z per fan
  facing: Float32Array; // rotation about Y per fan
  shirts: Float32Array; // r, g, b per fan (linear colour)
  skins: Float32Array; // r, g, b per fan
  seeds: Float32Array; // 0 to 1 per fan, for variety
  // The card holders: for each, its fan index and its cell in the
  // 53 x 7 contribution grid
  cards: { fan: number; week: number; day: number }[];
};

// Mostly white, for the home end, with enough dark coats and stray
// colours to look like a real crowd
const SHIRTS: [number, string][] = [
  [0.44, "#f2f2ee"],
  [0.1, "#d9dbe0"],
  [0.1, "#1b2a55"],
  [0.12, "#14161c"],
  [0.05, "#5b4a9c"],
  [0.04, "#c8a94a"],
  [0.04, "#8f1f2b"],
  [0.05, "#3c5a78"],
  [0.06, "#6a6f7a"],
];

const SKINS = ["#f1c9a5", "#e0ac84", "#c68a5e", "#a5683f", "#7c4a2a", "#553019"];

function hexToLinear(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  const toLinear = (c: number) => {
    const s = c / 255;
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return [toLinear((n >> 16) & 255), toLinear((n >> 8) & 255), toLinear(n & 255)];
}

const SHIRT_COLORS = SHIRTS.map(([weight, hex]) => ({ weight, rgb: hexToLinear(hex) }));
const SKIN_COLORS = SKINS.map(hexToLinear);

function pickShirt(r: number): [number, number, number] {
  let acc = 0;
  for (const { weight, rgb } of SHIRT_COLORS) {
    acc += weight;
    if (r <= acc) return rgb;
  }
  return SHIRT_COLORS[0].rgb;
}

// `density` is the share of seats that are filled: 1 for the best
// machines, less for phones
export function layoutCrowd(density: number): CrowdLayout {
  const rand = seeded(20261119);
  const positions: number[] = [];
  const facing: number[] = [];
  const shirts: number[] = [];
  const skins: number[] = [];
  const seeds: number[] = [];
  const cards: CrowdLayout["cards"] = [];

  const mosaicSeats = MOSAIC.weeks * MOSAIC.fansPerWeek;

  TIERS.forEach(({ from, to }, tierIndex) => {
    const rows = Math.round((to.d - from.d) / SEATING.rowDepth);
    for (let row = 0; row < rows; row++) {
      const f = (row + 0.5) / rows;
      const d = from.d + (to.d - from.d) * f;
      const y = from.y + (to.y - from.y) * f;

      for (const piece of PIECES) {
        const len = piece.length(d);
        const isMosaic = tierIndex === MOSAIC.tier && piece.index === PIECE.west && row < MOSAIC.days * MOSAIC.rowsPerDay;
        const seats = isMosaic ? mosaicSeats : Math.floor(len / SEATING.seatWidth);

        for (let seat = 0; seat < seats; seat++) {
          const t = (seat + 0.5) / seats;
          const along = t * len;

          if (!isMosaic) {
            // an aisle every 14 metres on the straights
            if (piece.kind === "straight" && along % 14 < 0.95) continue;
            // the tunnel comes out under the first rows of the main stand
            if (piece.index === PIECE.west && tierIndex === 0 && d < 7.5 && Math.abs(len / 2 - along) < TUNNEL.halfWidth + 1.2) continue;
            // a few empty seats, and fewer fans on slower machines
            if (rand() > 0.94 * density) continue;
          }

          const p = piece.at(t, d);
          const index = seeds.length;
          positions.push(p.x, y, p.z);
          facing.push(Math.atan2(-p.nx, -p.nz) + (isMosaic ? 0 : (rand() - 0.5) * 0.5));
          const shirt = pickShirt(rand());
          shirts.push(shirt[0], shirt[1], shirt[2]);
          const skin = SKIN_COLORS[Math.floor(rand() * SKIN_COLORS.length)];
          skins.push(skin[0], skin[1], skin[2]);
          seeds.push(rand());

          if (isMosaic) {
            // Seen from across the pitch, weeks run left to right (south
            // to north) and Sunday is the top row
            const week = MOSAIC.weeks - 1 - Math.floor(seat / MOSAIC.fansPerWeek);
            const day = MOSAIC.days - 1 - Math.floor(row / MOSAIC.rowsPerDay);
            cards.push({ fan: index, week, day });
          }
        }
      }
    }
  });

  return {
    count: seeds.length,
    positions: new Float32Array(positions),
    facing: new Float32Array(facing),
    shirts: new Float32Array(shirts),
    skins: new Float32Array(skins),
    seeds: new Float32Array(seeds),
    cards,
  };
}
