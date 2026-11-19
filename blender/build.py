"""Builds the stadium from scratch.

    blender --background --factory-startup --python blender/build.py -- \
        --blend  <where to save the editable Blender file> \
        --site   <the website's public/stadium folder> \
        [--preview <folder for quick pictures>]

It writes:
    the Blender file            the editable source, every part named
    stadium.raw.glb             the model, before it is squeezed for the web
    seats-positions.bin         where every seat goes
    seats-details.bin           tier, row and light for every seat
    manifest.json               counts, chunks and the measurements the site needs

Nothing here is drawn by hand. Change a number in stadium/params.py and
run it again.
"""

import argparse
import json
import math
import os
import sys
import time

import bpy
from mathutils import Vector

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from stadium import layout as L  # noqa: E402
from stadium import materials, occlusion, roof, seats, structure, terraces  # noqa: E402
from stadium import params as P  # noqa: E402
from stadium.builder import Builder, to_blender  # noqa: E402


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--blend", required=True)
    parser.add_argument("--site", required=True)
    parser.add_argument("--preview")
    parser.add_argument("--keep-scene", action="store_true", help="add to the open file instead of starting empty")
    return parser.parse_args(argv)


def log(message):
    print(f"[stadium] {message}", flush=True)


def make_collection(name, parent=None):
    coll = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    holder = parent or bpy.context.scene.collection
    if coll.name not in holder.children:
        holder.children.link(coll)
    return coll


def single_material(obj, shade_for):
    """Fold an object's materials into its first one, keeping the
    difference as a colour painted on the faces."""
    mesh = obj.data
    attr = mesh.color_attributes.new(name=occlusion.ATTRIBUTE, type="FLOAT_COLOR", domain="POINT")
    colours = [1.0] * (len(mesh.vertices) * 4)
    face_shades = mesh.get("shades")
    for poly in mesh.polygons:
        shade = shade_for(mesh.materials[poly.material_index].name)
        for vi in poly.vertices:
            k = face_shades[vi] if face_shades else 1.0
            colours[vi * 4: vi * 4 + 4] = (shade[0] * k, shade[1] * k, shade[2] * k, 1.0)
        poly.material_index = 0
    attr.data.foreach_set("color", colours)
    mesh.color_attributes.active_color = attr
    while len(mesh.materials) > 1:
        mesh.materials.pop(index=len(mesh.materials) - 1)
    mesh.update()


def scatter_seats(collection, all_seats, seat_obj):
    """Show every seat in the Blender file by copying one seat onto a
    cloud of points. (The website does the same thing its own way.)"""
    mesh = bpy.data.meshes.new("SeatPoints")
    mesh.vertices.add(len(all_seats))
    mesh.vertices.foreach_set("co", [c for s in all_seats for c in to_blender((s[0], s[1], s[2]))])
    turn = mesh.attributes.new("turn", "FLOAT", "POINT")
    turn.data.foreach_set("value", [s[3] for s in all_seats])
    obj = bpy.data.objects.new("SeatPoints", mesh)
    collection.objects.link(obj)

    tree = bpy.data.node_groups.new("Scatter seats", "GeometryNodeTree")
    tree.interface.new_socket("Geometry", in_out="INPUT", socket_type="NodeSocketGeometry")
    tree.interface.new_socket("Geometry", in_out="OUTPUT", socket_type="NodeSocketGeometry")
    n_in = tree.nodes.new("NodeGroupInput")
    n_out = tree.nodes.new("NodeGroupOutput")
    inst = tree.nodes.new("GeometryNodeInstanceOnPoints")
    info = tree.nodes.new("GeometryNodeObjectInfo")
    info.inputs["Object"].default_value = seat_obj
    info.inputs["As Instance"].default_value = True
    named = tree.nodes.new("GeometryNodeInputNamedAttribute")
    named.data_type = "FLOAT"
    named.inputs["Name"].default_value = "turn"
    combine = tree.nodes.new("ShaderNodeCombineXYZ")
    links = tree.links
    links.new(n_in.outputs[0], inst.inputs["Points"])
    links.new(info.outputs["Geometry"], inst.inputs["Instance"])
    links.new(named.outputs[0], combine.inputs["Z"])
    links.new(combine.outputs[0], inst.inputs["Rotation"])
    links.new(inst.outputs[0], n_out.inputs[0])
    mod = obj.modifiers.new("Scatter seats", "NODES")
    mod.node_group = tree
    return obj


