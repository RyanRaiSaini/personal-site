"""The body: bringing the base model in, tidying it, and building the
thighs it comes without (the base wears long shorts and has nothing
underneath them)."""

import bmesh
import bpy
from mathutils import Vector

from . import params as P


def log(message):
    print(f"[players] {message}", flush=True)


def select(objects, active):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objects:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = active


def load_base(path):
    """Bring the base model in, in metres and at the working height.
    Returns the skeleton, its meshes by name, and how much it was scaled
    (the animations must be scaled by the same amount)."""
    bpy.ops.import_scene.fbx(filepath=path, automatic_bone_orientation=False)
    arm = next(o for o in bpy.context.scene.objects if o.type == "ARMATURE")
    meshes = {o.name: o for o in bpy.context.scene.objects if o.type == "MESH"}
    file_scale = arm.scale[0]

    select([arm, *meshes.values()], arm)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)
    top = max(v.co.z for v in meshes[P.BASE["body"]].data.vertices)
    fit = P.HEIGHT / top
    arm.scale = (fit, fit, fit)
    select([arm, *meshes.values()], arm)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)

    # the file's own one-frame animation is not wanted
    if arm.animation_data:
        arm.animation_data_clear()
    for action in list(bpy.data.actions):
        bpy.data.actions.remove(action)
    arm.name = "Rig"
    arm.data.name = "Rig"
    log(f"base model: {len(meshes)} meshes, {len(arm.data.bones)} bones, scaled by {file_scale * fit:.5f}")
    return arm, meshes, file_scale * fit


def islands(bm):
    """The separate pieces of a mesh, as lists of vertices, largest first."""
    seen = set()
    pieces = []
    for start in bm.verts:
        if start.index in seen:
            continue
        stack = [start]
        piece = []
        while stack:
            v = stack.pop()
            if v.index in seen:
                continue
            seen.add(v.index)
            piece.append(v)
            for e in v.link_edges:
                other = e.other_vert(v)
                if other.index not in seen:
                    stack.append(other)
        pieces.append(piece)
    return sorted(pieces, key=len, reverse=True)


def tidy(body):
    """Take out what will never be seen: the teeth and gums behind the
    closed lips, and a few stray scraps the base model carries."""
    bm = bmesh.new()
    bm.from_mesh(body.data)
    bm.verts.index_update()
    doomed = []
    for piece in islands(bm):
        lo = Vector((min(v.co.x for v in piece), min(v.co.y for v in piece), min(v.co.z for v in piece)))
        hi = Vector((max(v.co.x for v in piece), max(v.co.y for v in piece), max(v.co.z for v in piece)))
        scrap = len(piece) <= 8
        in_mouth = len(piece) < 700 and lo.z > 1.58 and hi.z < 1.645 and abs(lo.x) < 0.05 and abs(hi.x) < 0.05 and hi.y < -0.02
        if scrap or in_mouth:
            doomed.extend(piece)
    bmesh.ops.delete(bm, geom=doomed, context="VERTS")
    bm.to_mesh(body.data)
    bm.free()
    log(f"body tidied: {len(doomed)} hidden points removed, {len(body.data.vertices)} left")


