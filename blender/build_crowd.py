"""Builds the crowd's pictures: real people, seated, seen from the pitch.

    blender --background --factory-startup --python blender/build_crowd.py -- \\
        --source  <folder holding the Mixamo downloads (raw/)> \\
        --site    <the website's public/stadium/crowd folder> \\
        [--probe  <folder>: pictures of the clips' frames, to choose poses from]

Four of Mixamo's stock characters, Remy and Bryce, Kate and Megan
(WOMEN), are seated with the
"sitting idle" motion capture; some raise an arm, or both, with the
arms of the "victory" clip. Each pose of each person is rendered front
on, as from the pitch, into one sheet of pictures (crowd-colour.webp).
A second sheet (crowd-mask.webp) marks where the shirt (red), the skin
(green), the trousers (full blue) and the hair (half blue) are, so the
site can give every fan his own shirt, skin tone, trousers and hair
colour
(app/components/world3d/stadium/Crowd.tsx). The shirt and trousers are
rendered without their own colour (their folds and shading are kept),
for the same reason.

The Mixamo files themselves are not in this repository (see
docs/redesign/ASSETS.md). The pictures made from them are part of the
site.
"""

import argparse
import json
import math
import os
import sys

import bpy
from mathutils import Matrix, Vector

# ---- the sheet ----
CELL_W, CELL_H = 256, 420  # pixels per fan
WORLD_W, WORLD_H = 1.097, 1.8  # metres the cell covers: a seated person, arms up included
HEIGHT = 1.78  # every person is scaled to this standing height

# each person: the file, the meshes that are shirt, skin and trousers
PEOPLE = {
    "remy": {"file": "remy/Remy.fbx", "shirt": ["Tops"], "skin": ["Body"], "trousers": ["Bottoms"], "hair": ["Hair"], "drop": ["Eyelashes"]},
    "bryce": {"file": "bryce/Bryce.fbx", "shirt": ["Ch42_Shirt"], "skin": ["Ch42_Body1"], "trousers": ["Ch42_Shorts"], "hair": ["Ch42_Hair1"], "drop": ["Ch42__Eyelashes"]},
}
# women too (Mixamo's Kate and Megan), a little shorter than the men:
# every sheet has the two men's cells, then the two women's
WOMEN = {
    "kate": {"file": "kate/Kate.fbx", "shirt": ["Ch21_Shirt"], "skin": ["Ch21_Body"], "trousers": ["Ch21_Pants"], "hair": ["Ch21_Hair"], "drop": ["Ch21_Eyelasshes"], "height": 1.68},
    "megan": {"file": "megan/Megan.fbx", "shirt": ["Ch22_Shirt"], "skin": ["Ch22_Body"], "trousers": ["Ch22_Pants"], "hair": ["Ch22_Hair"], "drop": ["Ch22_Eyelashes"], "height": 1.66},
}
SITTING = "extra/sitting idle.fbx"
VICTORY = "extra/victory.fbx"

# the poses: a frame of the sitting clip, and which arms (if any) come
# from which frame of the victory clip
POSES = [
    {"name": "sit", "sit": 20},
    {"name": "arms-up", "sit": 20, "arms": ["Left", "Right"], "victory": 165},
    {"name": "arm-up", "sit": 20, "arms": ["Right"], "victory": 105},
    {"name": "arms-high", "sit": 20, "arms": ["Left", "Right"], "victory": 75},
]
ARM_BONES = ("Shoulder", "Arm", "ForeArm", "Hand")

# --stand: the same people standing, as in the ticket office's queues
# (rooms/Queue.tsx): a frame of the "breathing idle" clip, each man seen
# from several sides (degrees he is turned from facing the camera), into
# its own sheet (queue-colour.webp), a little sharper than the crowd's
# since the room's camera comes close
STANDING = "extra/breathing idle.fbx"
STAND_VIEWS = [
    {"name": "back", "frame": 30, "turn": 180},
    {"name": "back-quarter", "frame": 90, "turn": 145},
    {"name": "front-quarter", "frame": 150, "turn": 35},
    {"name": "front", "frame": 60, "turn": 0},
]
STAND_CELL = (320, 525)


def log(message):
    print(f"[crowd] {message}", flush=True)


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--site")
    parser.add_argument("--probe")
    # the same people seen from behind (the press room's seats face away)
    parser.add_argument("--back", action="store_true")
    # standing people, seen from several sides (the ticket office's queues)
    parser.add_argument("--stand", action="store_true")
    return parser.parse_args(argv)


