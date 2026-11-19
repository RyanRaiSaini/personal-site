"""The seats: two versions of one tip-up seat (detailed for close views,
plain for far ones) and the list of where every seat goes.

The website draws the seats itself, as thousands of copies of one
shape, so only the shape and the list of positions are exported."""

import math
import struct

from . import layout as L
from . import params as P
from .builder import Builder
from .path import EAST, NORTH, PIECES, SOUTH, WEST

UP = (0.0, 1.0, 0.0)

SEAT_WIDTH = 0.44
SEAT_BACK_SET = 0.15  # how far in front of the riser behind it the seat's back stands

# The picture made of seats on the main stand: a year of weeks, a week of days
MOSAIC = {"tier": 1, "weeks": 53, "days": 7, "seats_per_week": 2, "rows_per_day": 2, "first_row": 1}


def build_seat(name, detailed):
    """A tip-up seat with its pan folded up, as in an empty ground.
    Drawn around the middle of its step, facing +z (toward the pitch)."""
    b = Builder(name)
    w = SEAT_WIDTH
    if not detailed:
        # one slim block for the folded pan and back together
        b.box((0.0, 0.62, 0.035), (w, 0.44, 0.13), "SeatPlastic")
        return b
    # the back, leaning a touch away from the pitch, in three strips so it curves
    strips = 3
    for i in range(strips):
        x0 = -w / 2 + w * i / strips
        x1 = -w / 2 + w * (i + 1) / strips
        bow0 = 0.018 * (1 - (2 * (i / strips) - 1) ** 2)
        bow1 = 0.018 * (1 - (2 * ((i + 1) / strips) - 1) ** 2)
        lo, hi = 0.40, 0.84
        for (za, zb, facing) in ((0.0, 0.0, (0.0, 0.0, 1.0)), (-0.035, -0.035, (0.0, 0.0, -1.0))):
            b.quad((x0, lo, za - bow0), (x1, lo, zb - bow1), (x1, hi, zb - bow1 - 0.05), (x0, hi, za - bow0 - 0.05), "SeatPlastic", facing)
        b.quad((x0, hi, -bow0 - 0.05), (x1, hi, -bow1 - 0.05), (x1, hi, -bow1 - 0.085), (x0, hi, -bow0 - 0.085), "SeatPlastic", UP)
    for s in (-1, 1):
        x = s * w / 2
        b.quad((x, 0.40, 0.0), (x, 0.40, -0.035), (x, 0.84, -0.085), (x, 0.84, -0.05), "SeatPlastic", (s, 0.0, 0.0))
    # the pan, folded up against the back
    tilt = math.radians(14)
    ax = (1.0, 0.0, 0.0)
    ay = (0.0, math.cos(tilt), math.sin(tilt))
    az = (0.0, -math.sin(tilt), math.cos(tilt))
    b.box((0.0, 0.60, 0.085), (w - 0.03, 0.40, 0.045), "SeatPlastic", (ax, ay, az))
    # the bracket that holds it to the step behind
    b.box((0.0, 0.36, -0.02), (0.30, 0.10, 0.12), "SeatFrame")
    return b


def _tier_piece_seats(tier_index, tier, piece):
    """Seats on one piece of one tier, as (x, y, z, yaw, row, bay, along)."""
    out = []
    tunnel_rows = L.tunnel_rows()
    removed = set()
    if tier["vomitory"]:
        first, behind = L.vomitory_rows(tier)
        removed = set(range(first, behind + 1))  # the entrance, and a row of clearance
    ts = L.cuts(tier, piece)
    aisle_ts = L.aisles(tier, piece)
    for ta, tb in zip(ts, ts[1:]):
        tm = (ta + tb) / 2
        kind = L.kinds(tier, piece, tm)
        if "aisle" in kind:
            continue
        # which block between two aisles this stretch belongs to
        bay = max(0, sum(1 for c in aisle_ts if c <= tm) - 1)
        for j in range(tier["rows"]):
            if "tunnel" in kind and j < tunnel_rows:
                continue
            if "vomitory" in kind and j in removed:
                continue
            d = L.row_d(tier, j) + P.TREAD - SEAT_BACK_SET
            y = L.row_y(tier, j)
            length = (tb - ta) * piece.length(d)
            n = int((length - 0.06) / P.SEAT_PITCH)
            if n < 1:
                continue
            margin = (length - n * P.SEAT_PITCH) / 2
            for i in range(n):
                s = margin + (i + 0.5) * P.SEAT_PITCH
                t = ta + (tb - ta) * (s / length)
                x, z, nx, nz = piece.at(t, d)
                yaw = math.atan2(-nx, -nz)  # turned to face the pitch
                out.append((x, y, z, yaw, j, bay, t))
    return out


def all_seats():
    """Every seat, grouped into chunks the website can show or hide together.

    Returns (seats, chunks). A seat is (x, y, z, yaw, tier, row, week, day);
    week and day are 255 unless the seat is part of the picture on the
    main stand. A chunk is {tier, piece, bay, start, count, centre, radius}.
    """
    seats, chunks = [], []
    for tier_index, tier in enumerate(P.TIERS):
        for piece in PIECES:
            by_bay = {}
            for seat in _tier_piece_seats(tier_index, tier, piece):
                by_bay.setdefault(seat[5], []).append(seat)
            for bay in sorted(by_bay):
                group = by_bay[bay]
                start = len(seats)
                for (x, y, z, yaw, row, _bay, t) in group:
                    week = day = 255
                    if tier_index == MOSAIC["tier"] and piece.index == WEST:
                        # seats counted from the south end, so the year reads left to right from the pitch
                        along = (1.0 - t) * piece.length()
                        width = MOSAIC["weeks"] * MOSAIC["seats_per_week"] * P.SEAT_PITCH
                        offset = along - (piece.length() - width) / 2
                        w = int(offset // (MOSAIC["seats_per_week"] * P.SEAT_PITCH)) if offset >= 0 else -1
                        r = row - MOSAIC["first_row"]
                        dd = MOSAIC["days"] - 1 - (r // MOSAIC["rows_per_day"]) if r >= 0 else -1
                        if 0 <= w < MOSAIC["weeks"] and 0 <= dd < MOSAIC["days"]:
                            week, day = w, dd
                    seats.append((x, y, z, yaw, tier_index, row, week, day))
                xs = [s[0] for s in group]
                ys = [s[1] for s in group]
                zs = [s[2] for s in group]
                cx, cy, cz = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, (min(zs) + max(zs)) / 2
                radius = max(math.dist((cx, cy, cz), (s[0], s[1], s[2])) for s in group) + 1.0
                chunks.append({"tier": tier_index, "piece": piece.index, "bay": bay, "start": start, "count": len(group),
                               "centre": [round(cx, 2), round(cy + 0.5, 2), round(cz, 2)], "radius": round(radius, 2)})
    return seats, chunks


def write_seats(path_positions, path_details, seats, light):
    """Two small files: positions (x, y, z, turn) as numbers, and a few
    details per seat (tier, row, light, week, day) as bytes."""
    with open(path_positions, "wb") as f:
        for (x, y, z, yaw, *_rest) in seats:
            f.write(struct.pack("<4f", x, y, z, yaw))
    with open(path_details, "wb") as f:
        for (seat, lit) in zip(seats, light):
            _x, _y, _z, _yaw, tier, row, week, day = seat
            f.write(struct.pack("<8B", tier, row, max(0, min(255, round(lit[0] * 255))), max(0, min(255, round(lit[1] * 255))), week, day, 0, 0))


_ = (EAST, NORTH, SOUTH)
