"""Where things sit round the bowl: rows, aisles, entrances and the tunnel.

Both the concrete (terraces.py) and the seats (seats.py) read this, so
they always agree on where the gaps are.
"""

import math

from . import params as P
from .path import PIECES, WEST

TUNNEL_HALF = P.TUNNEL["half_width"] + 0.6  # the tunnel's housing is a little wider than the tunnel
TUNNEL_LID = P.TUNNEL["height"] + 0.4


def row_d(tier, j):
    """Distance from the front wall to the front edge of row j's step."""
    lead = 0.0 if tier is P.TIERS[0] else 0.25  # upper tiers start behind a parapet
    return tier["d0"] + lead + j * P.TREAD


def row_y(tier, j):
    return tier["y0"] + j * tier["rise"]


def tier_back(tier):
    """(distance to the back of the last row, height of the last row)."""
    return row_d(tier, tier["rows"]), row_y(tier, tier["rows"] - 1)


def back_wall_d(tier):
    return tier_back(tier)[0] + P.CROSS_AISLE


def mid_d(tier):
    return (row_d(tier, 0) + tier_back(tier)[0]) / 2


def slope(tier):
    return tier["rise"] / P.TREAD


def soffit_y(tier, d):
    """Height of the underside of an upper tier, `d` metres from the front wall."""
    return tier["y0"] - P.SLAB + (d - tier["d0"]) * slope(tier)


def tunnel_rows():
    """How many rows of the lower tier the tunnel's housing replaces."""
    tier = P.TIERS[0]
    j = 0
    while row_y(tier, j) < TUNNEL_LID + 0.5:
        j += 1
    return j


def aisles(tier, piece):
    """Aisle centres along a piece, as fractions from 0 to 1, ends included."""
    if piece.kind == "straight":
        n = max(1, round(piece.length() / P.BAY_WIDTH))
    else:
        n = tier["corner_bays"]
    return [k / n for k in range(n + 1)]


def vomitory_aisles(tier, piece):
    """The aisles that have an entrance cut into the tier."""
    if not tier["vomitory"]:
        return []
    a = aisles(tier, piece)
    n = len(a) - 1
    if piece.kind == "corner":
        return [a[n // 2]] if n >= 2 else []
    inner = list(range(1, n))
    if n <= 3:
        return [a[k] for k in inner]
    return [a[k] for k in inner if k % 2 == 1]


def vomitory_rows(tier):
    """(first row, row behind the last removed row) of an entrance."""
    v = tier["vomitory"]
    return v["row"], v["row"] + v["rows"]


def half_t(piece, d, width):
    return (width / 2) / piece.length(d)


def t_of_x(piece, x):
    """Fraction along the west side for a given x (it runs north to south)."""
    return (piece.x0 - x) / (piece.x0 - piece.x1)


def x_of_t(piece, t):
    return piece.x0 + (piece.x1 - piece.x0) * t


def cuts(tier, piece, corner_steps=20, straight_step=7.0, extra=()):
    """Every place along a piece where the surface changes, sorted."""
    d = mid_d(tier)
    out = {0.0, 1.0}
    wa = half_t(piece, d, P.AISLE_WIDTH)
    for c in aisles(tier, piece):
        out.add(min(1.0, max(0.0, c - wa)))
        out.add(min(1.0, max(0.0, c + wa)))
    wv = half_t(piece, d, P.VOMITORY_WIDTH)
    for c in vomitory_aisles(tier, piece):
        out.add(c - wv)
        out.add(c + wv)
    if tier is P.TIERS[0] and piece.index == WEST:
        out.add(t_of_x(piece, TUNNEL_HALF))
        out.add(t_of_x(piece, -TUNNEL_HALF))
    if piece.kind == "corner":
        out.update(k / corner_steps for k in range(1, corner_steps))
    else:
        n = math.ceil(piece.length() / straight_step)
        out.update(k / n for k in range(1, n))
    out.update(extra)
    ordered = sorted(out)
    kept = [ordered[0]]
    for t in ordered[1:]:
        if t - kept[-1] > 1e-5:
            kept.append(t)
    return kept


def kinds(tier, piece, t):
    """What is at fraction `t` of a piece: any of 'aisle', 'vomitory', 'tunnel'."""
    d = mid_d(tier)
    found = set()
    wa = half_t(piece, d, P.AISLE_WIDTH)
    if any(abs(t - c) < wa for c in aisles(tier, piece)):
        found.add("aisle")
    wv = half_t(piece, d, P.VOMITORY_WIDTH)
    if any(abs(t - c) < wv for c in vomitory_aisles(tier, piece)):
        found.add("vomitory")
    if tier is P.TIERS[0] and piece.index == WEST and abs(x_of_t(piece, t)) < TUNNEL_HALF:
        found.add("tunnel")
    return found


def point(piece, t, d, y):
    x, z, _nx, _nz = piece.at(t, d)
    return (x, y, z)


def outward(piece, t):
    _x, _z, nx, nz = piece.at(t, 0.0)
    return (nx, 0.0, nz)


def inward(piece, t):
    nx, _, nz = outward(piece, t)
    return (-nx, 0.0, -nz)


def plain_cuts(piece, corner_steps=20, straight_step=7.0, extra=()):
    """Cuts for surfaces with no aisles in them (walls, ceilings)."""
    out = {0.0, 1.0}
    if piece.kind == "corner":
        out.update(k / corner_steps for k in range(1, corner_steps))
    else:
        n = math.ceil(piece.length() / straight_step)
        out.update(k / n for k in range(1, n))
    out.update(e for e in extra if 0.0 < e < 1.0)
    ordered = sorted(out)
    kept = [ordered[0]]
    for t in ordered[1:]:
        if t - kept[-1] > 1e-5:
            kept.append(t)
    return kept


__all__ = [name for name in globals() if not name.startswith("_")]
_ = PIECES  # re-exported for callers that walk the whole bowl
