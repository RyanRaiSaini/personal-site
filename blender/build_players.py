"""Builds the footballer.

    blender --background --factory-startup --python blender/build_players.py -- \
        --source  <folder holding the Mixamo downloads> \
        --blend   <where to save the editable Blender file> \
        --site    <the website's public/players folder> \
        [--preview <folder for quick pictures>]

The base is "Remy", a stock character from Adobe's Mixamo library, used
for his body and his skeleton only: Mixamo's motion-capture clips fit
that skeleton. Everything that makes him a footballer is done here:
the white kit, the thighs the base model comes without, dark hair and
eyes, the hairstyles and beards. Nothing is drawn by hand. Change a
number in players/params.py and run it again.

The Mixamo files themselves are not in this repository (see
docs/redesign/ASSETS.md for where they come from).
"""

import argparse
import json
import os
import sys
import time

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from players import body, clips, head, kit, look, stances  # noqa: E402
from players import params as P  # noqa: E402

# The movements, each from one Mixamo file in the source folder.
#   loop    it repeats: the site needs to know how fast the ground goes by
#   travel  the player covers ground in it: taken out here and written down
#   kick    it has a kick in it: the moment and the place are written down
#   frames  only this part of the file is used
CLIPS = [
    ("idle", "breathing idle.fbx", {"loop": True}),
    ("jog", "jog forward.fbx", {"loop": True, "travel": True}),
    ("run", "running.fbx", {"loop": True}),
    ("penalty", "soccer penalty kick.fbx", {"travel": True, "kick": True}),
    ("strike", "strike foward jog.fbx", {"travel": True, "kick": True}),
    ("long-pass", "goalkeeper placing ball (2).fbx", {"travel": True, "kick": True, "frames": (150, 240)}),
    ("victory", "victory.fbx", {"frames": (52, 168)}),
    ("sit", "sitting idle.fbx", {"loop": True}),
    ("keeper-ready", "goalkeeper idle.fbx", {"loop": True}),
    ("keeper-dive", "goalkeeper diving save (2).fbx", {"travel": True}),
]


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True)
    parser.add_argument("--blend", required=True)
    parser.add_argument("--site", required=True)
    parser.add_argument("--preview")
    parser.add_argument("--no-clips", action="store_true", help="the model only, for a quick look")
    return parser.parse_args(argv)


def picture_of(obj, slot):
    """The picture a base-model mesh uses for its colour, folds or cover."""
    wanted = {"colour": "Base Color", "folds": "Color", "cover": "Alpha"}[slot]
    for node in obj.data.materials[0].node_tree.nodes:
        if node.type == "TEX_IMAGE" and node.image and any(link.to_socket.name == wanted for out in node.outputs for link in out.links):
            return node.image
    return None


