"""Everything between the tiers: the wall at the front of the lower
tier, the fronts and undersides of the upper tiers, the walkways behind
the last rows and the walls behind those, with their boxes and doors."""

from . import layout as L
from . import params as P
from .path import PIECES, WEST, perimeter, start_of

UP = (0.0, 1.0, 0.0)
DOWN = (0.0, -1.0, 0.0)


def sweep(b, a, c, material, face, cuts_for=None, splits=1, skip=None, material_for=None, whole_u=False, v_range=None):
    """Run a straight piece of cross-section all the way round the bowl.

    a, c       the two ends of the cross-section, each (d, y)
    face       which way the surface faces within the cross-section, (d, y)
    cuts_for   returns the places to cut a piece; default suits a plain wall
    splits     cut the cross-section itself into this many strips
    skip       return True to leave a gap: skip(piece, t)
    material_for  choose a material per stretch: material_for(piece, t)
    whole_u    number the surface 0 to 1 once round the bowl (for screens)
    """
    for piece in PIECES:
        ts = cuts_for(piece) if cuts_for else L.plain_cuts(piece)
        for ta, tb in zip(ts, ts[1:]):
            tm = (ta + tb) / 2
            if skip and skip(piece, tm):
                continue
            mat = material_for(piece, tm) if material_for else material
            if mat is None:
                continue
            _x, _z, nx, nz = piece.at(tm, 0.0)
            facing = (nx * face[0], face[1], nz * face[0])
            # on a corner the surface turns as it goes, so each end gets its own direction
            smooth = None
            if piece.kind == "corner":
                flen = (face[0] ** 2 + face[1] ** 2) ** 0.5 or 1.0
                ends = []
                for t in (ta, tb):
                    _x2, _z2, ex, ez = piece.at(t, 0.0)
                    ends.append((ex * face[0] / flen, face[1] / flen, ez * face[0] / flen))
                smooth = [ends[0], ends[1], ends[1], ends[0]]
            for k in range(splits):
                f0, f1 = k / splits, (k + 1) / splits
                d0, y0 = a[0] + (c[0] - a[0]) * f0, a[1] + (c[1] - a[1]) * f0
                d1, y1 = a[0] + (c[0] - a[0]) * f1, a[1] + (c[1] - a[1]) * f1
                dm = (d0 + d1) / 2
                if whole_u:
                    total = perimeter(dm)
                    u0 = (start_of(piece, dm) + ta * piece.length(dm)) / total
                    u1 = (start_of(piece, dm) + tb * piece.length(dm)) / total
                    v0, v1 = f0, f1
                    if v_range:
                        v0 = v_range[0] + (v_range[1] - v_range[0]) * f0
                        v1 = v_range[0] + (v_range[1] - v_range[0]) * f1
                else:
                    u0 = start_of(piece, dm) + ta * piece.length(dm)
                    u1 = start_of(piece, dm) + tb * piece.length(dm)
                    length = ((c[0] - a[0]) ** 2 + (c[1] - a[1]) ** 2) ** 0.5
                    v0, v1 = f0 * length, f1 * length
                b.quad(
                    L.point(piece, ta, d0, y0), L.point(piece, tb, d0, y0), L.point(piece, tb, d1, y1), L.point(piece, ta, d1, y1),
                    mat, facing, [(u0, v0), (u1, v0), (u1, v1), (u0, v1)], smooth,
                )


def _tunnel_gap(piece, t):
    return piece.index == WEST and abs(L.x_of_t(piece, t)) < L.TUNNEL_HALF


def _tunnel_cuts(piece):
    extra = (L.t_of_x(piece, L.TUNNEL_HALF), L.t_of_x(piece, -L.TUNNEL_HALF)) if piece.index == WEST else ()
    return L.plain_cuts(piece, extra=extra)


def build_pitch_wall(walls, glass):
    """The wall round the pitch and the walkway on top of it."""
    lower = P.TIERS[0]
    h = P.FRONT_WALL_HEIGHT
    sweep(walls, (0.0, 0.0), (0.0, h), "Hoarding", (-1, 0), cuts_for=_tunnel_cuts, skip=_tunnel_gap)
    sweep(walls, (0.0, h), (lower["d0"], h), "Concrete", (0, 1), cuts_for=_tunnel_cuts, skip=_tunnel_gap, splits=2)
    sweep(glass, (0.1, h), (0.1, h + 0.95), "Glass", (-1, 0), cuts_for=_tunnel_cuts, skip=_tunnel_gap)


