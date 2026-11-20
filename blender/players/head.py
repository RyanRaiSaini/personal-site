"""The head: skin, eyes, hair and beards.

The base model is fair and blue-eyed with a light brown crop painted on
his scalp. The site tints the skin to each player's own tone, so here
the skin is left pale and only the things a tint cannot fix are
repainted: the hair and eyebrows go near black, the eyes brown.

Hair and beards are made as separate pieces, so one model can be several
players: the site shows the pieces each player has (kits.ts).

    HairMedium   the base model's own hair: a full, loose fringe
    HairCurls    short tight curls on top, cut close at the sides
    (neither)    a close crop: the hair painted on the scalp
    BeardGoatee  a full chin beard and a thin moustache
    BeardStrap   a light beard along the jaw, with a moustache
    BeardChin    light growth on the chin and upper lip
"""

import bmesh
import numpy as np
from mathutils import Vector, noise

from . import params as P
from . import pictures
from .body import log
from .kit import show_paint, twin

# Where things are on the base model's skin picture, as fractions of its
# width and height measured from the top left corner.
FACE = (0.0, 0.0, 0.505, 0.275)  # the head: left, top, right, bottom
EYES = (0.497, 0.0, 0.603, 0.203)
BROWS = [(0.135, 0.095, 0.245, 0.150), (0.265, 0.095, 0.375, 0.150)]
CHEEKS = (0.10, 0.17, 0.40, 0.25)
# The arms and legs are painted ruddier than the face. Each of these is
# brought to the face's own colour, so one tint suits the whole body.
LIMBS = [(0.605, 0.105, 0.995, 0.495), (0.605, 0.600, 0.995, 0.995)]


def _box(grid, box):
    """The part of a picture inside a box given from the top left."""
    height, width = grid.shape[:2]
    left, top, right, bottom = box
    return slice(int(height * (1 - bottom)), int(height * (1 - top))), slice(int(width * left), int(width * right))


def paint_skin(image, folder):
    """Returns the finished skin picture, the average colour of plain
    skin, and two maps the size of the original picture: where the hair
    is painted and where the lips are."""
    full = pictures.read(image).copy()
    hair_map = np.zeros(full.shape[:2], dtype=np.float32)
    lip_map = np.zeros(full.shape[:2], dtype=np.float32)

    # ---- hair and eyebrows: dark where the base model is light brown ----
    rows, cols = _box(full, FACE)
    face = full[rows, cols, :3]
    value = face.max(axis=2)
    spread = (value - face.min(axis=2)) / np.maximum(value, 1e-4)
    # hair is dull and dark; lips and shadowed skin are dark too, but redder
    hair = (1.0 - pictures.ramp(value, 0.42, 0.56)) * (1.0 - pictures.ramp(spread, 0.38, 0.50))
    hair = pictures.blur(hair, 2)
    hair_map[rows, cols] = hair
    lip_map[rows, cols] = (1.0 - pictures.ramp(value, 0.45, 0.60)) * pictures.ramp(spread, 0.44, 0.54)
    for box in BROWS:  # heavier eyebrows: let the dark spread a little
        r, c = _box(full, box)
        r = slice(r.start - rows.start, r.stop - rows.start)
        c = slice(c.start - cols.start, c.stop - cols.start)
        hair[r, c] = np.maximum(hair[r, c], np.clip(pictures.blur(hair[r, c], 5) * 2.2, 0.0, 1.0))
        hair_map[rows, cols][r, c] = 0.0  # eyebrows are not scalp
    mask = hair[..., None]
    dark = face * (1.0 - mask * 0.80)
    full[rows, cols, :3] = dark * (1.0 - mask) + (dark * 0.75 + np.array(P.HAIR) * 0.25) * mask

    # ---- eyes: brown, and a cleaner white ----
    rows, cols = _box(full, EYES)
    eye = full[rows, cols, :3]
    light = pictures.brightness(eye)[..., None]
    blue = pictures.ramp(eye[..., 2] - eye[..., 0], 0.0, 0.08)[..., None]
    brown = np.array((0.36, 0.20, 0.10)) * (0.35 + 1.5 * light)
    white = eye * 0.45 + (0.55 * (0.55 + 0.45 * light)) * np.array((1.0, 0.97, 0.95))
    pupil = (light < 0.16).astype(np.float32)  # the pupil stays as it is
    full[rows, cols, :3] = (brown * blue + white * (1.0 - blue)) * (1.0 - pupil) + eye * pupil

    # ---- one skin colour all over ----
    r, c = _box(full, CHEEKS)
    cheeks = full[r, c, :3].reshape(-1, 3)
    plain = cheeks[cheeks.max(axis=1) > 0.6].mean(axis=0)
    for box in LIMBS:
        r, c = _box(full, box)
        limb = full[r, c, :3]
        skin = limb.reshape(-1, 3)
        skin = skin[(skin.max(axis=1) > 0.5) & (skin[:, 0] > skin[:, 2])]
        gain = np.clip(plain / skin.mean(axis=0), 0.75, 1.7)
        full[r, c, :3] = np.clip(limb * gain, 0.0, 1.0)

    small = pictures.shrink(full, P.SIZE["skin"])
    # the colour of plain skin, which the site needs to know to tint it
    # to each player's own tone
    tone = [round(float(v), 4) for v in plain]
    log(f"skin repainted; plain skin averages {tone}")
    return pictures.make("skin", small, folder), tone, {"hair": hair_map, "lips": lip_map}