def main():
    args = parse_args()
    source = os.path.abspath(args.source)
    blend = os.path.abspath(args.blend)
    site = os.path.abspath(args.site)
    work = os.path.join(os.path.dirname(blend), "player-pictures")
    started = time.time()

    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    os.makedirs(site, exist_ok=True)

    arm, meshes, scale = body.load_base(os.path.join(source, P.BASE["file"]))
    skin_obj = meshes[P.BASE["body"]]
    shirt = meshes[P.BASE["shirt"]]
    shorts = meshes[P.BASE["shorts"]]
    boots = meshes[P.BASE["boots"]]
    hair = meshes[P.BASE["hair"]]
    eyes = meshes[P.BASE["eyes"]]

    # the pictures the base model came with, before its materials go
    base = {
        "skin": picture_of(skin_obj, "colour"),
        "shirt": picture_of(shirt, "colour"),
        "shirt_folds": picture_of(shirt, "folds"),
        "boots": picture_of(boots, "colour"),
        "hair": picture_of(hair, "colour"),
        "hair_cover": picture_of(hair, "cover"),
    }

    # ---- the body ----
    bpy.data.objects.remove(meshes[P.BASE["lashes"]])
    body.tidy(skin_obj)
    body.shape_up(arm, [skin_obj, shirt, shorts, boots, hair, eyes])
    thighs = body.build_thighs(skin_obj, arm)

    # ---- the kit ----
    kit.fit_shorts(shorts, arm, thighs)
    kit.lower_boots(boots)
    socks = kit.make_socks(skin_obj)
    printed = kit.back_of_shirt(shirt)

    # ---- pictures and materials ----
    skin_picture, tone, maps = head.paint_skin(base["skin"], work)
    marks = head.landmarks(skin_obj, maps)
    beards = head.make_beards(skin_obj, marks)
    curls = head.make_curls(skin_obj, maps)
    mats = {
        "Skin": look.material("Skin", picture=skin_picture, rough=0.62),
        "Eyes": look.material("Eyes", picture=skin_picture, rough=0.25),
        "Shirt": look.material("Shirt", picture=kit.paint_shirt(base["shirt"], work), folds=kit.shirt_folds(base["shirt_folds"], work), rough=0.78),
        "Shorts": look.material("Shorts", colour=P.WHITE, rough=0.8, both_sides=True),
        "Socks": look.material("Socks", painted=True, rough=0.85, both_sides=True),
        "Boots": look.material("Boots", picture=kit.paint_boots(base["boots"], work), rough=0.42),
        "Hair": look.material("Hair", colour=P.HAIR, picture=head.paint_hair(base["hair"], base["hair_cover"], work), rough=0.55, see_through=True, both_sides=True),
        "Curls": look.material("Curls", colour=P.HAIR, folds=head.paint_ringlets(work), rough=0.85),
        "Beard": look.material("Beard", colour=P.HAIR, painted=True, rough=0.9, see_through=True),
    }
    parts = [(skin_obj, "Body", "Skin"), (eyes, "Eyes", "Eyes"), (shirt, "Shirt", "Shirt"), (shorts, "Shorts", "Shorts"), (socks, "Socks", "Socks"), (boots, "Boots", "Boots"), (hair, "HairMedium", "Hair"), (curls, "HairCurls", "Curls")]
    parts += [(beard, beard.name, "Beard") for beard in beards]
    for obj, name, mat in parts:
        obj.name = name
        obj.data.name = name
        look.dress(obj, mats[mat])
        for poly in obj.data.polygons:
            poly.use_smooth = True

    if args.preview:
        # The players the site has, to see each one before it goes out.
        # (The tones are the site's own: app/components/world3d/players/kits.ts.)
        camera, _ = look.studio(scene)
        extras = [hair, curls, *beards]
        tone_linear = [look.to_linear(c) for c in tone]
        for tag, skin_tone, wears, full in (
            ("eight", (0.639, 0.435, 0.282), ("HairMedium", "BeardGoatee"), True),
            ("six", (0.655, 0.467, 0.310), ("HairCurls", "BeardChin"), True),
            ("ten", (0.486, 0.298, 0.188), (), False),
            ("sixty-six", (0.690, 0.502, 0.353), ("HairCurls", "BeardStrap"), False),
        ):
            for obj in extras:
                obj.hide_render = obj.name not in wears
            look.tint(mats["Skin"], tuple(look.to_linear(c) / t for c, t in zip(skin_tone, tone_linear)))
            look.previews(scene, camera, os.path.abspath(args.preview), tag, full)
        look.untint(mats["Skin"])
        for obj in extras:
            obj.hide_render = False

    # ---- movement ----
    manifest = {"height": P.HEIGHT, "skin": tone, "print": printed, "clips": {}, "stances": {}}
    if not args.no_clips:
        scene.render.fps = 30
        standing = None
        for name, file, wants in CLIPS:
            action = clips.bring_in(os.path.join(source, file), name, arm, scale)
            if "frames" in wants:
                clips.trim(action, *wants["frames"])
            first, last = clips.span(action)
            note = {"length": round((last - first) / 30.0, 4)}
            if wants.get("kick"):
                note["kick"] = clips.kick(arm, action)
            travel = clips.ground_travel(arm, action, keep=not wants.get("travel"))
            if wants.get("loop"):
                note["loop"] = True
                note["speed"] = round(travel[-1][1] / note["length"], 3) if wants.get("travel") else clips.ground_speed(arm, action)
            elif wants.get("travel"):
                note["travel"] = [list(step) for step in travel]
            manifest["clips"][name] = note
            if name == "idle":
                standing = action
            body.log(f"clip {name}: {note['length']}s" + (f", kick at {note['kick']['at']}s with the {note['kick']['foot']} foot at {note['kick']['where']}" if "kick" in note else "") + (f", ground speed {note['speed']} m/s" if "speed" in note else "") + (f", travels to {travel[-1]}" if "travel" in note else ""))
        manifest["stances"] = stances.make_all(arm, standing)
        body.log(f"poses: {', '.join(manifest['stances'])}")

    # ---- files for the website ----
    with open(os.path.join(site, "player.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, separators=(",", ":"))
    export = [arm] + [obj for obj, _, _ in parts]
    body.select(export, arm)
    for obj in export:
        obj.hide_render = False
    glb = os.path.join(site, "player.raw.glb")
    bpy.ops.export_scene.gltf(
        filepath=glb, export_format="GLB", use_selection=True, export_apply=False, export_yup=True,
        export_vertex_color="ACTIVE", export_all_vertex_colors=False, export_image_format="AUTO",
        export_materials="EXPORT", export_cameras=False, export_lights=False, export_extras=False,
        export_skins=True, export_influence_nb=4, export_def_bones=False, export_leaf_bone=False,
        export_animations=not args.no_clips, export_animation_mode="ACTIONS", export_anim_single_armature=True,
        export_force_sampling=True, export_optimize_animation_size=True, export_anim_slide_to_zero=True,
        export_nla_strips=True, export_frame_step=1,
    )
    body.log(f"exported {os.path.getsize(glb) / 1048576:.2f} MB to {glb}")

    os.makedirs(os.path.dirname(blend), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=blend, check_existing=False)
    body.log(f"done in {time.time() - started:.1f}s; skin tone {tone}; print {printed}; scale {scale:.5f}")


if __name__ == "__main__":
    main()
