"""Small helpers for working on the model's pictures (its textures) as
grids of numbers. A picture is height x width x 4 (red, green, blue,
alpha), each 0 to 1, with the bottom row first, as Blender keeps them."""

import os

import bpy
import numpy as np


def read(image):
    width, height = image.size
    flat = np.empty(width * height * 4, dtype=np.float32)
    image.pixels.foreach_get(flat)
    return flat.reshape(height, width, 4)


def make(name, grid, folder, colour=True):
    """Turn a grid back into a picture, saved beside the Blender file so
    the export can pick it up."""
    height, width = grid.shape[:2]
    image = bpy.data.images.new(name, width, height, alpha=True)
    if not colour:
        image.colorspace_settings.name = "Non-Color"
    image.pixels.foreach_set(np.clip(grid, 0.0, 1.0).astype(np.float32).ravel())
    os.makedirs(folder, exist_ok=True)
    image.filepath_raw = os.path.join(folder, f"{name}.png")
    image.file_format = "PNG"
    image.save()
    return image


def shrink(grid, size):
    """Halve (or quarter) a picture by averaging blocks of dots."""
    height, width = grid.shape[:2]
    step = height // size
    if step <= 1:
        return grid
    return grid.reshape(size, step, size, step, grid.shape[2]).mean(axis=(1, 3))


def brightness(grid):
    return grid[..., 0] * 0.2126 + grid[..., 1] * 0.7152 + grid[..., 2] * 0.0722


def ramp(value, low, high):
    """0 below `low`, 1 above `high`, a smooth slope between."""
    t = np.clip((value - low) / (high - low), 0.0, 1.0)
    return t * t * (3.0 - 2.0 * t)


def blur(grid, reach):
    """A soft blur: the average of a square of dots, done twice."""
    out = grid.astype(np.float32)
    window = 2 * reach + 1
    for _ in range(2):
        for axis in (0, 1):
            pad = [(0, 0)] * out.ndim
            pad[axis] = (reach, reach)
            total = np.cumsum(np.pad(out, pad, mode="edge"), axis=axis, dtype=np.float64)
            lead = [(0, 0)] * out.ndim
            lead[axis] = (1, 0)
            total = np.pad(total, lead)  # a zero in front, so a window is one subtraction
            count = out.shape[axis]
            upper = np.take(total, np.arange(window, window + count), axis=axis)
            lower = np.take(total, np.arange(0, count), axis=axis)
            out = ((upper - lower) / window).astype(np.float32)
    return out