def paint_hair(colour_image, cover_image, folder):
    """The hair's picture in shades of grey (the site colours it), with
    how solid each dot is kept alongside."""
    colour = pictures.shrink(pictures.read(colour_image), P.SIZE["hair"])
    cover = pictures.shrink(pictures.read(cover_image), P.SIZE["hair"])
    light = pictures.brightness(colour)
    solid = pictures.brightness(cover)
    shown = solid > 0.5
    grey = np.clip(light / max(float(np.median(light[shown])), 1e-4), 0.35, 1.6) * 0.62
    out = np.ones_like(colour)
    for c in range(3):
        out[..., c] = grey
    out[..., 3] = solid
    return pictures.make("hair", out, folder)


# ------------------------------------------------------------------
# Reading the face
# ------------------------------------------------------------------

def at_points(mesh, grid):
    """The value of a picture-sized map at every point of a mesh."""
    height, width = grid.shape
    out = np.zeros(len(mesh.vertices), dtype=np.float32)
    places = mesh.uv_layers.active.data
    for loop in mesh.loops:
        u, v = places[loop.index].uv
        out[loop.vertex_index] = grid[min(height - 1, max(0, int(v * height))), min(width - 1, max(0, int(u * width)))]
    return out


def landmarks(body, maps):
    """Find the mouth and chin on the face, so beards can be placed by
    measurement and not by guesswork."""
    mesh = body.data
    lips = at_points(mesh, maps["lips"])
    on_lips = [v for v in mesh.vertices if lips[v.index] > 0.5 and 1.57 < v.co.z < 1.66 and v.co.y < -0.05]
    xs = [v.co.x for v in on_lips]
    zs = [v.co.z for v in on_lips]
    mid = sum(xs) / len(xs)
    lip_top, lip_bottom = max(zs), min(zs)
    front = [v for v in mesh.vertices if abs(v.co.x - mid) < 0.012 and lip_bottom - 0.060 < v.co.z < lip_bottom - 0.020 and v.co.y < -0.04]
    chin = min(front, key=lambda v: v.co.y).co.copy()
    under = [v for v in mesh.vertices if abs(v.co.x - mid) < 0.02 and v.co.y < chin.y + 0.03 and v.co.z > 1.5]
    jaw_bottom = min(v.co.z for v in under)
    # Only the dark line where the lips meet shows up reliably on the
    # picture, so the lips themselves are measured out from it
    line = (lip_top + lip_bottom) / 2
    marks = {"mid": mid, "half": max((max(xs) - min(xs)) / 2, 0.025), "lip_top": line + 0.009, "lip_bottom": line - 0.012, "chin": chin, "jaw_bottom": jaw_bottom}
    log(f"face: lips meet at {line:.3f}, {min(xs):.3f}..{max(xs):.3f} across; chin at {tuple(round(c, 3) for c in chin)}; jaw bottom {jaw_bottom:.3f}")
    return marks