def shape_up(arm, objects):
    """Give the slight base model an athlete's build: broader across the
    shoulders, deeper in the chest, narrower at the waist, fuller in the
    arms and calves, a stronger neck. The skeleton's arms move out with
    the shoulders, so every movement still fits."""
    s = P.SHAPE

    def wider(z):
        t = min(1.0, max(0.0, (z - s["from"]) / (s["full"] - s["from"])))
        return 1.0 + (s["shoulders"] - 1.0) * t * t * (3.0 - 2.0 * t)

    bones = arm.data.bones
    arm_line = {side: bones[f"{P.BONE}{side}Arm"].head_local.copy() for side in ("Left", "Right")}
    neck_low = bones[f"{P.BONE}Neck"].head_local.copy()
    neck_high = bones[f"{P.BONE}Head"].head_local.copy()
    spine = bones[f"{P.BONE}Spine"].head_local.copy()
    shin = {side: (bones[f"{P.BONE}{side}Leg"].head_local.copy(), bones[f"{P.BONE}{side}Foot"].head_local.copy()) for side in ("Left", "Right")}

    for obj in objects:
        names = {g.index: g.name[len(P.BONE):] for g in obj.vertex_groups}
        for v in obj.data.vertices:
            total = sum(g.weight for g in v.groups) or 1.0
            head = arms = neck = lower = 0.0
            for g in v.groups:
                name = names[g.group]
                if name in ("LeftLeg", "RightLeg"):
                    lower += g.weight / total
                if name in ("Head", "Neck", "LeftEye", "RightEye", "HeadTop_End"):
                    head += g.weight / total
                if name == "Neck":
                    neck += g.weight / total
                if name.endswith("Arm"):  # the upper arm and the forearm
                    arms += g.weight / total
            co = v.co
            if arms > 0.0:
                line = arm_line["Left" if co.x > 0 else "Right"]
                k = 1.0 + (s["arms"] - 1.0) * arms
                co.y = line.y + (co.y - line.y) * k
                co.z = line.z + (co.z - line.z) * k
            if neck > 0.0:
                t = min(1.0, max(0.0, (co.z - neck_low.z) / (neck_high.z - neck_low.z)))
                centre = neck_low.lerp(neck_high, t)
                k = 1.0 + (s["neck"] - 1.0) * neck
                co.x = centre.x + (co.x - centre.x) * k
                co.y = centre.y + (co.y - centre.y) * k
            if lower > 0.0:
                knee, ankle = shin["Left" if co.x > 0 else "Right"]
                down = min(1.0, max(0.0, (knee.z - co.z) / (knee.z - ankle.z)))
                centre = knee.lerp(ankle, down)
                # the calf swells below the knee and tapers to the ankle
                swell = 1.0 - 0.75 * max(0.0, (down - 0.45) / 0.55)
                k = 1.0 + (s["calves"] - 1.0) * lower * swell
                co.x = centre.x + (co.x - centre.x) * k
                co.y = centre.y + (co.y - centre.y) * k
            co.x *= 1.0 + (wider(co.z) - 1.0) * (1.0 - head)
            # a deeper chest: the front of the torso comes forward
            chest = max(0.0, 1.0 - abs(co.z - s["chest_at"]) / s["chest_reach"])
            if chest > 0.0 and arms == 0.0 and head == 0.0 and co.y < spine.y:
                co.y = spine.y + (co.y - spine.y) * (1.0 + (s["chest"] - 1.0) * chest * chest * (3.0 - 2.0 * chest))
            # a narrower waist: everything at that height draws in together,
            # shirt, shorts and skin, so nothing pokes through anything else
            near = max(0.0, 1.0 - abs(co.z - s["waist_at"]) / s["waist_reach"])
            if near > 0.0 and arms == 0.0:
                k = 1.0 + (s["waist"] - 1.0) * near * near * (3.0 - 2.0 * near)
                co.x *= k
                co.y = spine.y + (co.y - spine.y) * k
        obj.data.update()

    select([arm], arm)
    bpy.ops.object.mode_set(mode="EDIT")
    moved = 0
    for bone in arm.data.edit_bones:
        name = bone.name[len(P.BONE):]
        if "Shoulder" in name or "Arm" in name or "Hand" in name:
            bone.head.x *= wider(bone.head.z)
            bone.tail.x *= wider(bone.tail.z)
            moved += 1
    bpy.ops.object.mode_set(mode="OBJECT")
    log(f"build: shoulders x{s['shoulders']}, arms x{s['arms']}, neck x{s['neck']}; {moved} arm bones moved out to match")


def ordered_loop(edges):
    """Walk a closed ring of edges and return its vertices in order."""
    by_vert = {}
    for e in edges:
        for v in e.verts:
            by_vert.setdefault(v, []).append(e)
    start = edges[0].verts[0]
    ring = [start]
    prev_edge = None
    v = start
    while True:
        nxt = next(e for e in by_vert[v] if e is not prev_edge)
        v = nxt.other_vert(v)
        prev_edge = nxt
        if v is start:
            break
        ring.append(v)
    return ring


