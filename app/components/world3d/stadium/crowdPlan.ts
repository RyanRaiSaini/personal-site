// ------------------------------------------------------------------
// Which seats have a fan in them. The crowd (Crowd.tsx) puts a fan in
// these seats, and the seats themselves (Seats.tsx) are darkened
// there, as legs and coats cover a seat that is taken.
//
// Plain numbers with no 3D code in it, so it is safe to import anywhere.
// ------------------------------------------------------------------

// The share of seats that are taken
export const OCCUPANCY = 0.86;

// A repeatable random number from 0 to 1 for seat `i`, stream `k`.
// The streams must not be related to one another (whether a seat is
// taken must say nothing about the fan's pose or shirt), so the two
// numbers are mixed thoroughly, as a hash table would.
export function seatHash(i: number, k: number): number {
  let h = Math.imul(i ^ Math.imul(k + 1, 0x9e3779b9), 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  h = Math.imul(h ^ (k * 0x27d4eb2d), 0x165667b1);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}

export function isTaken(seat: number): boolean {
  return seatHash(seat, 1) < OCCUPANCY;
}
