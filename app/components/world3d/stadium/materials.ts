import { DoubleSide, MeshBasicMaterial, MeshStandardMaterial, RepeatWrapping, SRGBColorSpace, TextureLoader, type Material, type Texture } from "three";
import { withBakedLight } from "./bakedLight";

// ------------------------------------------------------------------
// The stadium's materials.
//
// The model (public/stadium/stadium.glb, built by blender/build.py)
// arrives with a name on every surface: "Concrete", "Steel", "Glass"
// and so on. This file decides what each name looks like. To change a
// surface's colour or shine, change its line in LOOKS.
//
// The model also carries four numbers on every corner, measured in
// Blender, saying how much light reaches that spot. bakedLight.ts
// makes a material use them.
// ------------------------------------------------------------------

// The photographed surfaces, all from Poly Haven (CC0). `size` is how
// many metres of real surface one copy of the picture covers.
const SURFACES = {
  concrete: { id: "brushed_concrete", size: 2.6, colour: true },
  paint: { id: "painted_concrete_02", size: 3.2, colour: true },
  sheet: { id: "corrugated_iron_02", size: 2.2, colour: false },
} as const;

type Surface = keyof typeof SURFACES;

type Look = {
  color: string;
  roughness?: number;
  metalness?: number;
  // how strongly the surface reflects the sky
  reflect?: number;
  // which photographed surface it is made of, if any
  surface?: Surface;
  // how deep the surface's bumps look (1 is as photographed)
  relief?: number;
};

export const LOOKS: Record<string, Look> = {
  Concrete: { color: "#b9b9b6", roughness: 1, surface: "concrete" },
  Aisle: { color: "#a3a3a0", roughness: 1, surface: "concrete" },
  Riser: { color: "#a9a9a6", roughness: 1, surface: "concrete" },
  WallDark: { color: "#3a3f48", roughness: 1, surface: "paint" },
  Fascia: { color: "#262a31", roughness: 0.9, surface: "paint", relief: 0.6 },
  Soffit: { color: "#454a53", roughness: 1, surface: "paint" },
  Hoarding: { color: "#16254c", roughness: 0.8, surface: "paint", relief: 0.5 },
  BoxGlass: { color: "#0d1118", roughness: 0.2, reflect: 1.1 },
  Ribbon: { color: "#05070a", roughness: 0.3 },
  // The ring of screens when it is switched off: matt black panels
  Screen: { color: "#07090c", roughness: 0.9, reflect: 0.22 },
  ScreenBack: { color: "#15181d", roughness: 0.7 },
  RoofDeck: { color: "#4a4f57", roughness: 1, metalness: 1, surface: "sheet", relief: 0.8 },
  RoofTop: { color: "#b9bec6", roughness: 0.5, metalness: 0.5 },
  RingBeam: { color: "#c3c7cc", roughness: 0.6, metalness: 0.1 },
  Steel: { color: "#dfe2e6", roughness: 0.48, metalness: 0.1 },
  SteelDark: { color: "#2a2d33", roughness: 0.5, metalness: 0.6 },
  FloodHousing: { color: "#15171b", roughness: 0.6, metalness: 0.4 },
};

const loader = typeof window === "undefined" ? null : new TextureLoader();
const loaded = new Map<string, Texture>();

// One picture of a surface. The model measures its surfaces in metres,
// so the picture is told how many metres it covers.
function picture(surface: Surface, map: "diff" | "nor" | "arm"): Texture | null {
  if (!loader) return null;
  const { id, size } = SURFACES[surface];
  const key = id + "_" + map;
  let texture = loaded.get(key);
  if (!texture) {
    texture = loader.load("/stadium/textures/" + key + ".webp");
    texture.wrapS = texture.wrapT = RepeatWrapping;
    texture.repeat.set(1 / size, 1 / size);
    texture.anisotropy = 8;
    if (map === "diff") texture.colorSpace = SRGBColorSpace;
    loaded.set(key, texture);
  }
  return texture;
}

// The seats' plastic. Each seat's own colour is set where the seats
// are placed (Seats.tsx), so this stays white.
export const SEAT_COLOR = "#22398a";

export type StadiumMaterials = Record<string, Material>;

export function makeMaterials(): StadiumMaterials {
  const made: StadiumMaterials = {};
  for (const [name, look] of Object.entries(LOOKS)) {
    const material = new MeshStandardMaterial({ color: look.color, roughness: look.roughness ?? 0.8, metalness: look.metalness ?? 0, envMapIntensity: look.reflect ?? 1 });
    material.name = name;
    if (look.surface) {
      if (SURFACES[look.surface].colour) material.map = picture(look.surface, "diff");
      material.normalMap = picture(look.surface, "nor");
      material.normalScale.setScalar(look.relief ?? 1);
      // one picture holds three things: red = creases, green = roughness, blue = metal
      const arm = picture(look.surface, "arm");
      material.roughnessMap = arm;
      material.metalnessMap = look.metalness ? arm : null;
      material.aoMap = arm;
    }
    made[name] = withBakedLight(material);
  }
  // Doorways into the dark: no light of their own, no reflections
  made.Void = new MeshBasicMaterial({ color: "#030304" });
  // Clear glass guards along the tier fronts and round the entrances
  made.Glass = new MeshStandardMaterial({ color: "#d5e3ee", roughness: 0.08, metalness: 0, transparent: true, opacity: 0.12, side: DoubleSide, depthWrite: false, envMapIntensity: 0.55 });
  // The sliding roof panels: white fabric that glows with the daylight behind it
  made.Membrane = new MeshStandardMaterial({ color: "#eef1f4", roughness: 0.85, metalness: 0, side: DoubleSide, emissive: "#f4f7fb", emissiveIntensity: 0.1 });
  // The floodlights' lamps: brighter than white, so they read as a light source
  made.FloodLens = new MeshBasicMaterial({ color: "#ffffff", toneMapped: false });
  for (const [name, material] of Object.entries(made)) material.name = name;
  return made;
}
