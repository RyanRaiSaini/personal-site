"""The roof: the fixed ring over the stands with its steel trusses, the
ring of screens and the floodlights under its inner edge, and the ten
sliding panels that close the opening over the pitch."""

from . import layout as L
from . import params as P
from .builder import Builder
from .path import PIECES
from .structure import sweep

UP = (0.0, 1.0, 0.0)
DOWN = (0.0, -1.0, 0.0)

R = P.ROOF
OUTER_D = L.back_wall_d(P.TIERS[-1])  # the ceiling starts at the back wall of the top tier


def ceiling_y(d):
    """Height of the ceiling `d` metres from the front wall of the stands."""
    return R["outer_y"] + (R["inner_y"] - R["outer_y"]) * (OUTER_D - d) / (OUTER_D - R["inner_d"])


def truss_positions():
    """One truss about every eleven metres, measured part-way up the stands."""
    out = []
    for piece in PIECES:
        n = max(1, round(piece.length(20.0) / R["truss_spacing"]))
        out += [(piece, (k + 0.5) / n) for k in range(n)]
    return out


def build_fixed_roof(walls):
    span = OUTER_D - R["inner_d"]
    sweep(walls, (OUTER_D, R["outer_y"]), (R["inner_d"], R["inner_y"]), "RoofDeck", (0, -1), splits=round(span / 2.2))
    # the deep edge round the opening, and a lip on top of it
    top = R["inner_y"] + R["ring_depth"]
    sweep(walls, (R["inner_d"], R["inner_y"]), (R["inner_d"], top), "RingBeam", (-1, 0), splits=2)
    sweep(walls, (R["inner_d"], top), (R["inner_d"] + 1.2, top), "RingBeam", (0, 1))
    # the top of the roof, which the sun sees and which shades the stands
    sweep(walls, (R["inner_d"] + 1.2, top), (OUTER_D + 13.5, R["outer_y"] + 3.2), "RoofTop", (0, 1), splits=6)


def build_trusses(steel):
    """A steel truss under the ceiling from the back wall to the opening."""
    d_back = OUTER_D - 0.4
    d_tip = R["inner_d"] + 0.6
    panels = 12
    for piece, t in truss_positions():
        _x, _z, nx, nz = piece.at(t, 0.0)
        side = (-nz, 0.0, nx)  # along the bowl, square to the truss
        top, bottom = [], []
        for k in range(panels + 1):
            f = k / panels
            d = d_back + (d_tip - d_back) * f
            depth = 2.9 + (1.25 - 2.9) * f
            y_top = ceiling_y(d) - 0.3
            top.append(L.point(piece, t, d, y_top))
            bottom.append(L.point(piece, t, d, y_top - depth))
        for k in range(panels):
            steel.beam(top[k], top[k + 1], 0.3, "Steel", side)
            steel.beam(bottom[k], bottom[k + 1], 0.3, "Steel", side)
            a, b = (top[k], bottom[k + 1]) if k % 2 == 0 else (bottom[k], top[k + 1])
            steel.beam(a, b, 0.18, "Steel", side)
        for k in range(0, panels + 1, 2):
            steel.beam(top[k], bottom[k], 0.18, "Steel", side)


def build_screen(screen, walls, steel):
    """The ring of screens. Its picture runs 0 to 1 once round the bowl,
    so the website can paint one long strip onto it."""
    S = P.SCREEN
    sweep(screen, (S["bottom_d"], S["bottom_y"]), (S["top_d"], S["top_y"]), "Screen", (-1, 0), whole_u=True)
    sweep(walls, (S["bottom_d"] + 0.25, S["bottom_y"]), (S["top_d"] + 0.25, S["top_y"]), "ScreenBack", (1, 0))
    sweep(walls, (S["bottom_d"], S["bottom_y"]), (S["bottom_d"] + 0.25, S["bottom_y"]), "ScreenBack", (0, -1))
    sweep(walls, (S["top_d"], S["top_y"]), (S["top_d"] + 0.25, S["top_y"]), "ScreenBack", (0, 1))
    for piece, t in truss_positions():
        _x, _z, nx, nz = piece.at(t, 0.0)
        side = (-nz, 0.0, nx)
        steel.beam(L.point(piece, t, S["top_d"] + 0.12, S["top_y"]), L.point(piece, t, R["inner_d"] + 0.5, ceiling_y(R["inner_d"] + 0.5)), 0.14, "SteelDark", side)