def use(arm, action):
    if not arm.animation_data:
        arm.animation_data_create()
    arm.animation_data.action = action
    slots = getattr(action, "slots", None)
    if slots and len(slots):
        arm.animation_data.action_slot = slots[0]


def curves_of(action):
    if getattr(action, "layers", None) and len(action.layers) and len(action.layers[0].strips):
        strip = action.layers[0].strips[0]
        for slot in action.slots:
            bag = strip.channelbag(slot)
            if bag:
                return bag.fcurves
    return action.fcurves


def clip(path, arm):
    """Load a clip and fit it to `arm`: its hip movement is scaled by
    how much taller or shorter this skeleton is than the clip's own."""
    before_objects = set(bpy.data.objects)
    before_actions = set(bpy.data.actions)
    bpy.ops.import_scene.fbx(filepath=path, automatic_bone_orientation=False)
    action = next(a for a in bpy.data.actions if a not in before_actions)
    theirs = next(o for o in bpy.data.objects if o not in before_objects and o.type == "ARMATURE")
    hips = next(b for b in arm.data.bones if b.name.endswith("Hips"))
    their_hips = next(b for b in theirs.data.bones if b.name.endswith("Hips"))
    ratio = hips.head_local.length / max(1e-6, their_hips.head_local.length)
    for obj in [o for o in bpy.data.objects if o not in before_objects]:
        bpy.data.objects.remove(obj)
    action.use_fake_user = True
    for curve in curves_of(action):
        if curve.data_path.endswith(".location"):
            for key in curve.keyframe_points:
                key.co.y *= ratio
                key.handle_left.y *= ratio
                key.handle_right.y *= ratio
    return action


def load_person(source, spec):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=os.path.join(source, spec["file"]))
    arm = next(o for o in bpy.data.objects if o.type == "ARMATURE")
    # some downloads number their bones ("mixamorig2:Hips"); the clips use
    # "mixamorig:Hips". Renaming a bone renames its vertex group too.
    for bone in arm.data.bones:
        if bone.name.startswith("mixamorig") and ":" in bone.name:
            bone.name = "mixamorig:" + bone.name.split(":", 1)[1]
    for name in spec["drop"]:
        if name in bpy.data.objects:
            bpy.data.objects.remove(bpy.data.objects[name])
    meshes = [o for o in bpy.data.objects if o.type == "MESH"]
    # matt, as cloth and skin under a stadium roof are, and hair cards see-through
    for obj in meshes:
        for slot in obj.material_slots:
            mat = slot.material
            if not (mat and mat.node_tree):
                continue
            shader = mat.node_tree.nodes.get("Principled BSDF")
            if not shader:
                continue
            if "Specular IOR Level" in shader.inputs:
                shader.inputs["Specular IOR Level"].default_value = 0.15
            for link in list(mat.node_tree.links):
                if link.to_socket in (shader.inputs.get("Specular IOR Level"), shader.inputs.get("Roughness")):
                    mat.node_tree.links.remove(link)
            shader.inputs["Roughness"].default_value = 0.75
            if "Hair" in obj.name or "hair" in mat.name.lower():
                opacity = next((n for n in mat.node_tree.nodes if n.type == "TEX_IMAGE" and n.image and "opacity" in n.image.name.lower()), None)
                if opacity and not shader.inputs["Alpha"].is_linked:
                    mat.node_tree.links.new(opacity.outputs["Color"], shader.inputs["Alpha"])
                mat.surface_render_method = "DITHERED"
    bpy.context.view_layer.update()
    zs = [(o.matrix_world @ v.co).z for o in meshes for v in o.data.vertices]
    arm.scale = arm.scale * (spec.get("height", HEIGHT) / (max(zs) - min(zs)))
    bpy.context.view_layer.update()
    return arm, meshes


def pose(arm, sitting, victory, spec):
    """Seat him (a frame of the sitting clip), then, if the pose asks,
    give him the arms of a frame of the victory clip."""
    scene = bpy.context.scene
    arms = {}
    if spec.get("arms"):
        use(arm, victory)
        scene.frame_set(spec["victory"])
        bpy.context.view_layer.update()
        for side in spec["arms"]:
            for part in ARM_BONES:
                bone = arm.pose.bones.get(f"mixamorig:{side}{part}")
                if bone:
                    arms[bone.name] = bone.matrix_basis.copy()
    use(arm, sitting)
    scene.frame_set(spec["sit"])
    bpy.context.view_layer.update()
    held = {bone.name: bone.matrix_basis.copy() for bone in arm.pose.bones}
    arm.animation_data.action = None
    for bone in arm.pose.bones:
        bone.matrix_basis = arms.get(bone.name, held[bone.name])
    bpy.context.view_layer.update()


