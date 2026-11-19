// ------------------------------------------------------------------
// Where every seat goes.
//
// Blender (blender/build.py) writes three small files next to the model:
//
//   manifest.json          counts, and the seats grouped into chunks
//   seats-positions.bin    x, y, z and turn for every seat
//   seats-details.bin      tier, row, light and place in the picture
//
// This file fetches and unpacks them. Nothing here draws anything; the
// drawing is in Seats.tsx.
// ------------------------------------------------------------------

export type SeatChunk = {
  tier: number;
  piece: number; // which of the bowl's eight pieces (see path.ts)
  bay: number;
  start: number;
  count: number;
  centre: [number, number, number];
  radius: number;
};

export type StadiumManifest = {
  seats: number;
  chunks: SeatChunk[];
  roof: { innerD: number; innerY: number; panelCount: number; panelWidth: number; panelDepth: number; panelY: number; panelClosedX: number[] };
  mosaic: { tier: number; weeks: number; days: number };
};

export type SeatData = {
  manifest: StadiumManifest;
  // four numbers per seat: x, y, z, turn (radians about the upright axis)
  positions: Float32Array;
  // eight bytes per seat: tier, row, sky, pitch, week, day, spare, spare
  details: Uint8Array;
};

export const SEAT_FILES = {
  manifest: "/stadium/manifest.json",
  positions: "/stadium/seats-positions.bin",
  details: "/stadium/seats-details.bin",
};

let pending: Promise<SeatData> | null = null;

async function fetchOk(url: string): Promise<Response> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load ${url} (${response.status})`);
  return response;
}

// Starts the download once and hands every caller the same result
export function loadSeatData(): Promise<SeatData> {
  pending ??= (async () => {
    const [manifest, positions, details] = await Promise.all([
      fetchOk(SEAT_FILES.manifest).then((r) => r.json() as Promise<StadiumManifest>),
      fetchOk(SEAT_FILES.positions).then((r) => r.arrayBuffer()),
      fetchOk(SEAT_FILES.details).then((r) => r.arrayBuffer()),
    ]);
    return { manifest, positions: new Float32Array(positions), details: new Uint8Array(details) };
  })();
  return pending;
}