def build_floodlights(lamps, walls, steel):
    """A continuous bar of lamps under the roof edge, tipped down toward the pitch."""
    F = P.FLOODS
    d, y = F["d"], F["y"]
    # the glass: its lower edge is the one nearer the stands, so it looks down at the pitch
    sweep(lamps, (d + 0.22, y), (d - 0.32, y + 0.46), "FloodLens", (-0.65, -0.76))
    # the casing behind it: top, back and underside
    sweep(walls, (d - 0.32, y + 0.46), (d + 0.5, y + 0.46), "FloodHousing", (0, 1))
    sweep(walls, (d + 0.5, y + 0.46), (d + 0.5, y), "FloodHousing", (1, 0))
    sweep(walls, (d + 0.22, y), (d + 0.5, y), "FloodHousing", (0, -1))
    for piece, t in truss_positions():
        _x, _z, nx, nz = piece.at(t, 0.0)
        side = (-nz, 0.0, nx)
        steel.beam(L.point(piece, t, d + 0.3, y + 0.4), L.point(piece, t, d + 0.3, ceiling_y(d + 0.3) - 0.2), 0.1, "SteelDark", side)


# ------------------------------------------------------------------
# The sliding panels
# ------------------------------------------------------------------

OPEN_HX = P.BOWL["hx"] + R["inner_d"]  # half the opening, along the pitch
OPEN_HZ = P.BOWL["hz"] + R["inner_d"]
PANEL_WIDTH = (OPEN_HX * 2 + 3) / R["panel_count"]
PANEL_DEPTH = OPEN_HZ * 2 + 5
PANEL_Y = R["inner_y"] + R["panel_lift"]


def panel_closed_x(k):
    return -OPEN_HX - 1.5 + PANEL_WIDTH * (k + 0.5)


def build_panel(index):
    """One sliding panel, drawn around its own centre: an arched white
    skin, a truss down each long edge and ties across."""
    b = Builder(f"RoofPanel.{index:03d}")
    hw, hd = PANEL_WIDTH / 2, PANEL_DEPTH / 2
    across, along = 6, 9
    arch = 0.8

    def skin(i, j):
        x = -hw + PANEL_WIDTH * i / across
        z = -hd + PANEL_DEPTH * j / along
        return (x, arch * (1 - (x / hw) ** 2), z)

    for i in range(across):
        for j in range(along):
            b.quad(skin(i, j), skin(i + 1, j), skin(i + 1, j + 1), skin(i, j + 1), "Membrane", DOWN,
                   [(i / across, j / along), ((i + 1) / across, j / along), ((i + 1) / across, (j + 1) / along), (i / across, (j + 1) / along)])

    bays = 18
    depth = 2.1
    for s in (-1, 1):
        x = s * (hw - 0.28)
        top = [(x, 0.0, -hd + PANEL_DEPTH * k / bays) for k in range(bays + 1)]
        bottom = [(x, -depth, -hd + PANEL_DEPTH * k / bays) for k in range(bays + 1)]
        for k in range(bays):
            b.beam(top[k], top[k + 1], 0.26, "Steel", (1.0, 0.0, 0.0))
            b.beam(bottom[k], bottom[k + 1], 0.26, "Steel", (1.0, 0.0, 0.0))
            a, c = (top[k], bottom[k + 1]) if k % 2 == 0 else (bottom[k], top[k + 1])
            b.beam(a, c, 0.15, "Steel", (1.0, 0.0, 0.0))
        for k in range(0, bays + 1, 2):
            b.beam(top[k], bottom[k], 0.15, "Steel", (1.0, 0.0, 0.0))
    for k in range(1, along):
        z = -hd + PANEL_DEPTH * k / along
        b.beam((-hw + 0.3, -0.1, z), (hw - 0.3, -0.1, z), 0.1, "Steel", (0.0, 0.0, 1.0))
    return b