def build_tier_fronts(walls, ribbons, glass):
    """The front edge of each upper tier: a dark band carrying a strip
    of screen, a low wall, and glass above it."""
    for tier in P.TIERS[1:]:
        d, y = tier["d0"], tier["y0"]
        sweep(walls, (d, y - P.SLAB), (d, y - 0.88), "Fascia", (-1, 0))
        sweep(ribbons, (d - 0.02, y - 0.88), (d - 0.02, y - 0.08), "Ribbon", (-1, 0), whole_u=True)
        sweep(walls, (d, y - 0.08), (d, y + P.PARAPET), "Fascia", (-1, 0))
        sweep(walls, (d, y + P.PARAPET), (d + 0.25, y + P.PARAPET), "Fascia", (0, 1))
        sweep(walls, (d + 0.25, y + P.PARAPET), (d + 0.25, y), "Fascia", (1, 0))
        sweep(glass, (d + 0.12, y + P.PARAPET), (d + 0.12, y + P.BALUSTRADE), "Glass", (-1, 0))


def build_undersides(walls):
    """The sloping underside of each upper tier, over the tier below."""
    for below, tier in zip(P.TIERS, P.TIERS[1:]):
        d_back = L.back_wall_d(below)
        span = d_back - tier["d0"]
        sweep(walls, (tier["d0"], tier["y0"] - P.SLAB), (d_back, L.soffit_y(tier, d_back)), "Soffit", (0, -1), splits=max(2, round(span / 1.9)))


def _door_cuts(tier):
    def cuts_for(piece):
        w = L.half_t(piece, L.back_wall_d(tier), 2.6)
        extra = []
        for c in L.aisles(tier, piece):
            extra += [c - w, c + w]
        return L.plain_cuts(piece, extra=[e for e in extra if 0.0 < e < 1.0])
    return cuts_for


def _is_door(tier, piece, t):
    w = L.half_t(piece, L.back_wall_d(tier), 2.6)
    return any(abs(t - c) < w for c in L.aisles(tier, piece))


def build_walkways_and_back_walls(walls):
    """Behind the last row of each tier: a level walkway, then a wall
    up to the underside of the tier above. The lower tier's wall has a
    doorway at every aisle; the others carry a band of dark glass."""
    for index, tier in enumerate(P.TIERS):
        d_end, y_top = L.tier_back(tier)
        d_wall = L.back_wall_d(tier)
        sweep(walls, (d_end, y_top), (d_wall, y_top), "Concrete", (0, 1), splits=2)
        if index == len(P.TIERS) - 1:
            top = P.ROOF["outer_y"]
            sweep(walls, (d_wall, y_top), (d_wall, top), "WallDark", (-1, 0), splits=3)
            continue
        above = P.TIERS[index + 1]
        top = L.soffit_y(above, d_wall)
        if index == 0:
            cuts_for = _door_cuts(tier)

            def lower_band(piece, t, tier=tier):
                return "Void" if _is_door(tier, piece, t) else "WallDark"

            sweep(walls, (d_wall, y_top), (d_wall, y_top + 2.4), "WallDark", (-1, 0), cuts_for=cuts_for, material_for=lower_band)
            sweep(walls, (d_wall, y_top + 2.4), (d_wall, y_top + 3.1), "WallDark", (-1, 0), cuts_for=cuts_for)
            sweep(walls, (d_wall, y_top + 3.1), (d_wall, y_top + 5.3), "BoxGlass", (-1, 0), whole_u=False)
            sweep(walls, (d_wall, y_top + 5.3), (d_wall, top), "WallDark", (-1, 0), splits=2)
        else:
            sweep(walls, (d_wall, y_top), (d_wall, y_top + 1.0), "WallDark", (-1, 0))
            sweep(walls, (d_wall, y_top + 1.0), (d_wall, y_top + 3.5), "BoxGlass", (-1, 0))
            sweep(walls, (d_wall, y_top + 3.5), (d_wall, top), "WallDark", (-1, 0), splits=2)
