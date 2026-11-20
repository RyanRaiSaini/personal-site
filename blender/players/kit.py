"""The kit: a plain white shirt, shorts and socks with a gold collar,
cuffs and sock bands, and dark boots. No crest, no maker's mark and no
sponsor: the only print is the name and number, which the site adds."""

import math

import bmesh
import bpy
import numpy as np
from mathutils import Vector

from . import params as P
from . import pictures
from .body import islands, log


def to_linear(c):
    """From the way a screen stores a colour to the way light adds up."""
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def show_paint(obj):
    """Mark a mesh's painted colours as the ones to show and to export."""
    paints = obj.data.color_attributes
    index = paints.find("Colour")
    paints.active_color_index = index
    paints.render_color_index = index


def twin(obj, name):
    """A separate copy of an object, skeleton and all."""
    copy = obj.copy()
    copy.data = obj.data.copy()
    copy.name = name
    copy.data.name = name
    for collection in obj.users_collection:
        collection.objects.link(copy)
    return copy


def keep_faces(obj, wanted):
    """Delete every face of a mesh that `wanted` says no to."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.faces.index_update()
    doomed = [f for f in bm.faces if not wanted(f)]
    bmesh.ops.delete(bm, geom=doomed, context="FACES")
    bm.to_mesh(obj.data)
    bm.free()
    obj.data.update()


# ------------------------------------------------------------------
# Shorts
# ------------------------------------------------------------------

def _reach(rings, angle, z):
    """How far a thigh comes out from the leg's line, in one direction
    at one height (`rings` is one side of what body.build_thighs returns)."""
    turn = 2.0 * math.pi
    if z <= rings[0][0]:
        return float(np.interp(angle, rings[0][1], rings[0][2], period=turn))
    for (z0, a0, r0), (z1, a1, r1) in zip(rings, rings[1:]):
        if z <= z1:
            t = (z - z0) / (z1 - z0)
            return float((1.0 - t) * np.interp(angle, a0, r0, period=turn) + t * np.interp(angle, a1, r1, period=turn))
    return float(np.interp(angle, rings[-1][1], rings[-1][2], period=turn))


def fit_shorts(shorts, arm, thighs):
    """The base model wears cargo shorts to the knee, and has no legs
    under them. Take off the pockets and loops, open the legs up, bring
    the hem to mid-thigh and hang the cloth just clear of the thighs
    built for it (`thighs` is what body.build_thighs returns)."""
    bm = bmesh.new()
    bm.from_mesh(shorts.data)
    bm.verts.index_update()
    pieces = islands(bm)
    extras = [v for piece in pieces[1:] for v in piece]
    bmesh.ops.delete(bm, geom=extras, context="VERTS")
    bm.verts.ensure_lookup_table()

    keep = P.SHORTS_KEEP_ABOVE
    old_hem = min(v.co.z for v in bm.verts)

    # With no leg inside, each leg of the base's shorts is closed off by
    # a level sheet a little above the hem. A thigh would stand through
    # it, and anyone looking up the leg would see a white ceiling.
    bm.normal_update()
    low = old_hem + 0.25 * (keep - old_hem)
    floor = [f for f in bm.faces if f.normal.z < -0.85 and f.calc_center_median().z < low]
    bmesh.ops.delete(bm, geom=floor, context="FACES")

    # Everything below the hips is drawn up by the same share, which
    # lifts the low crotch of the base's baggy shorts as well as the hem
    squeeze = (keep - P.SHORTS_HEM) / (keep - old_hem)
    for v in bm.verts:
        if v.co.z < keep:
            v.co.z = keep - (keep - v.co.z) * squeeze

    # where the two legs meet, now that nothing lower lies between them
    crotch = min(v.co.z for v in bm.verts if abs(v.co.x) < 0.005)

    weights = bm.verts.layers.deform.verify()
    group = {g.name: g.index for g in shorts.vertex_groups}
    thigh_bone = {side: group.get(f"{P.BONE}{side}UpLeg") for side in ("Left", "Right")}

    def side_of(co):
        return "Left" if co.x > 0 else "Right"

    def leg_line(side, z):
        hip = arm.data.bones[f"{P.BONE}{side}UpLeg"].head_local
        knee = arm.data.bones[f"{P.BONE}{side}Leg"].head_local
        return knee.lerp(hip, (z - knee.z) / (hip.z - knee.z))

    # narrow the legs, most at the hem
    for v in bm.verts:
        if v.co.z >= crotch:
            continue
        side = side_of(v.co)
        down = (crotch - v.co.z) / (crotch - P.SHORTS_HEM)  # 0 at the crotch, 1 at the hem
        centre = leg_line(side, v.co.z)
        narrow = 1.0 - (1.0 - P.SHORTS_SLIM) * down
        v.co.x = centre.x + (v.co.x - centre.x) * narrow
        v.co.y = centre.y + (v.co.y - centre.y) * narrow
        # nothing this high on the leg should follow the shin
        shin, thigh = group.get(f"{P.BONE}{side}Leg"), thigh_bone[side]
        if shin is not None and thigh is not None and shin in v[weights]:
            v[weights][thigh] = v[weights].get(thigh, 0.0) + v[weights][shin]
            del v[weights][shin]

    # The base's shorts are turned in at each opening, so there are two
    # layers there. One is enough (the site draws both sides of it), and
    # with only one the thigh cannot show between them.
    bm.normal_update()
    lining = []
    for face in bm.faces:
        at = face.calc_center_median()
        if at.z < crotch:
            centre = leg_line(side_of(at), at.z)
        else:
            centre = Vector((0.0, 0.01, at.z))
        outward = Vector((at.x - centre.x, at.y - centre.y, 0.0))
        if outward.length > 1e-5 and face.normal.dot(outward.normalized()) < -0.25:
            lining.append(face)
    bmesh.ops.delete(bm, geom=lining, context="FACES")

    # what is left of the turned-in edge under the hem
    bm.normal_update()
    lip = [f for f in bm.faces if f.normal.z < -0.5 and f.calc_center_median().z < P.SHORTS_HEM + 0.012]
    bmesh.ops.delete(bm, geom=lip, context="FACES")

    # whatever that has cut loose
    bm.verts.index_update()
    scraps = [v for piece in islands(bm)[1:] for v in piece]
    bmesh.ops.delete(bm, geom=scraps, context="VERTS")

    # smooth away the lumps where the pockets were
    soft = [v for v in bm.verts if P.SHORTS_HEM + 0.012 < v.co.z < 0.95]
    for _ in range(8):
        bmesh.ops.smooth_vert(bm, verts=soft, factor=0.5, use_axis_x=True, use_axis_y=True, use_axis_z=True)

    # And keep the cloth clear of the thigh all the way round, measured
    # from the thigh's own outline. Above the top of the thigh the push
    # fades out, so it leaves no ledge.
    top = thighs["Left"][-1][0]
    fade = 0.04

    def clear():
        moved = 0
        for v in bm.verts:
            if v.co.z >= top + fade:
                continue
            side = side_of(v.co)
            centre = leg_line(side, v.co.z)
            out = Vector((v.co.x - centre.x, v.co.y - centre.y, 0.0))
            if out.length < 1e-5:
                continue
            need = _reach(thighs[side], math.atan2(out.y, out.x), v.co.z) + P.SHORTS_CLEAR
            if out.length < need:
                share = 1.0 - max(0.0, (v.co.z - top) / fade)
                out = out.normalized() * (out.length + (need - out.length) * share)
                v.co.x, v.co.y = centre.x + out.x, centre.y + out.y
                moved += 1
        return moved

    pushed = clear()
    # one light pass so the push leaves no ridge behind it, then whatever that undid
    for _ in range(2):
        bmesh.ops.smooth_vert(bm, verts=soft, factor=0.3, use_axis_x=True, use_axis_y=True, use_axis_z=True)
    clear()

    # The base's hem flares like a brim. Bring the last few centimetres
    # in to hang straight, and set the rim at one height.
    band = 0.03
    for v in bm.verts:
        up = v.co.z - P.SHORTS_HEM
        if up >= band:
            continue
        side = side_of(v.co)
        centre = leg_line(side, v.co.z)
        out = Vector((v.co.x - centre.x, v.co.y - centre.y, 0.0))
        if out.length < 1e-5:
            continue
        most = _reach(thighs[side], math.atan2(out.y, out.x), v.co.z) + P.SHORTS_CLEAR + 0.003 + max(0.0, up) * 0.4
        if out.length > most:
            out = out.normalized() * most
            v.co.x, v.co.y = centre.x + out.x, centre.y + out.y
        if v.is_boundary and up < 0.012:
            v.co.z = P.SHORTS_HEM

    bm.normal_update()
    bm.to_mesh(shorts.data)
    bm.free()
    shorts.data.update()
    log(f"shorts fitted: {len(pieces) - 1} pockets and loops removed, {len(floor)} faces closing the legs removed, {len(lining) + len(lip)} lining faces removed, {len(scraps)} loose points removed, crotch at {crotch:.3f}, hem {old_hem:.3f} -> {P.SHORTS_HEM:.3f}, {pushed} points moved clear of the thigh")


# ------------------------------------------------------------------
# Socks
# ------------------------------------------------------------------

def make_socks(body):
    """Long socks: the skin of each shin becomes its own piece, a few
    millimetres proud of the leg, with a gold band round the top."""
    top = P.SOCK_TOP
    # The rings of the shin are not level, so first cut the leg cleanly
    # across at the top of the sock, and again where its band ends
    bm = bmesh.new()
    bm.from_mesh(body.data)
    for height in (top, top - P.SOCK_BAND):
        shin = [f for f in bm.faces if all(v.co.z < 0.52 for v in f.verts)]
        geom = list({e for f in shin for e in f.edges} | {v for f in shin for v in f.verts}) + shin
        bmesh.ops.bisect_plane(bm, geom=geom, dist=1e-5, plane_co=(0.0, 0.0, height), plane_no=(0.0, 0.0, 1.0), clear_inner=False, clear_outer=False)
    bm.to_mesh(body.data)
    bm.free()
    body.data.update()

    def on_shin(face):
        return face.center.z < top and all(body.data.vertices[i].co.z < 0.52 for i in face.vertices)

    shin_faces = {f.index for f in body.data.polygons if on_shin(f)}
    socks = twin(body, "Socks")
    keep_faces(socks, lambda f: f.index in shin_faces)
    keep_faces(body, lambda f: f.index not in shin_faces)

    bm = bmesh.new()
    bm.from_mesh(socks.data)
    bm.normal_update()
    rim = [e for e in bm.edges if e.is_boundary and e.verts[0].co.z > 0.3]
    # a lip turned in at the top, so the sock closes onto the knee
    lip = {g for g in bmesh.ops.extrude_edge_only(bm, edges=rim)["geom"] if isinstance(g, bmesh.types.BMVert)}
    for v in bm.verts:
        if v not in lip:
            v.co += v.normal * P.SOCK_THICKNESS

    # the top row of the sock is its gold band
    colour = bm.loops.layers.float_color.new("Colour")
    white, gold = [tuple(to_linear(c) for c in shade) for shade in (P.WHITE, P.GOLD)]
    band = {f for f in bm.faces if f.calc_center_median().z > top - P.SOCK_BAND}
    for face in bm.faces:
        for loop in face.loops:
            loop[colour] = (*(gold if face in band else white), 1.0)
    bm.normal_update()
    bm.to_mesh(socks.data)
    bm.free()
    show_paint(socks)
    socks.data.update()
    log(f"socks: {len(socks.data.polygons)} faces, top at {top:.3f}")
    return socks


def lower_boots(boots):
    """The base model wears trainers with thick soles. Football boots sit
    lower: press everything below the ankle toward the ground."""
    for v in boots.data.vertices:
        if v.co.z < 0.13:
            v.co.z *= P.BOOT_SQUASH + (1.0 - P.BOOT_SQUASH) * (v.co.z / 0.13) ** 2
    boots.data.update()


# ------------------------------------------------------------------
# Pictures
# ------------------------------------------------------------------

def paint_shirt(image, folder):
    """The shirt's picture: white cloth with the base model's weave kept
    faintly, and gold where the base had its dark collar and cuffs."""
    grid = pictures.shrink(pictures.read(image), P.SIZE["shirt"])
    light = pictures.brightness(grid)
    height = light.shape[0]
    up = np.linspace(0.0, 1.0, height)[:, None]  # 0 at the bottom row of the picture

    unused = light <= 0.02  # the parts of the picture no surface uses
    band = (light > 0.02) & (light < 0.14)
    cloth = ~unused & ~band
    weave = np.where(cloth, light / np.median(light[cloth]), 1.0)
    weave = 1.0 + (np.clip(weave, 0.7, 1.3) - 1.0) * 0.30

    # the collar is at the top of the picture, the cuffs at the bottom;
    # the dark hem in between becomes plain cloth
    trim = band & ((up > 0.70) | (up < 0.21))
    out = np.ones_like(grid)
    for c in range(3):
        out[..., c] = np.where(trim, P.GOLD[c], P.WHITE[c] * weave)
    return pictures.make("shirt", out, folder)


def shirt_folds(image, folder):
    return pictures.make("shirt-folds", pictures.shrink(pictures.read(image), P.SIZE["shirt_folds"]), folder, colour=False)


def paint_boots(image, folder):
    """Dark boots from the base model's white trainers: the panels and
    laces stay, a shade apart."""
    grid = pictures.shrink(pictures.read(image), P.SIZE["boots"])
    light = pictures.brightness(grid)
    shade = 0.8 + 0.45 * light
    out = np.ones_like(grid)
    for c in range(3):
        out[..., c] = P.BOOT[c] * shade
    return pictures.make("boots", out, folder)


def back_of_shirt(shirt):
    """Where the back of the shirt is on its picture, so the site can
    print the name and number there. Returns the best straight-line fit
    from a place on the player's back (x across, z up, in metres) to a
    place on the picture (u, v)."""
    mesh = shirt.data
    uv = mesh.uv_layers.active.data
    rows, us, vs = [], [], []
    for poly in mesh.polygons:
        if poly.normal.y < 0.6:
            continue
        for li in poly.loop_indices:
            co = mesh.vertices[mesh.loops[li].vertex_index].co
            # the outside of the back, not the inside of the front
            if abs(co.x) < 0.15 and 1.08 < co.z < 1.44 and co.y > 0.06:
                rows.append((1.0, co.x, co.z))
                us.append(uv[li].uv.x)
                vs.append(uv[li].uv.y)
    a = np.array(rows)
    fit_u, *_ = np.linalg.lstsq(a, np.array(us), rcond=None)
    fit_v, *_ = np.linalg.lstsq(a, np.array(vs), rcond=None)
    worst = float(max(np.abs(a @ fit_u - us).max(), np.abs(a @ fit_v - vs).max()))
    log(f"back of the shirt: {len(rows)} points, worst miss {worst:.4f} of the picture")
    return {"u": [round(float(c), 5) for c in fit_u], "v": [round(float(c), 5) for c in fit_v]}
