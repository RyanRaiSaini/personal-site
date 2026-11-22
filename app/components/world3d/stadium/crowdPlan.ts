// ------------------------------------------------------------------
// Which seats have a fan in them. The crowd (Crowd.tsx) puts a fan in
// these seats, and the seats themselves (Seats.tsx) are darkened
// there, as legs and coats cover a seat that is taken.
//
// Plain numbers with no 3D code in it, so it is safe to import anywhere.
// ------------------------------------------------------------------

// The share of seats that are taken
export const OCCUPANCY = 0.86;

// A repeatable random number from 0 to 1 for seat `i`, stream `k`
export function seatHash(i: number, k: number): number {
  return (((i * 2654435761) ^ (k * 2246822519)) >>> 0) / 4294967295;
}

export function isTaken(seat: number): boolean {
  return seatHash(seat, 1) < OCCUPANCY;
}