def settle(arm, meshes):
    """Stand his feet on the ground at the middle of the picture."""
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    points = []
    for o in meshes:
        evaluated = o.evaluated_get(depsgraph)
        mesh = evaluated.to_mesh()
        points += [o.matrix_world @ v.co for v in mesh.vertices]
        evaluated.to_mesh_clear()
    low = min(p.z for p in points)
    mid_x = (min(p.x for p in points) + max(p.x for p in points)) / 2
    arm.location.z -= low
    arm.location.x -= mid_x
    bpy.context.view_layer.update()


def greyed(material_name, image):
    """A material that keeps a picture's light and shade but not its colour."""
    mat = bpy.data.materials.new(material_name)
    mat.use_nodes = True
    tree = mat.node_tree
    shader = tree.nodes["Principled BSDF"]
    shader.inputs["Roughness"].default_value = 0.85
    if image:
        node = tree.nodes.new("ShaderNodeTexImage")
        node.image = image
        grey = tree.nodes.new("ShaderNodeRGBToBW")
        lift = tree.nodes.new("ShaderNodeMath")
        lift.operation = "POWER"
        lift.inputs[1].default_value = 0.55  # brighten: the shirt is tinted on the site
        tree.links.new(node.outputs["Color"], grey.inputs["Color"])
        tree.links.new(grey.outputs["Val"], lift.inputs[0])
        tree.links.new(lift.outputs["Value"], shader.inputs["Base Color"])
    else:
        shader.inputs["Base Color"].default_value = (0.8, 0.8, 0.8, 1.0)
    return mat


def first_image(obj):
    for slot in obj.material_slots:
        if slot.material and slot.material.node_tree:
            for node in slot.material.node_tree.nodes:
                if node.type == "TEX_IMAGE" and node.image and any(link.to_socket.name == "Base Color" for out in node.outputs for link in out.links):
                    return node.image
    return None


def flat(name, colour):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    tree = mat.node_tree
    for node in list(tree.nodes):
        tree.nodes.remove(node)
    emit = tree.nodes.new("ShaderNodeEmission")
    emit.inputs["Color"].default_value = (*colour, 1.0)
    out = tree.nodes.new("ShaderNodeOutputMaterial")
    tree.links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


def stage(back=False):
    """A camera looking at him from the pitch (or from behind), and soft daylight."""
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.film_transparent = True
    scene.render.resolution_x, scene.render.resolution_y = CELL_W, CELL_H
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGBA"
    scene.view_settings.view_transform = "Standard"
    world = bpy.data.worlds.new("Sky")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.75, 0.78, 0.82, 1.0)
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.65
    scene.world = world
    for name, energy, turn in (("Key", 3.0, (40, 0, 20)), ("Fill", 0.9, (65, 0, -60))):
        light = bpy.data.objects.new(name, bpy.data.lights.new(name, "SUN"))
        light.data.energy = energy
        light.data.angle = math.radians(20)
        light.rotation_euler = tuple(math.radians(a) for a in turn)
        scene.collection.objects.link(light)
    camera = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = WORLD_H  # the taller side
    camera.location = (0.0, 6.0 if back else -6.0, WORLD_H / 2)
    camera.rotation_euler = (math.radians(90), 0.0, math.radians(180) if back else 0.0)
    scene.collection.objects.link(camera)
    scene.camera = camera
    return scene


