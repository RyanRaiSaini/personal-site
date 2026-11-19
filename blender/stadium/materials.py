"""The stadium's materials.

Each material has a plain colour here so the Blender file reads
correctly on its own. The photographed textures from Poly Haven are
added on top by textures.py, and the website builds its own version of
each material by name (app/components/world3d/stadium/materials.ts), so
a name here must match the name there.
"""

import bpy

# name: (colour, roughness, metalness, extra)
PALETTE = {
    "Concrete": ("#8a8b8a", 0.92, 0.0, {}),
    "Aisle": ("#7b7c7c", 0.92, 0.0, {}),
    "Riser": ("#7f8080", 0.92, 0.0, {}),
    "WallDark": ("#23272e", 0.82, 0.0, {}),
    "Fascia": ("#181b21", 0.6, 0.0, {}),
    "Soffit": ("#2a2e35", 0.86, 0.0, {}),
    "Hoarding": ("#0f1a36", 0.55, 0.0, {}),
    "BoxGlass": ("#0c1017", 0.08, 0.0, {}),
    "Void": ("#020203", 1.0, 0.0, {}),
    "Glass": ("#cfe0ee", 0.05, 0.0, {"alpha": 0.22}),
    "Ribbon": ("#05070a", 0.28, 0.0, {}),
    "Screen": ("#040507", 0.55, 0.0, {}),
    "ScreenBack": ("#15181d", 0.7, 0.0, {}),
    "RoofDeck": ("#3a3e45", 0.7, 0.3, {}),
    "RoofTop": ("#b9bec6", 0.5, 0.5, {}),
    "RingBeam": ("#d6dade", 0.5, 0.1, {}),
    "Steel": ("#e2e5e9", 0.45, 0.1, {}),
    "SteelDark": ("#2a2d33", 0.5, 0.6, {}),
    "FloodLens": ("#f5f8ff", 0.4, 0.0, {"emission": 2.0}),
    "FloodHousing": ("#15171b", 0.6, 0.4, {}),
    "Membrane": ("#f1f3f6", 0.8, 0.0, {}),
    "SeatPlastic": ("#1b2f6b", 0.45, 0.0, {}),
    "SeatFrame": ("#1a1c20", 0.5, 0.5, {}),
}


def _linear(hex_colour):
    """A web colour to the linear numbers Blender wants."""
    h = hex_colour.lstrip("#")
    out = []
    for i in (0, 2, 4):
        c = int(h[i: i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return out


def make_all():
    made = {}
    for name, (colour, roughness, metallic, extra) in PALETTE.items():
        mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
        mat.use_nodes = True
        bsdf = mat.node_tree.nodes.get("Principled BSDF")
        rgb = _linear(colour)
        bsdf.inputs["Base Color"].default_value = (*rgb, 1.0)
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = metallic
        mat.diffuse_color = (*rgb, extra.get("alpha", 1.0))
        if "alpha" in extra:
            bsdf.inputs["Alpha"].default_value = extra["alpha"]
            mat.surface_render_method = "BLENDED"
        if "emission" in extra:
            bsdf.inputs["Emission Color"].default_value = (*rgb, 1.0)
            bsdf.inputs["Emission Strength"].default_value = extra["emission"]
        made[name] = mat
    return made
