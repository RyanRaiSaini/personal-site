"use client";

import { useEffect, useMemo } from "react";
import { stir } from "../activity";
import { Color, MeshStandardMaterial, NoColorSpace, RepeatWrapping, SRGBColorSpace, TextureLoader, type Texture } from "three";

// ------------------------------------------------------------------
// Real materials for the rooms: photographed surfaces from Poly Haven
// (CC0; fetched by `npm run stadium:assets`, listed in
// docs/redesign/ASSETS.md). Each has up to three pictures:
//
//   diff  its colour
//   nor   its surface bumps (wood grain, leather pores, plaster)
//   arm   how shaded its crevices are, how rough and how metallic it is
//
// Surfaces without a colour picture take a colour in code (`tint`), so
// one plaster serves every wall.
//
//   const walnut = useSurface("walnut", { repeat: [2, 1] });
//   <mesh material={walnut}>...
// ------------------------------------------------------------------

const SURFACES = {
  walnut: { file: "american_walnut_veneer", colour: true },
  leather: { file: "leather_white", colour: true },
  marble: { file: "marble_01", colour: true },
  rubber: { file: "rubber_tiles", colour: true },
  concrete: { file: "smooth_concrete_floor", colour: true },
  laminate: { file: "laminate_floor_02", colour: true },
  plaster: { file: "painted_plaster_wall", colour: false },
  fabric: { file: "fabric_pattern_07", colour: false },
  metal: { file: "metal_plate", colour: false },
} as const;

export type SurfaceName = keyof typeof SURFACES;

export type SurfaceOptions = {
  repeat?: [number, number]; // how many times the picture repeats across the surface
  tint?: string; // multiplies the colour (the whole colour, for surfaces without one)
  roughness?: number; // scales the picture's roughness
  metalness?: number; // scales the picture's metalness (0 for none)
  bumps?: number; // how deep the surface bumps look
  emissive?: string;
  emissiveIntensity?: number;
  // keep the picture's light and dark but not its colour, so `tint`
  // decides it (the concrete photo is a brown polished floor)
  grey?: boolean;
};

// one loaded picture per file, shared; each material takes its own copy
// so it can repeat it differently (the copies share the image). A copy
// made before the picture arrives must be told when it does, or it is
// never sent to the graphics card.
const loaded = new Map<string, { base: Texture; ready: boolean; waiting: Set<Texture> }>();
function picture(file: string, colour: boolean): Texture {
  let entry = loaded.get(file);
  if (!entry) {
    const waiting = new Set<Texture>();
    const base = new TextureLoader().load(`/stadium/textures/${file}.webp`, () => {
      const it = loaded.get(file);
      if (it) it.ready = true;
      for (const copy of waiting) copy.needsUpdate = true;
      waiting.clear();
      stir();
    });
    base.colorSpace = colour ? SRGBColorSpace : NoColorSpace;
    base.wrapS = base.wrapT = RepeatWrapping;
    base.anisotropy = 8;
    entry = { base, ready: false, waiting };
    loaded.set(file, entry);
  }
  const copy = entry.base.clone();
  if (entry.ready) copy.needsUpdate = true;
  else entry.waiting.add(copy);
  return copy;
}

export function surfaceMaterial(name: SurfaceName, options: SurfaceOptions = {}): MeshStandardMaterial {
  const { file, colour } = SURFACES[name];
  const [u, v] = options.repeat ?? [1, 1];
  const maps: Texture[] = [];
  const take = (map: string, isColour: boolean) => {
    const texture = picture(`${file}_${map}`, isColour);
    texture.repeat.set(u, v);
    maps.push(texture);
    return texture;
  };
  const arm = take("arm", false);
  const material = new MeshStandardMaterial({
    color: new Color(options.tint ?? "#ffffff"),
    map: colour ? take("diff", true) : null,
    normalMap: take("nor", false),
    roughnessMap: arm,
    metalnessMap: arm,
    aoMap: arm,
    roughness: options.roughness ?? 1,
    metalness: options.metalness ?? (name === "metal" ? 1 : 0),
    emissive: new Color(options.emissive ?? "#000000"),
    emissiveIntensity: options.emissiveIntensity ?? 1,
  });
  material.normalScale.setScalar(options.bumps ?? 1);
  if (options.grey && material.map) {
    material.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        `#include <map_fragment>
        diffuseColor.rgb = diffuse * vec3( dot( texture2D( map, vMapUv ).rgb, vec3( 0.3, 0.59, 0.11 ) ) * 1.6 );`,
      );
    };
    material.customProgramCacheKey = () => "surface-grey";
  }
  material.aoMapIntensity = 0.8;
  material.name = `surface:${name}`;
  material.userData.maps = maps;
  return material;
}

export function disposeSurface(material: MeshStandardMaterial) {
  for (const texture of (material.userData.maps ?? []) as Texture[]) texture.dispose();
  material.dispose();
}

// The same, for a component: made once, put away when the room goes
export function useSurface(name: SurfaceName, options: SurfaceOptions = {}): MeshStandardMaterial {
  const key = JSON.stringify([name, options]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const material = useMemo(() => surfaceMaterial(name, options), [key]);
  useEffect(() => () => disposeSurface(material), [material]);
  return material;
}
