"""The numbers the footballer is built from.

Change one and run the build again (see build.py). Lengths are in
metres, for a player 1.80 m tall; the site scales each player to his
own height afterwards (app/components/world3d/players/kits.ts).
"""

# The player is built at this height; the base model is scaled to it.
HEIGHT = 1.80

# ---- the base model's own names (Mixamo's "Remy") ----
BASE = {
    "file": "Remy.fbx",
    "body": "Body",
    "shirt": "Tops",
    "shorts": "Bottoms",
    "boots": "Shoes",
    "hair": "Hair",
    "eyes": "Eyes",
    "lashes": "Eyelashes",
}
BONE = "mixamorig:"

# ---- legs ----
# The base model has no legs under its long shorts, so the thighs are
# built here, upward from the top of each shin. Each pair is a height
# and the thigh's radius at that height.
THIGH = [
    (0.535, 0.0635),
    (0.575, 0.0625),
    (0.630, 0.0705),
    (0.668, 0.0740),  # the hem of the shorts
    # Above the hem the thigh is out of sight, so it is drawn well in:
    # when a leg is lifted the cloth at the front stays with the hips,
    # and a full thigh would come through it.
    (0.700, 0.0540),
    (0.745, 0.0380),
]
# Above this height the leg follows the thigh bone alone; below it the
# shin has a say, so the knee bends smoothly.
KNEE_BLEND_TOP = 0.60

# ---- the kit ----
SOCK_TOP = 0.465  # just under the knee
SOCK_THICKNESS = 0.004
SOCK_BAND = 0.034  # the gold band at the top of the sock
SHORTS_HEM = 0.665  # the bottom of the shorts: mid-thigh
SHORTS_KEEP_ABOVE = 0.90  # the shorts keep their shape above this height; below it they are shortened
SHORTS_SLIM = 0.90  # how much narrower the leg of the shorts is than the base model's
SHORTS_CLEAR = 0.019  # the least gap between the thigh and the cloth round it (less, and a lifted knee shows through)
BOOT_SQUASH = 0.84  # the base model wears thick-soled trainers: boots sit lower

# Colours, as the site's own (0 to 1, the way a screen stores them)
WHITE = (0.965, 0.965, 0.955)
GOLD = (0.851, 0.722, 0.353)
BOOT = (0.085, 0.090, 0.105)
HAIR = (0.070, 0.058, 0.050)
# How far the skin's red blotches are drawn toward plain skin, 0 to 1
SKIN_EVEN = 0.55
# How far the skin's fine detail (pores, freckles) is smoothed away, 0 to 1
SKIN_SMOOTH = 0.35

# ---- build ----
# The base model is slight. These make him an athlete: broader across
# the shoulders, fuller in the arms, a stronger neck.
SHAPE = {
    "shoulders": 1.15,  # how much wider across the shoulders (the arms go out with them)
    "from": 1.06,  # no wider below this height...
    "full": 1.32,  # ...and fully wider above this one
    "arms": 1.24,  # how much thicker the arms
    "neck": 1.12,  # how much thicker the neck
    "chest": 1.09,  # how much deeper the chest, at the front...
    "chest_at": 1.33,  # ...which is at this height...
    "chest_reach": 0.16,  # ...and fades out this far above and below it
    "waist": 0.88,  # how much narrower at the waist...
    "waist_at": 1.03,  # ...which is at this height...
    "waist_reach": 0.20,  # ...and fades out this far above and below it
    "calves": 1.16,  # how much thicker the lower leg, most of it at the calf
}

# ---- hair ----
# The short curls: how tall on top and at the sides, where the sides
# start, and how tight and deep the curls are.
CURLS = {
    "top": 0.024,
    "sides": 0.002,
    "fade_from": 1.715,  # the height where the close-cut sides end
    "fade_over": 0.050,  # how far above that the full height is reached
    "edge": 0.016,  # how far in from the hairline the hair reaches its height
    "curl": 52.0,  # tightness of the big curls that shape the outline: bigger is smaller
    "depth": 0.55,  # how deep the dips between them are, as a share of the height
    "refine": 2,  # how many times the cap is divided up before the curls are raised
    "ringlets": 9.0,  # how many times the picture of small curls repeats across the head
}

# ---- pictures ----
SIZE = {"skin": 1024, "shirt": 1024, "shirt_folds": 512, "boots": 512, "hair": 512, "curls": 256}