def build_thighs(body, arm):
    """Grow each leg upward from the open top of the shin to the hip.

    The skin picture already has the whole leg painted on it, so the new
    surface carries on along the picture in the direction the shin was
    going."""
    bm = bmesh.new()
    bm.from_mesh(body.data)
    bm.verts.ensure_lookup_table()
    uv = bm.loops.layers.uv.active
    weights = bm.verts.layers.deform.verify()
    group = {g.name: g.index for g in body.vertex_groups}
    added = 0

    for side in ("Left", "Right"):
        up_name, low_name = f"{P.BONE}{side}UpLeg", f"{P.BONE}{side}Leg"
        hip = arm.data.bones[up_name].head_local.copy()
        knee = arm.data.bones[low_name].head_local.copy()
        if up_name not in group:
            group[up_name] = body.vertex_groups.new(name=up_name).index
        if low_name not in group:
            group[low_name] = body.vertex_groups.new(name=low_name).index
        g_up, g_low = group[up_name], group[low_name]

        def axis(z):
            t = (z - knee.z) / (hip.z - knee.z)
            return knee.lerp(hip, t)

        rim = [e for e in bm.edges if e.is_boundary and all(abs(v.co.z - knee.z) < 0.07 and (v.co.x > 0) == (knee.x > 0) and abs(v.co.x) < 0.3 for v in e.verts)]
        ring = ordered_loop(rim)
        n = len(ring)
        base_z = sum(v.co.z for v in ring) / n
        centre = axis(base_z)
        spokes = []
        for v in ring:
            flat = Vector((v.co.x - centre.x, v.co.y - centre.y, 0.0))
            spokes.append(flat.normalized())
        base_radius = sum(Vector((v.co.x - centre.x, v.co.y - centre.y)).length for v in ring) / n

        on_rim = set(ring)

        # For each edge of the rim: where its two ends are on the skin
        # picture, and which way the picture runs up the leg from each
        def run(face, v):
            loop = next(l for l in face.loops if l.vert is v)
            # the neighbour of v in this face that is not on the rim
            for cand in (loop.link_loop_next, loop.link_loop_prev):
                if cand.vert not in on_rim:
                    here, there = loop[uv].uv.copy(), cand[uv].uv.copy()
                    reach = (v.co - cand.vert.co).length
                    return here, (here - there) / max(reach, 1e-6)
            return loop[uv].uv.copy(), Vector((0.0, 0.0))

        columns = []
        for i in range(n):
            a, b = ring[i], ring[(i + 1) % n]
            edge = bm.edges.get((a, b))
            face = edge.link_faces[0]
            uv_a, run_a = run(face, a)
            uv_b, run_b = run(face, b)
            # which way round the new faces must go to face outward
            loop_a = next(l for l in face.loops if l.vert is a)
            a_then_b = loop_a.link_loop_next.vert is b
            columns.append((uv_a, run_a, uv_b, run_b, a_then_b))

        previous = ring
        before = 0.0  # how far up the leg the last ring was from the rim
        last_z = base_z
        for z, radius in P.THIGH:
            c = axis(z)
            after = before + (z - last_z)
            last_z = z
            current = []
            for i, v in enumerate(ring):
                # keep the shape of the shin's rim, grown to the thigh's size
                shape = Vector((v.co.x - centre.x, v.co.y - centre.y)).length / base_radius
                p = Vector((c.x + spokes[i].x * radius * shape, c.y + spokes[i].y * radius * shape, z))
                nv = bm.verts.new(p)
                # the shin's pull fades out over the knee
                fade = max(0.0, min(1.0, (P.KNEE_BLEND_TOP - z) / (P.KNEE_BLEND_TOP - base_z)))
                shin = v[weights].get(g_low, 0.0) * fade * fade
                nv[weights][g_low] = shin
                nv[weights][g_up] = 1.0 - shin
                current.append(nv)
            for i in range(n):
                j = (i + 1) % n
                uv_a, run_a, uv_b, run_b, a_then_b = columns[i]
                corners = [
                    (previous[i], uv_a + run_a * before),
                    (previous[j], uv_b + run_b * before),
                    (current[j], uv_b + run_b * after),
                    (current[i], uv_a + run_a * after),
                ]
                if a_then_b:
                    corners.reverse()
                face = bm.faces.new([c[0] for c in corners])
                face.smooth = True
                for loop, (_, where) in zip(face.loops, corners):
                    loop[uv].uv = where
                added += 1
            previous = current
            before = after

    bm.normal_update()
    bm.to_mesh(body.data)
    bm.free()
    body.data.update()
    log(f"thighs built: {added} faces")
