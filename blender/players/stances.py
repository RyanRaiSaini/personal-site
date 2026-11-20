"""Standing poses that no motion-capture clip has: hands on hips, arms
folded, arms flung wide, a foot resting on the ball.

Each is worked out, not drawn: say where the hand (or foot) should be
and which way the elbow (or knee) should point, and the two bones in
between are turned to reach it. A pose only fixes the bones it needs
(the arms, or one leg); the site plays the breathing clip underneath for
everything else, so a posed player still breathes and shifts his weight.

Positions are in metres for a player standing at the origin facing -Y
(Blender's "front"): +X is his left, +Z is up.
"""

import math

import bpy
from mathutils import Matrix, Vector

from . import params as P
from .clips import use

ARM = ("Shoulder", "Arm", "ForeArm", "Hand")
LEG = ("UpLeg", "Leg", "Foot", "ToeBase")


def _update():
    bpy.context.view_layer.update()


def _aim(arm, name, direction):
    """Turn a bone, by the shortest way, to point along `direction`."""
    bone = arm.pose.bones[name]
    _update()
    now = bone.matrix.copy()
    pointing = now.to_3x3() @ Vector((0.0, 1.0, 0.0))
    turn = pointing.rotation_difference(direction.normalized()).to_matrix().to_4x4()
    bone.matrix = Matrix.Translation(now.translation) @ turn @ now.to_3x3().to_4x4()
    _update()


def _joint(root, target, upper, lower, pole):
    """Where the elbow or knee goes, for a limb of two bones reaching from
    `root` to `target` with the joint pushed toward `pole`."""
    line = target - root
    reach = max(abs(upper - lower) * 1.001, min(line.length, (upper + lower) * 0.999))
    along = line.normalized()
    foot = (upper * upper - lower * lower + reach * reach) / (2.0 * reach)
    height = math.sqrt(max(0.0, upper * upper - foot * foot))
    side = pole - along * pole.dot(along)
    side = side.normalized() if side.length > 1e-6 else Vector((0.0, 0.0, -1.0))
    return root + along * foot + side * height


def _reach(arm, top, middle, end, target, pole):
    """Bend the limb `top` -> `middle` so that the start of `end` lands on `target`."""
    _update()
    bones = arm.pose.bones
    root = bones[top].matrix.translation.copy()
    upper = (bones[middle].matrix.translation - root).length
    lower = (bones[end].matrix.translation - bones[middle].matrix.translation).length
    joint = _joint(root, Vector(target), upper, lower, Vector(pole))
    _aim(arm, top, joint - root)
    _aim(arm, middle, Vector(target) - joint)


def _hand(arm, side, target, pole, turn=None):
    name = f"{P.BONE}{side}"
    _reach(arm, f"{name}Arm", f"{name}ForeArm", f"{name}Hand", target, pole)
    if turn:
        _aim(arm, f"{name}Hand", Vector(turn))


def _stretch(arm, side, direction, pole, straight=0.985):
    """Hold an arm out along `direction`, all but straight."""
    name = f"{P.BONE}{side}"
    _update()
    bones = arm.pose.bones
    shoulder = bones[f"{name}Arm"].matrix.translation.copy()
    length = (bones[f"{name}ForeArm"].matrix.translation - shoulder).length + (bones[f"{name}Hand"].matrix.translation - bones[f"{name}ForeArm"].matrix.translation).length
    way = Vector(direction).normalized()
    _hand(arm, side, shoulder + way * length * straight, pole, turn=way)


# ---- the poses ----
# x is mirrored for the right-hand side: s is +1 for his left, -1 for his right

def hands_on_hips(arm):
    for side, s in (("Left", 1), ("Right", -1)):
        _hand(arm, side, (s * 0.205, 0.005, 1.035), (s * 1.0, 0.75, -0.1), turn=(-s * 0.35, -0.55, -0.75))
    return ARM


def arms_folded(arm):
    # the right forearm lies against the chest, the left one over it
    _hand(arm, "Right", (0.105, -0.175, 1.205), (-0.7, -0.1, -1.0), turn=(0.9, -0.1, 0.35))
    _hand(arm, "Left", (-0.125, -0.215, 1.230), (0.7, -0.1, -1.0), turn=(-0.9, -0.1, 0.35))
    return ARM


def arms_wide(arm):
    # out to the sides, a little up and a little back: chest open
    for side, s in (("Left", 1), ("Right", -1)):
        _stretch(arm, side, (s * 0.94, 0.16, 0.30), (0.0, 0.4, -1.0))
    return ARM


def foot_on_ball(arm):
    """The right foot rests on a ball 0.31 m in front of him and 0.11 m
    to his right (where the site puts it: players/Cast.tsx)."""
    name = f"{P.BONE}Right"
    _update()
    foot = arm.pose.bones[f"{name}Foot"]
    level = foot.matrix.to_3x3().copy()  # the foot as it is when flat on the ground
    _reach(arm, f"{name}UpLeg", f"{name}Leg", f"{name}Foot", (-0.100, -0.200, 0.345), (0.0, -1.0, 0.25))
    _update()
    # keep the foot level, toes a little down, however the shin has turned
    tip = Matrix.Rotation(math.radians(-10), 3, "X")
    foot.matrix = Matrix.Translation(foot.matrix.translation) @ (tip @ level).to_4x4()
    _update()
    return LEG


STANCES = {
    "stance-hips": (hands_on_hips, ARM, ("Left", "Right")),
    "stance-folded": (arms_folded, ARM, ("Left", "Right")),
    "stance-wide": (arms_wide, ARM, ("Left", "Right")),
    "stance-foot": (foot_on_ball, LEG, ("Right",)),
}


def make_all(arm, standing):
    """Make every pose as a two-frame clip, worked out with the player
    standing as he does in the breathing clip (`standing`). Returns, for
    each pose, the bones it fixes."""
    scene = bpy.context.scene
    fixed = {}
    for name, (pose, parts, sides) in STANCES.items():
        use(arm, standing)
        scene.frame_set(1)
        _update()
        held = {bone.name: (bone.location.copy(), bone.rotation_quaternion.copy()) for bone in arm.pose.bones}
        action = bpy.data.actions.new(name)
        action.use_fake_user = True
        use(arm, action)
        for bone in arm.pose.bones:
            bone.rotation_mode = "QUATERNION"
            bone.location, bone.rotation_quaternion = held[bone.name]
        pose(arm)
        bones = [f"{P.BONE}{side}{part}" for side in sides for part in parts]
        for bone_name in bones:
            for frame in (1, 2):
                arm.pose.bones[bone_name].keyframe_insert("rotation_quaternion", frame=frame)
        fixed[name] = bones
    # leave the skeleton at rest
    arm.animation_data.action = None
    for bone in arm.pose.bones:
        bone.location = (0.0, 0.0, 0.0)
        bone.rotation_quaternion = (1.0, 0.0, 0.0, 0.0)
    _update()
    return fixed
