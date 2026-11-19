"""How much light each surface can catch.

A real stadium is bright where it is open to the sky and dim under the
roof and between the tiers. The website cannot work that out live, so
it is worked out here once and stored on the model:

    red    how much of the sky the spot can see
    green  how much of the sunlit pitch it can see (light bounces up off the grass)
    blue   1 where nothing is close by, lower in tight corners

The website's materials read those three numbers (see
app/components/world3d/stadium/StadiumModel.tsx).
"""

import math

from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

from . import params as P
from .builder import to_blender

RAYS = 36
NEAR = 2.6  # metres: anything closer than this counts as "close by"
ATTRIBUTE = "Col"


def _directions(count):
    """Directions spread over a dome, more of them near the top, so each
    stands for an equal share of the light arriving at a matte surface."""
    out = []
    golden = math.pi * (3 - math.sqrt(5))
    for i in range(count):
        u = (i + 0.5) / count
        r = math.sqrt(u)
        a = i * golden
        out.append(Vector((r * math.cos(a), r * math.sin(a), math.sqrt(max(0.0, 1 - u)))))
    return out


DOME = _directions(RAYS)
HALF_X = P.PITCH["length"] / 2 + 4
HALF_Z = P.PITCH["width"] / 2 + 4


def make_tree(objects):
    """Everything solid, plus the ground, as one searchable shape."""
    verts, polys = [], []
    for obj in objects:
        base = len(verts)
        world = obj.matrix_world
        verts.extend(world @ v.co for v in obj.data.vertices)
        polys.extend(tuple(base + i for i in p.vertices) for p in obj.data.polygons)
    base = len(verts)
    g = 320.0
    verts.extend(Vector(to_blender(p)) for p in ((-g, 0.0, -g), (g, 0.0, -g), (g, 0.0, g), (-g, 0.0, g)))
    polys.append((base, base + 1, base + 2, base + 3))
    return BVHTree.FromPolygons(verts, polys, all_triangles=False)


def _frame(normal):
    n = normal.normalized()
    helper = Vector((0.0, 0.0, 1.0)) if abs(n.z) < 0.9 else Vector((1.0, 0.0, 0.0))
    t = n.cross(helper).normalized()
    b = n.cross(t)
    return Matrix((t, b, n)).transposed()


def sample(tree, origin, normal, dome=DOME):
    """(sky, pitch, open) seen from a point, each from 0 to 1."""
    frame = _frame(normal)
    sky = pitch = near = 0
    for d in dome:
        direction = frame @ d
        hit, _n, _i, distance = tree.ray_cast(origin, direction)
        if hit is None:
            sky += 1
            continue
        if distance < NEAR:
            near += 1
        # Blender's z is height; the ground is at 0. Blender's y is the website's -z.
        if abs(hit.z) < 0.01 and abs(hit.x) < HALF_X and abs(hit.y) < HALF_Z:
            pitch += 1
    n = len(dome)
    return sky / n, pitch / n, 1 - near / n


def bake(tree, obj):
    """Store the three numbers on every corner of an object's faces."""
    mesh = obj.data
    world = obj.matrix_world
    rot = world.to_3x3()
    colours = [0.0] * (len(mesh.vertices) * 4)
    cache = {}
    for poly in mesh.polygons:
        normal = (rot @ poly.normal).normalized()
        centre = world @ poly.center
        for vi in poly.vertices:
            co = world @ mesh.vertices[vi].co
            key = (round(co.x, 2), round(co.y, 2), round(co.z, 2), round(normal.x, 1), round(normal.y, 1), round(normal.z, 1))
            value = cache.get(key)
            if value is None:
                # start just off the surface, a little toward the middle of the face
                origin = co + normal * 0.04 + (centre - co).normalized() * 0.05 if (centre - co).length > 1e-6 else co + normal * 0.04
                value = sample(tree, origin, normal)
                cache[key] = value
            colours[vi * 4: vi * 4 + 4] = (value[0], value[1], value[2], 1.0)
    attr = mesh.color_attributes.get(ATTRIBUTE) or mesh.color_attributes.new(name=ATTRIBUTE, type="FLOAT_COLOR", domain="POINT")
    attr.data.foreach_set("color", colours)
    mesh.color_attributes.active_color = attr
    mesh.color_attributes.render_color_index = list(mesh.color_attributes).index(attr)
    mesh.update()
    return len(cache)


def fill(obj, value):
    """Give an object the same three numbers everywhere (for moving parts)."""
    mesh = obj.data
    attr = mesh.color_attributes.get(ATTRIBUTE) or mesh.color_attributes.new(name=ATTRIBUTE, type="FLOAT_COLOR", domain="POINT")
    attr.data.foreach_set("color", [c for _ in mesh.vertices for c in (value[0], value[1], value[2], 1.0)])
    mesh.color_attributes.active_color = attr
    mesh.update()


SEAT_DOME = _directions(14)


def seat_light(tree, seats):
    """(sky, pitch) for every seat, measured at shoulder height."""
    up = Vector((0.0, 0.0, 1.0))
    out = []
    for seat in seats:
        origin = Vector(to_blender((seat[0], seat[1] + 0.9, seat[2])))
        sky, pitch, _near = sample(tree, origin, up, SEAT_DOME)
        out.append((sky, pitch))
    return out
