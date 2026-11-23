// ------------------------------------------------------------------
// The stadium's measurements, in metres. One unit in the 3D world is
// one metre. The pitch is centred on the origin with its length along
// X and its width along Z. North is +X and east is +Z, so the main
// stand (tunnel, dugouts, crowd card display) on the -Z side is the
// west stand, as at the real ground.
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

// A point on a cross-section of the stands: `d` metres back from the
// front wall, `y` metres above the pitch.
export type Ring = { d: number; y: number };

// The stands, the roof, the ring of screens and the seats are a model
// built in Blender. Their measurements live in blender/stadium/params.py;
// the few the site itself needs are repeated here and must match.
export const FRONT_WALL_HEIGHT = 1.25;

// The roof: a fixed ring over the stands, with an opening over the
// pitch that the sliding panels close.
export const ROOF = {
  innerY: 50.6, // height of the ceiling at the edge of the opening
  openingInset: -4, // the opening's edge, as a `d` (negative = over the pitch side)
} as const;

// The ring of screens under the inner edge of the roof
export const SCREEN = { d: -4.6, bottom: 43.4, top: 48.9 } as const;

// The front edge of the main stand's second tier, where the GitHub
// scoreboard hangs: `d` back from the front wall, the underside of its
// slab at `bottom`
export const SECOND_TIER = { d: 15.8, bottom: 11.4 } as const;

// Pitch-side things
export const TUNNEL = { halfWidth: 3, height: 3.1, length: 26 } as const;
export const DUGOUT = { x: 15, width: 11, depth: 2.4, height: 2.3 } as const;
export const AD_BOARD = { height: 0.95, offsetZ: 4.2, offsetX: 5.4 } as const;
// The flash-interview backdrop (Contact): on the grass between the tunnel
// and the home dugout, in front of the advertising boards, facing the
// pitch. x and z are its middle, at the foot.
export const FLASH = { x: 6.3, z: -37.4, width: 3.6, height: 2.3 } as const;
