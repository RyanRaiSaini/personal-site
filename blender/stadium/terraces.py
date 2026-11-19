"""The concrete of the seating bowl: every step of every tier, the
entrances cut into the upper tiers, and the housing over the tunnel."""

from . import layout as L
from . import params as P
from .path import PIECES, WEST, start_of

UP = (0.0, 1.0, 0.0)


def build_steps(b):
    """One flat step and one riser for every row, all the way round."""
    tunnel_rows = L.tunnel_rows()
    for tier in P.TIERS:
        rows = tier["rows"]
        removed = set()
        if tier["vomitory"]:
            first, behind = L.vomitory_rows(tier)
            removed = set(range(first + 1, behind))
        for piece in PIECES:
            ts = L.cuts(tier, piece)
            for ta, tb in zip(ts, ts[1:]):
                tm = (ta + tb) / 2
                kind = L.kinds(tier, piece, tm)
                face_in = L.inward(piece, tm)
                for j in range(rows):
                    in_tunnel = "tunnel" in kind and j < tunnel_rows
                    in_entrance = "vomitory" in kind and j in removed
                    if in_tunnel or in_entrance:
                        continue
                    y = L.row_y(tier, j)
                    da = L.row_d(tier, j)
                    db = da + P.TREAD
                    u0 = start_of(piece, da) + ta * piece.length(da)
                    u1 = start_of(piece, da) + tb * piece.length(da)
                    v0 = j * (P.TREAD + tier["rise"])
                    material = "Aisle" if "aisle" in kind else "Concrete"
                    b.quad(
                        L.point(piece, ta, da, y), L.point(piece, tb, da, y), L.point(piece, tb, db, y), L.point(piece, ta, db, y),
                        material, UP, [(u0, v0), (u1, v0), (u1, v0 + P.TREAD), (u0, v0 + P.TREAD)],
                    )
                    # the riser up to the next row
                    if j == rows - 1:
                        continue
                    if "vomitory" in kind and (j + 1) in removed:
                        continue
                    y2 = L.row_y(tier, j + 1)
                    smooth = None
                    if piece.kind == "corner":
                        na, nb = L.inward(piece, ta), L.inward(piece, tb)
                        smooth = [na, nb, nb, na]
                    b.quad(
                        L.point(piece, ta, db, y), L.point(piece, tb, db, y), L.point(piece, tb, db, y2), L.point(piece, ta, db, y2),
                        "Riser", face_in, [(u0, v0 + P.TREAD), (u1, v0 + P.TREAD), (u1, v0 + P.TREAD + tier["rise"]), (u0, v0 + P.TREAD + tier["rise"])], smooth,
                    )


def build_entrances(walls, glass):
    """The entrances ("vomitories") cut into the three upper tiers: a
    level floor, two side walls, a dark doorway and glass guards."""
    for tier in P.TIERS:
        if not tier["vomitory"]:
            continue
        first, behind = L.vomitory_rows(tier)
        floor_y = L.row_y(tier, first)
        d_front = L.row_d(tier, first + 1)
        d_door = L.row_d(tier, behind)
        door_top = L.row_y(tier, behind)
        for piece in PIECES:
            wv = L.half_t(piece, L.mid_d(tier), P.VOMITORY_WIDTH)
            for c in L.vomitory_aisles(tier, piece):
                ta, tb = c - wv, c + wv
                face_in = L.inward(piece, c)
                # floor
                walls.quad(
                    L.point(piece, ta, d_front, floor_y), L.point(piece, tb, d_front, floor_y), L.point(piece, tb, d_door, floor_y), L.point(piece, ta, d_door, floor_y),
                    "Concrete", UP, [(0, 0), (P.VOMITORY_WIDTH, 0), (P.VOMITORY_WIDTH, d_door - d_front), (0, d_door - d_front)],
                )
                # doorway into the dark
                walls.quad(
                    L.point(piece, ta, d_door, floor_y), L.point(piece, tb, d_door, floor_y), L.point(piece, tb, d_door, door_top), L.point(piece, ta, d_door, door_top),
                    "Void", face_in,
                )
                # guard above the doorway
                glass.quad(
                    L.point(piece, ta, d_door + 0.05, door_top), L.point(piece, tb, d_door + 0.05, door_top),
                    L.point(piece, tb, d_door + 0.05, door_top + 1.05), L.point(piece, ta, d_door + 0.05, door_top + 1.05),
                    "Glass", face_in,
                )
                # side walls and their guards, stepping up with the rows
                for t_edge, t_other in ((ta, tb), (tb, ta)):
                    a = L.point(piece, t_edge, d_front, floor_y)
                    o = L.point(piece, t_other, d_front, floor_y)
                    toward = (o[0] - a[0], 0.0, o[2] - a[2])
                    for j in range(first + 1, behind):
                        y = L.row_y(tier, j)
                        da = L.row_d(tier, j)
                        db = da + P.TREAD
                        walls.quad(
                            L.point(piece, t_edge, da, floor_y), L.point(piece, t_edge, db, floor_y), L.point(piece, t_edge, db, y), L.point(piece, t_edge, da, y),
                            "WallDark", toward, [(0, 0), (P.TREAD, 0), (P.TREAD, y - floor_y), (0, y - floor_y)],
                        )
                        glass.quad(
                            L.point(piece, t_edge, da, y), L.point(piece, t_edge, db, y), L.point(piece, t_edge, db, y + 1.05), L.point(piece, t_edge, da, y + 1.05),
                            "Glass", toward,
                        )


def build_tunnel_housing(walls):
    """The solid box over the players' tunnel in the main stand. The
    tunnel's inside (walls, lights) is drawn by the website."""
    tier = P.TIERS[0]
    piece = PIECES[WEST]
    rows = L.tunnel_rows()
    d_back = L.row_d(tier, rows)
    lid = L.TUNNEL_LID
    half = L.TUNNEL_HALF
    inner = P.TUNNEL["half_width"]
    z0 = -P.BOWL["hz"]  # the front wall of the main stand
    z1 = z0 - d_back
    # lid
    walls.quad((-half, lid, z0), (half, lid, z0), (half, lid, z1), (-half, lid, z1), "WallDark", UP, [(0, 0), (2 * half, 0), (2 * half, d_back), (0, d_back)])
    # outer sides, seen above the rows beside it
    for s in (-1, 1):
        x = s * half
        walls.quad((x, 0.0, z0), (x, 0.0, z1), (x, lid, z1), (x, lid, z0), "WallDark", (s, 0.0, 0.0), [(0, 0), (d_back, 0), (d_back, lid), (0, lid)])
        # the jamb each side of the opening
        walls.quad((s * inner, 0.0, z0), (x, 0.0, z0), (x, lid, z0), (s * inner, lid, z0), "WallDark", (0.0, 0.0, 1.0), [(0, 0), (half - inner, 0), (half - inner, lid), (0, lid)])
    # the band above the opening
    walls.quad((-inner, P.TUNNEL["height"], z0), (inner, P.TUNNEL["height"], z0), (inner, lid, z0), (-inner, lid, z0), "WallDark", (0.0, 0.0, 1.0))
    # the step up from the lid to the first row behind it
    y_back = L.row_y(tier, rows)
    walls.quad((-half, lid, z1), (half, lid, z1), (half, y_back, z1), (-half, y_back, z1), "Riser", (0.0, 0.0, 1.0))
    _ = piece
