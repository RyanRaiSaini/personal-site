"""Materials, and quick pictures for checking the build without
opening Blender."""

import math
import os

import bpy
from mathutils import Vector

from .kit import to_linear


def material(name, colour=(1.0, 1.0, 1.0), picture=None, folds=None, rough=0.8, see_through=False, painted=False, both_sides=False):
    """A plain material the web export understands: a colour, and
    optionally a picture, a picture of folds, and paint on the corners."""
    plain = colour == (1.0, 1.0, 1.0)
    colour = tuple(to_linear(c) for c in colour)  # colours are given as a screen stores them
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    mat.use_backface_culling = not both_sides
    tree = mat.node_tree
    shader = tree.nodes["Principled BSDF"]
    shader.inputs["Roughness"].default_value = rough
    shader.inputs["Base Color"].default_value = (*colour, 1.0)
    if "Specular IOR Level" in shader.inputs:
        shader.inputs["Specular IOR Level"].default_value = 0.35
    if picture:
        node = tree.nodes.new("ShaderNodeTexImage")
        node.image = picture
        if plain:
            tree.links.new(node.outputs["Color"], shader.inputs["Base Color"])
        else:
            mix = tree.nodes.new("ShaderNodeMix")
            mix.data_type = "RGBA"
            mix.blend_type = "MULTIPLY"
            mix.inputs["Factor"].default_value = 1.0
            tree.links.new(node.outputs["Color"], mix.inputs["A"])
            mix.inputs["B"].default_value = (*colour, 1.0)
            tree.links.new(mix.outputs["Result"], shader.inputs["Base Color"])
        if see_through:
            tree.links.new(node.outputs["Alpha"], shader.inputs["Alpha"])
    elif painted:
        node = tree.nodes.new("ShaderNodeVertexColor")
        node.layer_name = "Colour"
        if plain:
            tree.links.new(node.outputs["Color"], shader.inputs["Base Color"])
        else:
            mix = tree.nodes.new("ShaderNodeMix")
            mix.data_type = "RGBA"
            mix.blend_type = "MULTIPLY"
            mix.inputs["Factor"].default_value = 1.0
            tree.links.new(node.outputs["Color"], mix.inputs["A"])
            mix.inputs["B"].default_value = (*colour, 1.0)
            tree.links.new(mix.outputs["Result"], shader.inputs["Base Color"])
        if see_through:
            tree.links.new(node.outputs["Alpha"], shader.inputs["Alpha"])
    if folds:
        node = tree.nodes.new("ShaderNodeTexImage")
        node.image = folds
        bump = tree.nodes.new("ShaderNodeNormalMap")
        tree.links.new(node.outputs["Color"], bump.inputs["Color"])
        tree.links.new(bump.outputs["Normal"], shader.inputs["Normal"])
    return mat


def tint(mat, colour):
    """Multiply a material's picture by a colour (for trying out skin
    tones here; the site does the same sum itself)."""
    tree = mat.node_tree
    shader = tree.nodes["Principled BSDF"]
    mix = tree.nodes.get("Tint")
    if not mix:
        source = shader.inputs["Base Color"].links[0].from_socket
        mix = tree.nodes.new("ShaderNodeMix")
        mix.name = "Tint"
        mix.data_type = "RGBA"
        mix.blend_type = "MULTIPLY"
        mix.inputs["Factor"].default_value = 1.0
        tree.links.new(source, mix.inputs["A"])
        tree.links.new(mix.outputs["Result"], shader.inputs["Base Color"])
    mix.inputs["B"].default_value = (*colour, 1.0)


def untint(mat):
    tree = mat.node_tree
    mix = tree.nodes.get("Tint")
    if mix:
        source = mix.inputs["A"].links[0].from_socket
        tree.links.new(source, tree.nodes["Principled BSDF"].inputs["Base Color"])
        tree.nodes.remove(mix)


def dress(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def studio(scene):
    """A plain grey room with a key light and a soft sky."""
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.quality = 90
    scene.view_settings.view_transform = "Standard"
    world = bpy.data.worlds.new("Studio")
    world.use_nodes = True
    back = world.node_tree.nodes["Background"]
    back.inputs[0].default_value = (0.62, 0.66, 0.72, 1.0)
    back.inputs[1].default_value = 0.9
    scene.world = world
    for name, energy, turn in (("Key", 3.2, (52, 0, -35)), ("Rim", 1.4, (60, 0, 150))):
        light = bpy.data.objects.new(name, bpy.data.lights.new(name, "SUN"))
        light.data.energy = energy
        light.data.angle = math.radians(12)
        light.rotation_euler = tuple(math.radians(a) for a in turn)
        scene.collection.objects.link(light)
    ground = bpy.data.meshes.new("Floor")
    ground.from_pydata([(-6, -6, 0), (6, -6, 0), (6, 6, 0), (-6, 6, 0)], [], [(0, 1, 2, 3)])
    floor = bpy.data.objects.new("Floor", ground)
    floor.data.materials.append(material("Floor", (0.30, 0.42, 0.24), rough=0.95))
    scene.collection.objects.link(floor)
    camera = bpy.data.objects.new("Camera", bpy.data.cameras.new("Camera"))
    scene.collection.objects.link(camera)
    scene.camera = camera
    return camera, floor


def shoot(scene, camera, path, target, distance, turn, lift=0.0, lens=85, size=(700, 1000)):
    """One picture: the camera `distance` metres from `target`, `turn`
    degrees round from straight ahead, `lift` metres above it."""
    scene.render.resolution_x, scene.render.resolution_y = size
    camera.data.lens = lens
    angle = math.radians(turn)
    camera.location = (target[0] + math.sin(angle) * distance, target[1] - math.cos(angle) * distance, target[2] + lift)
    aim = Vector(target) - camera.location
    camera.rotation_euler = aim.to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


BODY = (0.0, 0.0, 0.92)
HEAD = (0.0, -0.02, 1.665)


def previews(scene, camera, folder, tag, full=False):
    """Pictures of the player as he stands: always the head and the whole
    figure; with `full`, the back, the legs and a side view too."""
    os.makedirs(folder, exist_ok=True)
    shoot(scene, camera, os.path.join(folder, f"{tag}-front.jpg"), BODY, 7.5, 0)
    shoot(scene, camera, os.path.join(folder, f"{tag}-head.jpg"), HEAD, 1.5, 22, lens=85, size=(800, 800))
    shoot(scene, camera, os.path.join(folder, f"{tag}-head-side.jpg"), HEAD, 1.5, 80, lens=85, size=(800, 800))
    if full:
        shoot(scene, camera, os.path.join(folder, f"{tag}-back.jpg"), BODY, 7.5, 180)
        shoot(scene, camera, os.path.join(folder, f"{tag}-three-quarter.jpg"), BODY, 7.5, 40, lift=0.5)
        shoot(scene, camera, os.path.join(folder, f"{tag}-legs.jpg"), (0.0, 0.0, 0.45), 4.2, 25, lift=0.3, size=(800, 800))
