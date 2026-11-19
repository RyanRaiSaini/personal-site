"""How much light each surface can catch.

A real stadium is bright where it is open to the sky and dim under the
roof and between the tiers, and the roof throws one large shadow. The
website cannot work that out live on an ordinary laptop, so it is worked
out here once and stored on the model, four numbers per corner:

    red    how much of the sky the spot can see
    green  how much of the sunlit pitch it can see (light bounces up off the grass)
    blue   1 where nothing is close by, lower in tight corners
    alpha  1 where the sun reaches, 0 in the roof's shadow, between at the edge

The website's materials read them (app/components/world3d/stadium/materials.ts).
The same is done for each seat, and for the pitch as a small picture.
"""

import math

import bpy
import numpy as np
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


def _sun_rays(per_ring=6, spread_degrees=0.9, rings=1):
    """A few directions toward the sun, fanned out a little. The real sun
    is a disc, not a point, which is what makes a shadow's edge soft."""
    el = math.radians(P.SUN["elevation"])
    az = math.radians(P.SUN["compass"])
    centre = Vector(to_blender((math.cos(el) * math.cos(az), math.sin(el), math.cos(el) * math.sin(az)))).normalized()
    helper = Vector((0.0, 0.0, 1.0))
    side = centre.cross(helper).normalized()
    up = side.cross(centre).normalized()
    spread = math.tan(math.radians(spread_degrees))
    out = [centre]
    for ring in range(1, rings + 1):
        radius = spread * ring / rings
        for i in range(per_ring):
            a = 2 * math.pi * (i + 0.5 * ring) / per_ring
            out.append((centre + (side * math.cos(a) + up * math.sin(a)) * radius).normalized())
    return out


DOME = _directions(RAYS)
SEAT_DOME = _directions(14)
SUN = _sun_rays()
# A seat is either lit or not, all of it at once, so a sharp shadow edge
# would show as a staircase of single seats. A wider fan fades the edge
# over three or four seats, which reads as one soft line from a distance.
SEAT_SUN = _sun_rays(per_ring=7, spread_degrees=2.6, rings=3)
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


def sun_reaches(tree, origin, rays=SUN):
    """How much of the sun's disc can be seen from a point, 0 to 1."""
    clear = 0
    for direction in rays:
        hit, _n, _i, _d = tree.ray_cast(origin, direction)
        if hit is None:
            clear += 1
    return clear / len(rays)


def sample(tree, origin, normal, dome=DOME):
    """(sky, pitch, open, sun) seen from a point, each from 0 to 1."""
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
    # a surface facing away from the sun gets none of it, whatever is in the way
    facing_sun = normal.dot(SUN[0]) > 0.0
    return sky / n, pitch / n, 1 - near / n, sun_reaches(tree, origin) if facing_sun else 0.0


def bake(tree, obj):
    """Store the four numbers on every corner of an object's faces."""
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
                inward = centre - co
                origin = co + normal * 0.04 + (inward.normalized() * 0.05 if inward.length > 1e-6 else Vector((0.0, 0.0, 0.0)))
                value = sample(tree, origin, normal)
                cache[key] = value
            colours[vi * 4: vi * 4 + 4] = value
    _store(mesh, colours)
    return len(cache)


def _store(mesh, colours):
    attr = mesh.color_attributes.get(ATTRIBUTE) or mesh.color_attributes.new(name=ATTRIBUTE, type="FLOAT_COLOR", domain="POINT")
    attr.data.foreach_set("color", colours)
    mesh.color_attributes.active_color = attr
    mesh.color_attributes.render_color_index = list(mesh.color_attributes).index(attr)
    mesh.update()


def fill(obj, value):
    """Give an object the same four numbers everywhere (for moving parts)."""
    mesh = obj.data
    _store(mesh, [c for _ in mesh.vertices for c in value])


def seat_light(tree, seats):
    """(sky, pitch, sun) for every seat, measured at shoulder height."""
    up = Vector((0.0, 0.0, 1.0))
    out = []
    for seat in seats:
        origin = Vector(to_blender((seat[0], seat[1] + 0.9, seat[2])))
        sky, pitch, _near, _sun = sample(tree, origin, up, SEAT_DOME)
        # the sun is measured lower down, at the seat itself
        sun = sun_reaches(tree, Vector(to_blender((seat[0], seat[1] + 0.6, seat[2]))), SEAT_SUN)
        out.append((sky, pitch, sun))
    return out


def pitch_picture(tree, path, metres_per_pixel=0.5):
    """A small picture of the light on the ground inside the stands:
    red is how much sky each spot sees, green is how much sun.

    It covers the whole floor of the bowl. The website stretches it over
    the pitch, and uses it for anything standing on the grass too.
    """
    hx, hz = P.BOWL["hx"], P.BOWL["hz"]
    width = int(round(2 * hx / metres_per_pixel))
    height = int(round(2 * hz / metres_per_pixel))
    up = Vector((0.0, 0.0, 1.0))
    pixels = np.zeros((height, width, 4), dtype=np.float32)
    pixels[..., 3] = 1.0
    for j in range(height):
        z = -hz + (j + 0.5) * (2 * hz / height)
        for i in range(width):
            x = -hx + (i + 0.5) * (2 * hx / width)
            origin = Vector(to_blender((x, 0.06, z)))
            sky, _pitch, _near, sun = sample(tree, origin, up, SEAT_DOME)
            pixels[j, i, 0] = sky
            pixels[j, i, 1] = sun
    image = bpy.data.images.new("pitch-light", width, height, alpha=False)
    # these are measurements, not colours: store them exactly as they are
    image.colorspace_settings.name = "Non-Color"
    image.pixels.foreach_set(pixels.ravel())
    image.filepath_raw = path
    image.file_format = "PNG"
    image.save()
    bpy.data.images.remove(image)
    return width, height