# ------------------------------------------------------------------
# Beards
# ------------------------------------------------------------------

def _ramp(value, low, high):
    t = min(1.0, max(0.0, (value - low) / (high - low)))
    return t * t * (3.0 - 2.0 * t)


def _moustache(co, normal, m, reach=0.010, droop=0.0):
    across = abs(co.x - m["mid"])
    above = co.z - m["lip_top"]
    # the line dips a little toward the corners of the mouth
    above += droop * _ramp(across, m["half"] * 0.5, m["half"] + 0.01)
    strength = _ramp(above, -0.001, 0.003) * (1.0 - _ramp(above, reach * 0.6, reach))
    return strength * (1.0 - _ramp(across, m["half"] + 0.001, m["half"] + 0.011)) * _ramp(-normal.y, 0.2, 0.5)


def _chin(co, normal, m, wide=0.040, narrow=0.011):
    across = abs(co.x - m["mid"])
    below = m["lip_bottom"] - co.z
    length = m["lip_bottom"] - m["jaw_bottom"]
    down = below / length
    half = narrow + (wide - narrow) * _ramp(down, 0.05, 0.55)
    strength = (1.0 - _ramp(across, half - 0.007, half + 0.004)) * _ramp(below, 0.002, 0.008)
    # under the chin it fades out toward the throat
    back = co.y - m["chin"].y
    return strength * (1.0 - _ramp(back, 0.022, 0.050)) * _ramp(co.z, m["jaw_bottom"] - 0.012, m["jaw_bottom"] - 0.002)


def _jaw(co, normal, m):
    # the band where the cheek turns under into the throat
    turning = _ramp(-normal.z, 0.05, 0.30) * (1.0 - _ramp(-normal.z, 0.70, 0.92))
    low = 1.0 - _ramp(co.z, m["lip_bottom"] - 0.004, m["lip_top"] + 0.012)
    in_front_of_ear = 1.0 - _ramp(co.y, 0.0, 0.035)
    return turning * low * in_front_of_ear


STYLES = {
    # a full chin beard and a thin, separate moustache
    "BeardGoatee": lambda co, n, m: max(_chin(co, n, m), 0.9 * _moustache(co, n, m, reach=0.011, droop=0.005)),
    # a light beard along the jaw, joined to light growth on the chin and lip
    "BeardStrap": lambda co, n, m: 0.62 * max(_jaw(co, n, m), 0.9 * _chin(co, n, m, wide=0.034, narrow=0.016), 0.8 * _moustache(co, n, m, reach=0.013)),
    # light growth on the chin and upper lip only
    "BeardChin": lambda co, n, m: 0.58 * max(_chin(co, n, m, wide=0.030, narrow=0.012), 0.8 * _moustache(co, n, m, reach=0.012)),
}


def make_beards(body, marks):
    """Each beard is a thin skin laid over the face, solid in the middle
    and fading out at its edges. The site colours it like the hair."""
    made = []
    mesh = body.data
    head = [v.index for v in mesh.vertices if v.co.z > 1.50 and abs(v.co.x) < 0.12]
    for name, strength in STYLES.items():
        cover = np.zeros(len(mesh.vertices), dtype=np.float32)
        for i in head:
            v = mesh.vertices[i]
            cover[i] = strength(v.co, v.normal, marks)
        wanted = {f.index for f in mesh.polygons if max(cover[i] for i in f.vertices) > 0.03}
        beard = twin(body, name)
        bm = bmesh.new()
        bm.from_mesh(beard.data)
        bm.faces.index_update()
        bm.verts.index_update()
        solid = {v: float(cover[v.index]) for v in bm.verts}
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.index not in wanted], context="FACES")
        bm.normal_update()
        colour = bm.loops.layers.float_color.new("Colour")
        for v in bm.verts:
            v.co += v.normal * 0.0008
        for face in bm.faces:
            for loop in face.loops:
                loop[colour] = (1.0, 1.0, 1.0, solid[loop.vert])
        bm.to_mesh(beard.data)
        bm.free()
        show_paint(beard)
        beard.data.update()
        made.append(beard)
        log(f"{name}: {len(beard.data.polygons)} faces")
    return made