def render(scene, path):
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def build(args):
    source = os.path.abspath(args.source)
    out = os.path.abspath(args.site or args.probe)
    os.makedirs(out, exist_ok=True)
    # the separate pictures are only a step on the way: keep them out of the site
    import tempfile
    work = os.path.join(tempfile.gettempdir(), "crowd-cells")
    os.makedirs(work, exist_ok=True)
    cells = []
    global CELL_W, CELL_H
    if args.stand:
        CELL_W, CELL_H = STAND_CELL
    for person, spec in {**PEOPLE, **WOMEN}.items():
        arm, meshes = load_person(source, spec)
        if args.stand:
            standing = clip(os.path.join(source, STANDING), arm)
        else:
            sitting = clip(os.path.join(source, SITTING), arm)
            victory = clip(os.path.join(source, VICTORY), arm)
        scene = stage(args.back)
        by_name = {o.name: o for o in meshes}
        own = {o.name: [s.material for s in o.material_slots] for o in meshes}
        # the shirt and trousers keep their shading but lose their colour
        greys = {}
        for name in spec["shirt"] + spec["trousers"]:
            obj = by_name.get(name)
            if obj:
                greys[name] = greyed(f"{name}-grey", first_image(obj))
        masks = {
            "shirt": flat("mask-shirt", (1.0, 0.0, 0.0)),
            "skin": flat("mask-skin", (0.0, 1.0, 0.0)),
            "trousers": flat("mask-trousers", (0.0, 0.0, 1.0)),
            "other": flat("mask-other", (0.0, 0.0, 0.0)),
            "hair": flat("mask-hair", (0.0, 0.0, 0.5)),
        }
        kind = {}
        for name in by_name:
            kind[name] = "hair" if name in spec["hair"] else "shirt" if name in spec["shirt"] else "skin" if name in spec["skin"] else "trousers" if name in spec["trousers"] else "other"

        if args.probe:
            for clip_name, action, frames in (("sitting", sitting, range(0, 400, 40)), ("victory", victory, range(0, 200, 15))):
                for f in frames:
                    use(arm, action)
                    scene.frame_set(f)
                    settle(arm, meshes)
                    render(scene, os.path.join(out, f"{person}-{clip_name}-{f:03d}.png"))
                    arm.location = (0.0, 0.0, 0.0)
            continue

        for spec_pose in STAND_VIEWS if args.stand else POSES:
            arm.location = (0.0, 0.0, 0.0)
            if args.stand:
                # stood at a frame of the idle clip, held there, turned to the view
                use(arm, standing)
                scene.frame_set(spec_pose["frame"])
                bpy.context.view_layer.update()
                held = {bone.name: bone.matrix_basis.copy() for bone in arm.pose.bones}
                arm.animation_data.action = None
                for bone in arm.pose.bones:
                    bone.matrix_basis = held[bone.name]
                arm.rotation_euler.z = math.radians(spec_pose["turn"])
                bpy.context.view_layer.update()
            else:
                pose(arm, sitting, victory, spec_pose)
            settle(arm, meshes)
            base = os.path.join(work, f"{person}-{spec_pose['name']}{'-back' if args.back else ''}{'-stand' if args.stand else ''}")
            for name, obj in by_name.items():
                for i, slot in enumerate(obj.material_slots):
                    slot.material = greys.get(name, own[name][i])
            render(scene, base + "-colour.png")
            scene.world.node_tree.nodes["Background"].inputs[1].default_value = 0.0
            for name, obj in by_name.items():
                for slot in obj.material_slots:
                    slot.material = masks[kind[name]]
            render(scene, base + "-mask.png")

            scene.world.node_tree.nodes["Background"].inputs[1].default_value = 0.65
            cells.append((person, spec_pose["name"], base))
            log(f"{person} {spec_pose['name']}")

    if args.probe:
        log("probe pictures written")
        return

    # one sheet of colour, one of masks, the cells side by side
    name = "queue" if args.stand else "crowd-back" if args.back else "crowd"
    sheet_w = CELL_W * len(cells)
    for which in ("colour", "mask"):
        sheet = bpy.data.images.new(f"{name}-{which}", sheet_w, CELL_H, alpha=True)
        pixels = [0.0] * (sheet_w * CELL_H * 4)
        for c, (_, _, base) in enumerate(cells):
            cell = bpy.data.images.load(f"{base}-{which}.png")
            data = list(cell.pixels)

            for y in range(CELL_H):
                row = data[y * CELL_W * 4:(y + 1) * CELL_W * 4]
                start = (y * sheet_w + c * CELL_W) * 4
                pixels[start:start + CELL_W * 4] = row
        sheet.pixels = pixels
        sheet.filepath_raw = os.path.join(out, f"{name}-{which}.raw.png")
        sheet.file_format = "PNG"
        sheet.save()
    with open(os.path.join(out, f"{name}.json"), "w") as f:
        json.dump({"cells": [{"person": p, "pose": n} for p, n, _ in cells], "cell": [CELL_W, CELL_H], "metres": [WORLD_W, WORLD_H]}, f, indent=2)
    log(f"sheets written: {len(cells)} cells, {sheet_w} x {CELL_H}")


if __name__ == "__main__":
    build(parse_args())
