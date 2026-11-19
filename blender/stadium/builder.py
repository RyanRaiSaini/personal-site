"""Collects flat four-sided faces and turns them into a Blender mesh.

Points are given in the website's directions (x along the pitch, y up,
z across). Blender's own "up" is Z, so each point is turned as it is
stored; the glTF exporter turns it back, and the website receives the
same numbers that were written here.

Faces are deliberately not welded together. A step's top and its front
meet at an edge but catch very different amounts of light, and keeping
their corners separate lets each face carry its own shading.
"""

import bpy


def to_blender(p):
    """Website directions (x, y up, z) to Blender's (x, -z, y up)."""
    return (p[0], -p[2], p[1])


class Builder:
    def __init__(self, name):
        self.name = name
        self.verts = []
        self.faces = []
        self.uvs = []
        self.face_material = []
        self.materials = []

    def _material_index(self, name):
        if name not in self.materials:
            self.materials.append(name)
        return self.materials.index(name)

    def quad(self, p0, p1, p2, p3, material, facing, uv=None):
        """Add a four-sided face.

        `facing` is a direction the face should be seen from; the corners
        are reordered if needed so the face points that way.
        `uv` is four (u, v) pairs in metres, matching the corners.
        """
        pts = [p0, p1, p2, p3]
        uv = uv or [(0.0, 0.0), (1.0, 0.0), (1.0, 1.0), (0.0, 1.0)]
        ax, ay, az = (p1[i] - p0[i] for i in range(3))
        bx, by, bz = (p3[i] - p0[i] for i in range(3))
        nx, ny, nz = ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx
        if nx * facing[0] + ny * facing[1] + nz * facing[2] < 0:
            pts = [p0, p3, p2, p1]
            uv = [uv[0], uv[3], uv[2], uv[1]]
        base = len(self.verts)
        self.verts.extend(to_blender(p) for p in pts)
        self.faces.append((base, base + 1, base + 2, base + 3))
        self.uvs.extend(uv)
        self.face_material.append(self._material_index(material))

    def box(self, centre, size, material, axes=None):
        """A box, optionally turned: `axes` is three unit directions."""
        ax, ay, az = axes or ((1, 0, 0), (0, 1, 0), (0, 0, 1))
        hx, hy, hz = size[0] / 2, size[1] / 2, size[2] / 2

        def corner(sx, sy, sz):
            return tuple(centre[i] + ax[i] * hx * sx + ay[i] * hy * sy + az[i] * hz * sz for i in range(3))

        for axis, (u_axis, v_axis), (hu, hv), sign in (
            (ax, (ay, az), (hy, hz), 1), (ax, (ay, az), (hy, hz), -1),
            (ay, (ax, az), (hx, hz), 1), (ay, (ax, az), (hx, hz), -1),
            (az, (ax, ay), (hx, hy), 1), (az, (ax, ay), (hx, hy), -1),
        ):
            half = hx if axis is ax else hy if axis is ay else hz
            o = tuple(centre[i] + axis[i] * half * sign for i in range(3))
            pts = [tuple(o[i] + u_axis[i] * hu * su + v_axis[i] * hv * sv for i in range(3)) for su, sv in ((-1, -1), (1, -1), (1, 1), (-1, 1))]
            uv = [(-hu, -hv), (hu, -hv), (hu, hv), (-hu, hv)]
            self.quad(*pts, material, tuple(a * sign for a in axis), uv)
        return corner

    def beam(self, a, b, width, material, up=(0.0, 1.0, 0.0)):
        """A square bar from point a to point b."""
        d = [b[i] - a[i] for i in range(3)]
        length = (d[0] ** 2 + d[1] ** 2 + d[2] ** 2) ** 0.5
        if length < 1e-6:
            return
        z = [c / length for c in d]
        # a sideways direction, square to the bar
        x = [up[1] * z[2] - up[2] * z[1], up[2] * z[0] - up[0] * z[2], up[0] * z[1] - up[1] * z[0]]
        xl = (x[0] ** 2 + x[1] ** 2 + x[2] ** 2) ** 0.5
        if xl < 1e-6:
            x = [1.0, 0.0, 0.0]
            xl = 1.0
        x = [c / xl for c in x]
        y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]]
        centre = [(a[i] + b[i]) / 2 for i in range(3)]
        self.box(centre, (width, width, length), material, (x, y, z))

    def count(self):
        return len(self.faces)

    def build(self, collection, materials):
        """Make the Blender object. `materials` maps names to materials."""
        mesh = bpy.data.meshes.new(self.name)
        mesh.from_pydata(self.verts, [], self.faces)
        layer = mesh.uv_layers.new(name="UVMap")
        flat = [c for uv in self.uvs for c in uv]
        layer.data.foreach_set("uv", flat)
        for name in self.materials:
            mesh.materials.append(materials[name])
        mesh.polygons.foreach_set("material_index", self.face_material)
        mesh.update()
        obj = bpy.data.objects.new(self.name, mesh)
        collection.objects.link(obj)
        return obj
