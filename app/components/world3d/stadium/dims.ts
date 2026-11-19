// ------------------------------------------------------------------
// The stadium's measurements, in metres. One unit in the 3D world is
// one metre. The pitch is centred on the origin with its length along
// X and its width along Z. The main stand (tunnel, dugouts, crowd card
// display) is on the -Z side.
// ------------------------------------------------------------------

export const PITCH = {
  length: 105,
  width: 68,
  halfLength: 52.5,
  halfWidth: 34,
  penaltyAreaDepth: 16.5,
  penaltyAreaWidth: 40.32,
  goalAreaDepth: 5.5,
  goalAreaWidth: 18.32,
  penaltySpot: 11,
  circleRadius: 9.15,
  goalWidth: 7.32,
  goalHeight: 2.44,
  goalDepth: 2.2,
} as const;

// The front wall of the stands is a rounded rectangle around the pitch.
// hx / hz are its half-sizes, r its corner radius.
export const BOWL = { hx: 62, hz: 42, r: 20 } as const;

// A point on the stand's cross-section: `d` metres back from the front
// wall, `y` metres above the pitch.
export type Ring = { d: number; y: number };

// The cross-section of the stands, from the pitch upward: four tiers
// of seats with a wall (a "fascia") between each.
export const TIERS: { from: Ring; to: Ring }[] = [
  { from: { d: 1.4, y: 1.25 }, to: { d: 17, y: 9.2 } },
  { from: { d: 17.4, y: 12.4 }, to: { d: 29.6, y: 21.2 } },
  { from: { d: 30, y: 23.6 }, to: { d: 41, y: 32.5 } },
  { from: { d: 41.4, y: 34.6 }, to: { d: 51, y: 43.6 } },
];

export const FRONT_WALL_HEIGHT = 1.25;
export const BACK_WALL = { d: 51, y: 43.6 } as const;

// The roof: a fixed ring over the stands, with an opening over the
// pitch that the sliding panels close.
export const ROOF = {
  outerY: 53, // height at the back of the stands
  innerY: 49.5, // height at the edge of the opening
  openingInset: -4, // the opening's edge, as a `d` (negative = over the pitch side)
  thickness: 2.2,
  panelCount: 10,
} as const;

// The big screen: a band of LED hanging around the roof opening
export const HALO = {
  d: -4.3,
  bottom: 42.8,
  top: 48.6,
} as const;

// Seats: how far apart fans sit, and how deep a row is
export const SEATING = {
  seatWidth: 0.8,
  rowDepth: 0.86,
} as const;

// The crowd card display on the main stand: 53 weeks by 7 days
export const MOSAIC = {
  tier: 1, // index into TIERS (the second tier)
  weeks: 53,
  days: 7,
  fansPerWeek: 2,
  rowsPerDay: 2,
} as const;

// Pitch-side things
export const TUNNEL = { halfWidth: 3, height: 3.1, length: 26 } as const;
export const DUGOUT = { x: 15, width: 11, depth: 2.4, height: 2.3 } as const;
export const AD_BOARD = { height: 0.95, offsetZ: 4.2, offsetX: 5.4 } as const;
