"""Turns the Poly Haven sky into the small files the website loads.

    blender --background --factory-startup --python blender/sky.py -- \
        --hdr <the downloaded .hdr> --site <the website's public/stadium folder>

The download is a 20 MB picture of a whole sky, far brighter where the
sun is than a screen can show. The site needs three smaller things:

    sky-light.hdr   a 512-pixel copy with the sun's disc taken out. This
                    lights the stadium from every direction, the way a
                    sky does. (The sun itself is a separate lamp in the
                    site, so that it can cast shadows.)
    sky.jpg         the top half of the sky as an ordinary picture, for
                    what you see through the roof opening.
    sky.json        where the sun is in that picture.
"""

import argparse
import json
import math
import os
import sys

import bpy
import numpy as np


def parse_args():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--hdr", required=True)
    parser.add_argument("--site", required=True)
    return parser.parse_args(argv)


def luminance(rgb):
    return 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]


def save_float(name, pixels, path, file_format):
    height, width, _ = pixels.shape
    image = bpy.data.images.new(name, width, height, float_buffer=True, alpha=False)
    rgba = np.concatenate([pixels, np.ones((height, width, 1), dtype=np.float32)], axis=2)
    image.pixels.foreach_set(rgba.ravel())
    image.filepath_raw = path
    image.file_format = file_format
    image.save()
    bpy.data.images.remove(image)


def filmic(x):
    """A gentle camera-like curve: keeps cloud detail instead of clipping it."""
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    return np.clip((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0)


def main():
    args = parse_args()
    # Blender reads a relative path as "beside the open file", so pin both down
    args.site = os.path.abspath(args.site)
    args.hdr = os.path.abspath(args.hdr)
    image = bpy.data.images.load(args.hdr)
    width, height = image.size
    flat = np.empty(width * height * 4, dtype=np.float32)
    image.pixels.foreach_get(flat)
    rgb = flat.reshape(height, width, 4)[:, :, :3]  # row 0 is the bottom of the picture
    lum = luminance(rgb)

    # the sun: the middle of the very brightest patch
    peak = float(lum.max())
    ys, xs = np.nonzero(lum > peak * 0.5)
    weights = lum[ys, xs]
    cx = float((xs * weights).sum() / weights.sum())
    cy = float((ys * weights).sum() / weights.sum())
    elevation = ((cy + 0.5) / height - 0.5) * math.pi
    azimuth = ((cx + 0.5) / width - 0.5) * 2 * math.pi
    sun = [math.cos(elevation) * math.cos(azimuth), math.sin(elevation), math.cos(elevation) * math.sin(azimuth)]

    sky_half = lum[height // 2:]
    typical = float(np.median(sky_half))

    # 1. light: no sun disc, small
    cap = typical * 14.0
    scale = np.minimum(1.0, cap / np.maximum(lum, 1e-6))[..., None]
    soft = rgb * scale
    factor = width // 512
    small = soft[: (height // factor) * factor, : (width // factor) * factor].reshape(height // factor, factor, width // factor, factor, 3).mean(axis=(1, 3))
    save_float("sky-light", small.astype(np.float32), os.path.join(args.site, "sky-light.hdr"), "HDR")

    # 2. picture: the top half, as a camera would expose it
    top = rgb[height // 2:]
    exposure = 0.42 / typical
    mapped = filmic(top * exposure)
    srgb = np.where(mapped <= 0.0031308, mapped * 12.92, 1.055 * np.power(mapped, 1 / 2.4) - 0.055).astype(np.float32)
    picture = bpy.data.images.new("sky", width, height // 2, alpha=False)
    picture.colorspace_settings.name = "sRGB"
    rgba = np.concatenate([srgb, np.ones((height // 2, width, 1), dtype=np.float32)], axis=2)
    # an 8-bit image stores what it is given, so hand it display values and mark them as such
    picture.pixels.foreach_set(rgba.ravel())
    picture.filepath_raw = os.path.join(args.site, "sky.jpg")
    picture.file_format = "JPEG"
    picture.save(quality=86)

    info = {
        "source": "kloofendal_48d_partly_cloudy_puresky (Poly Haven, CC0)",
        "sun": [round(v, 5) for v in sun],
        "sunElevationDegrees": round(math.degrees(elevation), 2),
        "sunAzimuthDegrees": round(math.degrees(azimuth), 2),
        "typicalSkyBrightness": round(typical, 4),
        "sunPeakBrightness": round(peak, 1),
    }
    with open(os.path.join(args.site, "sky.json"), "w", encoding="utf-8") as f:
        json.dump(info, f, indent=2)
    print("[sky]", json.dumps(info))
    for name in ("sky-light.hdr", "sky.jpg"):
        print(f"[sky] {name}: {os.path.getsize(os.path.join(args.site, name)) / 1024:.0f} KB")


if __name__ == "__main__":
    main()
