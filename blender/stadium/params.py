"""The stadium's measurements, in metres.

Everything is written in the website's own directions, so numbers here
match app/components/world3d/stadium/dims.ts:

    x  along the pitch (north is +x)
    y  height above the pitch
    z  across the pitch (the main stand is at -z)

Distances "d" are measured outward from the front wall of the stands.

The outer proportions come from a scan of the real building (Model A in
docs/redesign/MODELS.md): 252.6 m by 205.3 m and 58.8 m tall. The pitch
and the space around it keep the site's existing measurements, so the
cameras and clickable objects stay where they were.
"""

PITCH = {"length": 105.0, "width": 68.0}

# The front wall of the stands: a rounded rectangle round the pitch
BOWL = {"hx": 62.0, "hz": 42.0, "r": 20.0}

# One row of seats: how deep the step is, and how far apart seats sit
TREAD = 0.8
SEAT_PITCH = 0.5

AISLE_WIDTH = 1.2
VOMITORY_WIDTH = 3.0
CROSS_AISLE = 2.2  # the walkway behind the last row of each tier
SLAB = 1.0  # how far the front edge of an upper tier drops below its first row

# The four tiers, from the pitch upward. `d0`, `y0`: where the first
# row starts. `rise`: how much higher each row is than the one in front.
# Upper tiers start in front of where the tier below ends, so they
# overhang it.
TIERS = [
    {"name": "lower", "d0": 2.0, "y0": 1.25, "rows": 24, "rise": 0.30, "corner_bays": 3, "vomitory": None},
    {"name": "first", "d0": 15.8, "y0": 12.4, "rows": 16, "rise": 0.44, "corner_bays": 4, "vomitory": {"row": 4, "rows": 5}},
    {"name": "second", "d0": 23.6, "y0": 23.2, "rows": 16, "rise": 0.50, "corner_bays": 6, "vomitory": {"row": 4, "rows": 4}},
    {"name": "upper", "d0": 31.6, "y0": 34.2, "rows": 17, "rise": 0.56, "corner_bays": 7, "vomitory": {"row": 5, "rows": 4}},
]

# Aisles on the straight sides are this far apart (the nearest fit is used)
BAY_WIDTH = 14.0

FRONT_WALL_HEIGHT = 1.25
PARAPET = 0.55  # solid wall at the front of each upper tier, above the first row
BALUSTRADE = 1.1  # top of the glass above the first row

# The roof. Its underside rises gently toward the opening.
ROOF = {
    "outer_d": 46.6,  # where the ceiling meets the back wall of the top tier
    "outer_y": 47.3,
    "inner_d": -4.0,  # the edge of the opening (negative = out over the pitch)
    "inner_y": 50.6,
    "ring_depth": 2.9,  # the ring of steel round the opening
    "truss_spacing": 11.0,
    "panel_count": 10,
    "panel_lift": 1.1,
}

# The ring of screens under the inner edge of the roof
SCREEN = {"bottom_d": -4.9, "bottom_y": 43.4, "top_d": -4.25, "top_y": 48.9}

# The bar of floodlights below and behind the screens
FLOODS = {"d": -2.4, "y": 42.4, "spacing": 1.7}

# The players' tunnel, in the middle of the main (west) stand
TUNNEL = {"half_width": 3.0, "height": 3.1}

# The sun. By day the website lights the stadium with one fixed sun, so
# its shadows can be worked out here once. These two numbers must match
# app/components/world3d/atmosphere/daylight.ts.
SUN = {"compass": 114.0, "elevation": 47.88}  # degrees from north (+x) toward east (+z); degrees above the horizon

# The outer shell, measured from the scan
SHELL = {"length": 252.6, "width": 205.3, "height": 58.8}
