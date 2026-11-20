"""Checks the built footballer: does a thigh ever come through the shorts?

Run it on the Blender file the build saves (build_players.py, --blend):

    blender --background <footballer.blend> --python blender/check_players.py

It plays every clip and holds every standing pose, and at each step
looks at a few hundred places on the part of each thigh that the shorts
cover. A place that has come out through the cloth is a fault. It
prints one line for each clip, and ends with an error if there is one.

Worth running after any change to the thighs or the shorts
(players/params.py: THIGH, SHORTS_...), or after adding a clip.
"""

import os
import sys

import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from players import clips  # noqa: E402
from players import params as P  # noqa: E402

STEP = 2  # look at every second frame
THROUGH = 0.0005  # further out than this, in metres, counts as showing through
TIGHT = 0.004  # cloth nearer than this is worth a warning


def covered_places(body):
    """Places on each thigh that sit under the shorts when he stands:
    for each, the corners of the face it is on, how much of each corner,
    and which leg."""
    rest = [v.co.copy() for v in body.data.vertices]
    top = max(row[0] for row in P.THIGH)
    places = []
    for poly in body.data.polygons:
        corners = list(poly.vertices)
        heights = [rest[i].z for i in corners]
        if len(corners) != 4 or min(heights) < P.SHORTS_HEM - 0.002 or max(heights) > top + 0.002:
            continue
        if any(abs(rest[i].x) < 0.012 for i in corners):
            continue
        for u in (0.1, 0.5, 0.9):
            for v in (0.1, 0.5, 0.9):
                share = ((1 - u) * (1 - v), u * (1 - v), u * v, (1 - u) * v)
                # the last few millimetres above the hem are too near the cloth's edge to judge
                if sum(s * rest[i].z for s, i in zip(share, corners)) > P.SHORTS_HEM + 0.008:
                    places.append((corners, share, "Left" if rest[corners[0]].x > 0 else "Right"))
    return places


def legs_of(shorts):
    """The faces of each leg of the shorts. A thigh is only ever measured
    against its own leg: the other one's cloth faces the wrong way."""
    names = {g.index: g.name for g in shorts.vertex_groups}
    pull = []
    for v in shorts.data.vertices:
        got = {"Left": 0.0, "Right": 0.0}
        for g in v.groups:
            for side in got:
                if names[g.group] == f"{P.BONE}{side}UpLeg":
                    got[side] += g.weight
        pull.append(got)
    legs = {"Left": [], "Right": []}
    for poly in shorts.data.polygons:
        left = sum(pull[i]["Left"] for i in poly.vertices)
        right = sum(pull[i]["Right"] for i in poly.vertices)
        if left >= right:
            legs["Left"].append(tuple(poly.vertices))
        if right >= left:
            legs["Right"].append(tuple(poly.vertices))
    return legs


def measure(body, shorts, places, legs):
    """As he is posed now: how far the worst place is outside the cloth,
    how many places are outside, and how near the cloth comes to the rest."""
    deps = bpy.context.evaluated_depsgraph_get()
    posed_body, posed_shorts = body.evaluated_get(deps), shorts.evaluated_get(deps)
    skin_mesh, cloth_mesh = posed_body.to_mesh(), posed_shorts.to_mesh()
    cloth = [shorts.matrix_world @ v.co for v in cloth_mesh.vertices]
    skin = [body.matrix_world @ v.co for v in skin_mesh.vertices]
    trees = {side: BVHTree.FromPolygons(cloth, faces) for side, faces in legs.items()}
    worst, outside, nearest = 0.0, 0, 1.0
    for corners, share, side in places:
        at = Vector((0.0, 0.0, 0.0))
        for s, i in zip(share, corners):
            at += skin[i] * s
        on_cloth, facing, _, _ = trees[side].find_nearest(at)
        out = (at - on_cloth).dot(facing)
        if out > THROUGH:
            outside += 1
            worst = max(worst, out)
        else:
            nearest = min(nearest, (at - on_cloth).length)
    posed_body.to_mesh_clear()
    posed_shorts.to_mesh_clear()
    return worst, outside, nearest


def main():
    scene = bpy.context.scene
    arm = bpy.data.objects["Rig"]
    body = bpy.data.objects["Body"]
    shorts = bpy.data.objects["Shorts"]
    places = covered_places(body)
    legs = legs_of(shorts)
    print(f"[check] {len(places)} places on the thighs, under the shorts")

    standing = bpy.data.actions["idle"]
    faults = 0
    for action in sorted(bpy.data.actions, key=lambda a: a.name):
        if action.name.startswith("stance-"):
            # a pose fixes a few bones; the rest stand as in the breathing clip
            clips.use(arm, standing)
            scene.frame_set(1)
            bpy.context.view_layer.update()
            clips.use(arm, action)
            frames = [1]
        else:
            clips.use(arm, action)
            first, last = (int(round(f)) for f in action.frame_range)
            frames = list(range(first, last + 1, STEP))
        worst, at, most, tight = 0.0, None, 0, 1.0
        for frame in frames:
            scene.frame_set(frame)
            bpy.context.view_layer.update()
            out, outside, nearest = measure(body, shorts, places, legs)
            if out > worst:
                worst, at = out, frame
            most = max(most, outside)
            tight = min(tight, nearest)
        if worst > 0.0:
            faults += 1
            print(f"[check] {action.name:14s} SHOWS THROUGH by {worst * 1000:.1f} mm at frame {at} ({most} places at once)")
        else:
            note = "  (tight)" if tight < TIGHT else ""
            print(f"[check] {action.name:14s} clear; the cloth comes no nearer than {tight * 1000:.1f} mm{note}")

    if faults:
        print(f"[check] FAILED: the thigh shows through the shorts in {faults} of the movements above")
        sys.exit(1)
    print("[check] passed: the thighs stay inside the shorts in every movement")


main()
