"""Movement: bringing Mixamo's motion-capture clips onto the player.

Each clip arrives as its own file with its own copy of the skeleton.
Here it is moved onto the player's skeleton, brought to the player's
scale, and its travel across the ground is taken out and written down
separately. The site moves the player itself (it has to, to put him at
the ball), so a clip that also moved him would move him twice.
"""

import os

import bpy
from mathutils import Vector

from . import params as P
from .body import log


def curves_of(action):
    """The animation curves of an action, wherever this Blender keeps them."""
    if getattr(action, "layers", None) and len(action.layers) and len(action.layers[0].strips):
        strip = action.layers[0].strips[0]
        for slot in action.slots:
            bag = strip.channelbag(slot)
            if bag:
                return bag.fcurves
    return action.fcurves


def use(arm, action):
    """Make a skeleton play an action."""
    if not arm.animation_data:
        arm.animation_data_create()
    arm.animation_data.action = action
    slots = getattr(action, "slots", None)
    if slots and len(slots):
        arm.animation_data.action_slot = slots[0]


def bring_in(path, name, arm, scale):
    """Load one clip and put it on the player's skeleton, under `name`."""
    before_objects = set(bpy.data.objects)
    before_actions = set(bpy.data.actions)
    bpy.ops.import_scene.fbx(filepath=path, automatic_bone_orientation=False)
    action = next(a for a in bpy.data.actions if a not in before_actions)
    for obj in [o for o in bpy.data.objects if o not in before_objects]:
        data = obj.data
        bpy.data.objects.remove(obj)
        if data and data.users == 0 and isinstance(data, bpy.types.Armature):
            bpy.data.armatures.remove(data)
    action.name = name
    action.use_fake_user = True

    # the clip is in the base model's own units: bring distances to ours
    for curve in curves_of(action):
        if curve.data_path.endswith(".location"):
            for key in curve.keyframe_points:
                key.co.y *= scale
                key.handle_left.y *= scale
                key.handle_right.y *= scale
    return action


def span(action):
    first, last = action.frame_range
    return int(round(first)), int(round(last))


def ground_travel(arm, action, keep=False):
    """Take the hips' travel across the ground out of a clip and return
    it: one (sideways, forward) pair in metres for every frame. The rise
    and fall of the hips stays in the clip. With `keep`, the travel is
    only measured, not removed."""
    hips = f'pose.bones["{P.BONE}Hips"].location'
    curves = [c for c in curves_of(action) if c.data_path == hips]
    curves.sort(key=lambda c: c.array_index)
    rest = arm.data.bones[f"{P.BONE}Hips"].matrix_local.to_3x3()
    back = rest.inverted()
    first, last = span(action)
    travel = []
    start = None
    for frame in range(first, last + 1):
        local = Vector([c.evaluate(frame) for c in curves])
        world = rest @ local
        if start is None:
            start = world.copy()
        # the player faces -Y here; on the site that is "forward"
        travel.append((round(world.x - start.x, 4), round(-(world.y - start.y), 4)))
    if not keep:
        # work every new value out before changing any, as each depends on all three curves
        moments = sorted({key.co.x for curve in curves for key in curve.keyframe_points})
        still = {}
        for moment in moments:
            world = rest @ Vector([c.evaluate(moment) for c in curves])
            still[moment] = back @ Vector((start.x, start.y, world.z))
        for index, curve in enumerate(curves):
            for key in curve.keyframe_points:
                value = still[key.co.x][index]
                key.co.y = value
                key.handle_left.y = value
                key.handle_right.y = value
                key.interpolation = "LINEAR"
            curve.update()
    return travel


def trim(action, first, last):
    """Keep only the frames from `first` to `last`, renumbered from 1."""
    for curve in curves_of(action):
        kept = [(key.co.x - first + 1, key.co.y) for key in curve.keyframe_points if first <= key.co.x <= last]
        curve.keyframe_points.clear()
        curve.keyframe_points.add(len(kept))
        for key, (frame, value) in zip(curve.keyframe_points, kept):
            key.co = (frame, value)
            key.interpolation = "LINEAR"
        curve.update()


def _feet(arm, action):
    """Where both feet are on every frame, with the clip's travel still in
    it: {"Left": [point, ...], "Right": [...]}, each point (x, y, z)."""
    scene = bpy.context.scene
    use(arm, action)
    first, last = span(action)
    out = {"Left": [], "Right": []}
    for frame in range(first, last + 1):
        scene.frame_set(frame)
        for side in out:
            out[side].append((arm.matrix_world @ arm.pose.bones[f"{P.BONE}{side}ToeBase"].matrix.translation).copy())
    return out


def kick(arm, action, fps=30):
    """Find the moment of a kick: the frame on which a foot is moving
    forward fastest. Returns the time in seconds, which foot it is, and
    where that foot is then, measured from where the player started
    (sideways, up, forward: the site's own directions)."""
    feet = _feet(arm, action)
    start = arm.matrix_world @ arm.data.bones[f"{P.BONE}Hips"].head_local
    best = (0.0, 0, "Right")
    for side, path in feet.items():
        for i in range(1, len(path) - 1):
            speed = -(path[i + 1].y - path[i - 1].y) * fps / 2.0
            if speed > best[0]:
                best = (speed, i, side)
    speed, index, side = best
    at = feet[side][index]
    return {"at": round(index / fps, 4), "foot": side.lower(), "where": [round(at.x - start.x, 4), round(at.z, 4), round(-(at.y - start.y), 4)], "speed": round(speed, 2)}


def ground_speed(arm, action, fps=30):
    """How fast the ground goes by under a clip that runs on the spot:
    the speed, in metres a second, at which the planted foot moves back."""
    feet = _feet(arm, action)
    lowest = min(p.z for path in feet.values() for p in path)
    speeds = []
    for path in feet.values():
        for i in range(1, len(path) - 1):
            if path[i].z < lowest + 0.035:
                speeds.append((path[i + 1].y - path[i - 1].y) * fps / 2.0)
    return round(sum(speeds) / len(speeds), 3) if speeds else 0.0