def render_previews(folder, collection):
    """A few quick pictures, so the shape can be checked without opening Blender."""
    os.makedirs(folder, exist_ok=True)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    shading = scene.display.shading
    shading.light = "STUDIO"
    shading.color_type = "MATERIAL"
    shading.show_cavity = True
    shading.cavity_type = "BOTH"
    shading.show_shadows = True
    shading.shadow_intensity = 0.45
    scene.display.light_direction = (0.35, 0.55, 0.75)
    scene.render.resolution_x, scene.render.resolution_y = 1280, 720
    scene.render.image_settings.file_format = "JPEG"
    scene.render.image_settings.quality = 88
    scene.world = bpy.data.worlds.new("Preview") if not scene.world else scene.world
    scene.world.color = (0.55, 0.65, 0.8)
    cam_data = bpy.data.cameras.new("PreviewCamera")
    cam_data.clip_start, cam_data.clip_end = 0.3, 2000
    cam = bpy.data.objects.new("PreviewCamera", cam_data)
    collection.objects.link(cam)
    scene.camera = cam
    shots = [
        ("overview", (0, 23.5, 64), (0, 9.5, 0), 52),
        ("upper-deck", (0, 37, 71), (0, 4, -10), 46),
        ("corner", (58, 26, 46), (0, 8, 0), 50),
        ("pitch-level", (-30, 1.7, 0), (40, 9, -6), 55),
        ("dugout", (-8.5, 2.5, -29), (-15.5, 1.5, -41), 42),
        ("roof", (0, 5, 20), (0, 43, -40), 52),
        ("aerial", (150, 150, 190), (0, 20, 0), 38),
        ("section", (0, 24, 0.1), (62, 22, 0), 60),
    ]
    for name, position, target, fov in shots:
        cam.location = Vector(to_blender(position))
        direction = Vector(to_blender(target)) - cam.location
        cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
        cam_data.sensor_fit = "VERTICAL"
        cam_data.angle_y = math.radians(fov)
        scene.render.filepath = os.path.join(folder, f"{name}.jpg")
        bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam)