# ------------------------------------------------------------------
# Short curls
# ------------------------------------------------------------------

def make_curls(body, maps):
    """Short tight curls on top, cut close at the sides: a cap grown out
    of the scalp where the hair is painted, tall on top and nothing at
    all by the ears, with a bumpy surface."""
    mesh = body.data
    painted = at_points(mesh, maps["hair"])
    fade = P.CURLS["fade_from"]

    def on_top(face):
        return all(painted[i] > 0.5 and mesh.vertices[i].co.z > fade - 0.012 for i in face.vertices)

    wanted = {f.index for f in mesh.polygons if on_top(f)}
    curls = twin(body, "HairCurls")
    bm = bmesh.new()
    bm.from_mesh(curls.data)
    bm.faces.index_update()
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.index not in wanted], context="FACES")
    for _ in range(P.CURLS["refine"]):
        bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=1, use_grid_fill=True, smooth=1.0)
    bm.normal_update()

    # how far each point is from the edge of the cap, in metres
    edge = [v for v in bm.verts if v.is_boundary]
    for v in bm.verts:
        nearest = min((v.co - e.co).length for e in edge) if edge else 1.0
        rise = _ramp(v.co.z, fade, fade + P.CURLS["fade_over"])
        length = P.CURLS["sides"] + (P.CURLS["top"] - P.CURLS["sides"]) * rise
        length *= _ramp(nearest, 0.0, P.CURLS["edge"])
        p = v.co * P.CURLS["curl"]
        bump = 0.5 + 0.5 * noise.noise(Vector((p.x, p.y, p.z)))
        v.co += v.normal * length * (1.0 - P.CURLS["depth"] + P.CURLS["depth"] * bump)
    bm.normal_update()
    # The picture of small curls repeats over the cap. It is laid on from
    # above and a little from the side, so it does not smear down the sides.
    place = bm.loops.layers.uv.verify()
    repeat = P.CURLS["ringlets"] / 0.2
    for face in bm.faces:
        face.smooth = True
        for loop in face.loops:
            co = loop.vert.co
            loop[place].uv = ((co.x + co.z * 0.5) * repeat, (co.y + co.z * 0.87) * repeat)
    bm.to_mesh(curls.data)
    bm.free()
    curls.data.update()
    log(f"HairCurls: {len(curls.data.polygons)} faces")
    return curls


def paint_ringlets(folder):
    """A picture of small tight curls, as bumps: a few hundred little
    domes packed together, made so its edges meet when it repeats."""
    size = P.SIZE["curls"]
    rng = np.random.default_rng(8)
    count = 150
    centres = rng.random((count, 2))
    radius = 0.050 + 0.030 * rng.random(count)
    y, x = np.mgrid[0:size, 0:size] / size
    height = np.zeros((size, size), dtype=np.float32)
    for (cx, cy), r in zip(centres, radius):
        dx = np.abs(x - cx)
        dy = np.abs(y - cy)
        dx = np.minimum(dx, 1.0 - dx)  # wrap round the edges
        dy = np.minimum(dy, 1.0 - dy)
        dome = np.sqrt(np.clip(1.0 - (dx * dx + dy * dy) / (r * r), 0.0, 1.0)) * r
        height = np.maximum(height, dome)
    slope_x = (np.roll(height, -1, axis=1) - np.roll(height, 1, axis=1)) * size / 2.0
    slope_y = (np.roll(height, -1, axis=0) - np.roll(height, 1, axis=0)) * size / 2.0
    strength = 2.2
    nx, ny, nz = -slope_x * strength, -slope_y * strength, np.ones_like(height)
    norm = np.sqrt(nx * nx + ny * ny + nz * nz)
    out = np.ones((size, size, 4), dtype=np.float32)
    out[..., 0] = nx / norm * 0.5 + 0.5
    out[..., 1] = ny / norm * 0.5 + 0.5
    out[..., 2] = nz / norm * 0.5 + 0.5
    return pictures.make("curls", out, folder, colour=False)
