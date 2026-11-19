import type { Quality } from "./store";

// Guesses how much 3D this device can handle, so a phone or an old
// laptop gets a lighter stadium (fewer fans, no shadows, no glow)
// instead of a slideshow. The 3D world also steps down by itself if
// it measures a low frame rate (see World3D.tsx).

export function isNarrowScreen(): boolean {
  return window.matchMedia("(max-width: 767px), (max-height: 520px) and (pointer: coarse)").matches;
}

export function isPhone(): boolean {
  return window.matchMedia("(pointer: coarse)").matches && Math.min(window.screen.width, window.screen.height) < 820;
}

export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!canvas.getContext("webgl2");
  } catch {
    return false;
  }
}

export function detectQuality(): Quality {
  const override = new URLSearchParams(window.location.search).get("quality");
  if (override === "low" || override === "medium" || override === "high") return override;

  if (isPhone()) return "low";

  let renderer = "";
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    const info = gl?.getExtension("WEBGL_debug_renderer_info");
    if (gl && info) renderer = String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL));
  } catch {
    // Some browsers hide this; fall through to the general guess
  }

  if (/swiftshader|llvmpipe|software|basic render/i.test(renderer)) return "low";

  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const strongGpu = /(rtx|gtx|radeon rx|radeon pro|geforce|apple m\d|apple gpu|arc\b)/i.test(renderer);

  if (strongGpu && cores >= 8 && memory >= 8) return "high";
  if (cores <= 4 || memory <= 4) return "low";
  return "medium";
}
