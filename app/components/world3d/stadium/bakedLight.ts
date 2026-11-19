import { ClampToEdgeWrapping, DataTexture, LinearFilter, NoColorSpace, ShaderChunk, TextureLoader, Vector2, type Material, type MeshStandardMaterial, type Texture } from "three";

// ------------------------------------------------------------------
// Light that was worked out ahead of time.
//
// The stadium does not move and neither does its sun, so the two
// expensive questions were answered once, in Blender
// (blender/stadium/occlusion.py):
//
//   - how much of the sky, and of the sunlit pitch, can this spot see?
//   - does the sun reach it, or is it in the roof's shadow?
//
// The answers travel with the model (four numbers on every corner),
// with the seats (three per seat), and as a small picture of the
// ground (public/stadium/pitch-light.png). The functions here make a
// material use them. The result: soft, correct shade under the roof
// and one clean shadow edge across the stands and pitch, at no cost
// while the page runs.
//
// To change how deep the shade is, change the numbers in `bake`. They
// are also moved by day and night (atmosphere/AtmosphereDriver.tsx).
// ------------------------------------------------------------------

function placeholder(): Texture {
  // until the ground picture arrives: fully open sky, fully in sun
  const texture = new DataTexture(new Uint8Array([255, 255, 0, 255]), 1, 1);
  texture.needsUpdate = true;
  return texture;
}

export const bake = {
  sky: { value: 1.0 }, // light from the open sky
  bounce: { value: 2.0 }, // light bounced up off the pitch
  floor: { value: 0.32 }, // so that nothing is ever fully black
  contact: { value: 0.75 }, // how dark tight corners get, 0 to 1
  sunShade: { value: 1.0 }, // 1 by day (use the roof's worked-out shadow), 0 at night
  sunThrough: { value: 1.0 }, // how much direct light gets past the roof: 1 open, 0 closed
  ground: { value: null as Texture | null },
  groundHalf: { value: new Vector2(62, 42) }, // half the size of the ground the picture covers, in metres
};

export const GROUND_PICTURE = "/stadium/pitch-light.png";

if (typeof window !== "undefined") {
  bake.ground.value = placeholder();
  new TextureLoader().load(GROUND_PICTURE, (texture) => {
    // these are measurements, not colours
    texture.colorSpace = NoColorSpace;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.wrapS = texture.wrapT = ClampToEdgeWrapping;
    texture.generateMipmaps = false;
    bake.ground.value?.dispose();
    bake.ground.value = texture;
  });
  (window as unknown as { __bake: typeof bake }).__bake = bake;
}

type Shader = Parameters<NonNullable<Material["onBeforeCompile"]>>[0];

// Where a material's light numbers come from:
//   corner  the model's own surfaces carry them on every corner
//   seat    each seat carries one set
//   ground  anything on or near the grass reads the ground picture
export type LightSource = "corner" | "seat" | "ground";

const SUN_LINE = "getDirectionalLightInfo( directionalLight, directLight );";

const VERTEX: Record<LightSource, { declare: string; assign: string; at: string }> = {
  corner: { declare: "attribute vec4 color;\nvarying vec4 vBake;", assign: "vBake = color;", at: "#include <begin_vertex>" },
  seat: { declare: "attribute vec3 aBake;\nvarying vec4 vBake;", assign: "vBake = vec4( aBake.x, aBake.y, 1.0, aBake.z );", at: "#include <begin_vertex>" },
  ground: {
    declare: "uniform vec2 uGroundHalf;\nvarying vec2 vGroundUv;",
    assign: `vec4 groundWorld = vec4( transformed, 1.0 );
      #ifdef USE_INSTANCING
        groundWorld = instanceMatrix * groundWorld;
      #endif
      groundWorld = modelMatrix * groundWorld;
      vGroundUv = ( groundWorld.xz + uGroundHalf ) / ( 2.0 * uGroundHalf );`,
    at: "#include <project_vertex>",
  },
};

const FRAGMENT: Record<LightSource, { declare: string; read: string }> = {
  corner: { declare: "varying vec4 vBake;", read: "vec4 bakeData = vBake;" },
  seat: { declare: "varying vec4 vBake;", read: "vec4 bakeData = vBake;" },
  ground: {
    declare: "varying vec2 vGroundUv;\nuniform sampler2D uGroundLight;",
    // the picture holds sky in red and sun in green; the ground sees no pitch below it
    read: "vec4 groundSample = texture2D( uGroundLight, vGroundUv );\nvec4 bakeData = vec4( groundSample.r, 0.0, 1.0, groundSample.g );",
  },
};

function inject(shader: Shader, source: LightSource) {
  shader.uniforms.uBakeSky = bake.sky;
  shader.uniforms.uBakeBounce = bake.bounce;
  shader.uniforms.uBakeFloor = bake.floor;
  shader.uniforms.uBakeContact = bake.contact;
  shader.uniforms.uSunShade = bake.sunShade;
  shader.uniforms.uSunThrough = bake.sunThrough;
  shader.uniforms.uGroundLight = bake.ground;
  shader.uniforms.uGroundHalf = bake.groundHalf;

  const v = VERTEX[source];
  shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>\n${v.declare}`).replace(v.at, `${v.at}\n${v.assign}`);

  const f = FRAGMENT[source];
  // the sun: dimmed where the roof's shadow falls, and by the roof itself as it closes
  const lights = ShaderChunk.lights_fragment_begin.replace(SUN_LINE, `${SUN_LINE}\n\t\tdirectLight.color *= mix( 1.0, bakeData.a, uSunShade ) * uSunThrough;`);
  shader.fragmentShader = shader.fragmentShader
    .replace("#include <common>", `#include <common>\n${f.declare}\nuniform float uBakeSky;\nuniform float uBakeBounce;\nuniform float uBakeFloor;\nuniform float uBakeContact;\nuniform float uSunShade;\nuniform float uSunThrough;`)
    .replace("#include <lights_fragment_begin>", `${f.read}\n${lights}`)
    .replace(
      "#include <aomap_fragment>",
      `#include <aomap_fragment>
      float bakedLight = ( uBakeSky * bakeData.r + uBakeBounce * bakeData.g + uBakeFloor ) * mix( 1.0, bakeData.b, uBakeContact );
      reflectedLight.indirectDiffuse *= bakedLight;
      reflectedLight.indirectSpecular *= mix( 1.0, min( 1.0, bakedLight * 1.6 ), 0.9 );`,
    );
}

// Makes a material use the worked-out light. Safe to call on a material
// that already changes its own shader: both changes are kept.
export function withBakedLight<T extends MeshStandardMaterial>(material: T, source: LightSource = "corner"): T {
  if (material.userData.bakedLight) return material;
  material.userData.bakedLight = source;
  const before = material.onBeforeCompile;
  const beforeKey = material.customProgramCacheKey;
  material.onBeforeCompile = (shader, renderer) => {
    before.call(material, shader, renderer);
    inject(shader, source);
  };
  material.customProgramCacheKey = () => `${beforeKey.call(material)}|baked-${source}`;
  material.needsUpdate = true;
  return material;
}