def main():
    args = parse_args()
    # Blender reads a relative path as "beside the open file", so pin them down
    args.site = os.path.abspath(args.site)
    args.blend = os.path.abspath(args.blend)
    started = time.time()
    if not args.keep_scene:
        bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    os.makedirs(args.site, exist_ok=True)

    root = make_collection("Stadium")
    seat_coll = make_collection("Seats", root)
    mats = materials.make_all()

    # ---- the concrete, steel and glass ----
    steps = Builder("Terraces")
    walls = Builder("Structure")
    glass = Builder("Glass")
    ribbons = Builder("Ribbons")
    roofing = Builder("Roof")
    steel = Builder("Steel")
    screen = Builder("Screen")
    lamps = Builder("Floodlights")

    terraces.build_steps(steps)
    terraces.build_entrances(walls, glass)
    terraces.build_tunnel_housing(walls)
    structure.build_pitch_wall(walls, glass)
    structure.build_tier_fronts(walls, ribbons, glass)
    structure.build_undersides(walls)
    structure.build_walkways_and_back_walls(walls)
    roof.build_fixed_roof(roofing)
    roof.build_trusses(steel)
    roof.build_screen(screen, walls, steel)
    roof.build_floodlights(lamps, walls, steel)

    objects = {}
    for b in (steps, walls, glass, ribbons, roofing, steel, screen, lamps):
        objects[b.name] = b.build(root, mats)
        log(f"{b.name}: {b.count()} faces")

    panels = []
    for k in range(P.ROOF["panel_count"]):
        b = roof.build_panel(k)
        obj = b.build(root, mats)
        obj.location = Vector(to_blender((roof.panel_closed_x(k), roof.PANEL_Y, 0.0)))
        panels.append(obj)
    log(f"Roof panels: {len(panels)} x {roof.build_panel(0).count()} faces")

    # ---- the seats ----
    seat_hi = seats.build_seat("SeatHi", True).build(seat_coll, mats)
    seat_lo = seats.build_seat("SeatLo", False).build(seat_coll, mats)
    for obj in (seat_hi, seat_lo):
        single_material(obj, lambda name: (1.0, 1.0, 1.0) if name == "SeatPlastic" else (0.13, 0.13, 0.14))
    all_seats, chunks = seats.all_seats()
    log(f"Seats: {len(all_seats)} in {len(chunks)} chunks")

    # ---- light ----
    bpy.context.view_layer.update()
    solid = [objects[n] for n in ("Terraces", "Structure", "Roof", "Screen")]
    tree = occlusion.make_tree(solid)
    for name in ("Terraces", "Structure", "Roof", "Steel", "Screen", "Ribbons", "Floodlights"):
        unique = occlusion.bake(tree, objects[name])
        log(f"light on {name}: {unique} points measured")
    occlusion.fill(objects["Glass"], (1.0, 1.0, 1.0, 1.0))
    for obj in panels:
        occlusion.fill(obj, (0.55, 0.35, 1.0, 1.0))
    light = occlusion.seat_light(tree, all_seats)
    log(f"light on seats: sky {sum(s[0] for s in light) / len(light):.2f} average, {sum(1 for s in light if s[2] > 0.5)} in the sun")
    size = occlusion.pitch_picture(tree, os.path.join(os.path.abspath(args.site), "pitch-light.png"))
    log(f"light on the pitch: a {size[0]} x {size[1]} picture")

    # ---- show the seats in the Blender file ----
    try:
        scatter_seats(seat_coll, all_seats, seat_lo)
    except Exception as error:  # the file is still complete without this
        log(f"could not scatter seats in the Blender file: {error}")

    # ---- files for the website ----
    seats.write_seats(os.path.join(args.site, "seats-positions.bin"), os.path.join(args.site, "seats-details.bin"), all_seats, light)
    manifest = {
        "seats": len(all_seats),
        "chunks": chunks,
        "tiers": [{"name": t["name"], "d0": t["d0"], "y0": t["y0"], "rows": t["rows"], "rise": t["rise"], "backWall": round(L.back_wall_d(t), 3), "top": round(L.tier_back(t)[1], 3)} for t in P.TIERS],
        "roof": {"innerD": P.ROOF["inner_d"], "innerY": P.ROOF["inner_y"], "outerD": round(roof.OUTER_D, 3), "outerY": P.ROOF["outer_y"],
                 "panelCount": P.ROOF["panel_count"], "panelWidth": round(roof.PANEL_WIDTH, 4), "panelDepth": round(roof.PANEL_DEPTH, 3), "panelY": roof.PANEL_Y,
                 "panelClosedX": [round(roof.panel_closed_x(k), 4) for k in range(P.ROOF["panel_count"])]},
        "screen": P.SCREEN,
        "floods": P.FLOODS,
        "mosaic": seats.MOSAIC,
        "sun": P.SUN,
        "ground": {"halfX": P.BOWL["hx"], "halfZ": P.BOWL["hz"]},
        "seat": {"pitch": P.SEAT_PITCH, "tread": P.TREAD},
    }
    with open(os.path.join(args.site, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, separators=(",", ":"))

    bpy.ops.object.select_all(action="DESELECT")
    export = list(objects.values()) + panels + [seat_hi, seat_lo]
    for obj in export:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objects["Terraces"]
    glb = os.path.join(args.site, "stadium.raw.glb")
    bpy.ops.export_scene.gltf(
        filepath=glb, export_format="GLB", use_selection=True, export_apply=True, export_yup=True,
        export_vertex_color="ACTIVE", export_all_vertex_colors=False, export_image_format="NONE",
        export_materials="EXPORT", export_cameras=False, export_lights=False, export_animations=False, export_extras=False,
    )
    bpy.ops.object.select_all(action="DESELECT")
    log(f"exported {os.path.getsize(glb) / 1048576:.2f} MB to {glb}")

    if args.preview:
        render_previews(args.preview, root)

    os.makedirs(os.path.dirname(os.path.abspath(args.blend)), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(args.blend), check_existing=False)
    triangles = sum(len(o.data.polygons) for o in export) * 2
    log(f"done in {time.time() - started:.1f}s: {triangles} triangles in the model, {len(all_seats)} seats")


if __name__ == "__main__":
    main()
