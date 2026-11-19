"""The shape of the bowl.

The front wall of the stands is a rounded rectangle. Walking round it
you pass eight pieces: four straight sides and four corners. Everything
that follows the bowl is built by sweeping a cross-section round these
pieces. This mirrors app/components/world3d/stadium/path.ts, piece for
piece, so the model and the website agree on where things are.
"""

import math

from .params import BOWL

H = math.pi / 2

EAST, CORNER_NE, NORTH, CORNER_NW, WEST, CORNER_SW, SOUTH, CORNER_SE = range(8)
SIDE_NAMES = ["east", "corner_ne", "north", "corner_nw", "west", "corner_sw", "south", "corner_se"]


class Straight:
    kind = "straight"

    def __init__(self, index, x0, z0, x1, z1, nx, nz):
        self.index = index
        self.x0, self.z0, self.x1, self.z1 = x0, z0, x1, z1
        self.nx, self.nz = nx, nz
        self._len = math.hypot(x1 - x0, z1 - z0)
        self.tx = (x1 - x0) / self._len
        self.tz = (z1 - z0) / self._len

    def length(self, d=0.0):
        return self._len

    def at(self, t, d):
        """A point `d` metres outside the front wall, `t` of the way along."""
        return (
            self.x0 + (self.x1 - self.x0) * t + self.nx * d,
            self.z0 + (self.z1 - self.z0) * t + self.nz * d,
            self.nx,
            self.nz,
        )


class Corner:
    kind = "corner"

    def __init__(self, index, cx, cz, r, a0, a1):
        self.index = index
        self.cx, self.cz, self.r, self.a0, self.a1 = cx, cz, r, a0, a1

    def length(self, d=0.0):
        return abs(self.a1 - self.a0) * (self.r + d)

    def at(self, t, d):
        a = self.a0 + (self.a1 - self.a0) * t
        nx, nz = math.cos(a), math.sin(a)
        return (self.cx + nx * (self.r + d), self.cz + nz * (self.r + d), nx, nz)


def bowl_pieces(bowl=BOWL):
    hx, hz, r = bowl["hx"], bowl["hz"], bowl["r"]
    sx, sz = hx - r, hz - r
    return [
        Straight(EAST, -sx, hz, sx, hz, 0, 1),
        Corner(CORNER_NE, sx, sz, r, H, 0),
        Straight(NORTH, hx, sz, hx, -sz, 1, 0),
        Corner(CORNER_NW, sx, -sz, r, 0, -H),
        Straight(WEST, sx, -hz, -sx, -hz, 0, -1),
        Corner(CORNER_SW, -sx, -sz, r, -H, -2 * H),
        Straight(SOUTH, -hx, -sz, -hx, sz, -1, 0),
        Corner(CORNER_SE, -sx, sz, r, -2 * H, -3 * H),
    ]


PIECES = bowl_pieces()


def perimeter(d):
    return sum(p.length(d) for p in PIECES)


def start_of(piece, d):
    """Distance travelled round the bowl before this piece starts."""
    return sum(p.length(d) for p in PIECES[: piece.index])
