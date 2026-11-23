import { BoxGeometry, BufferGeometry, CylinderGeometry, Float32BufferAttribute, MeshStandardMaterial, SphereGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { withBakedLight } from "./bakedLight";

// ------------------------------------------------------------------
// The fan who sits in a seat near the camera: a simple figure in the
// round, used in place of the flat cut-out wherever the camera comes
// close to the stands (Crowd.tsx decides where).
//
// He is built in the seat's own frame: +Z toward the pitch, up is +Y,
// the seat's step at y = 0 and the seat back just behind z = 0. Each
// part is marked with what it is, so one material can colour them all
// and the shader can turn or hide parts per fan:
//
//   - his shirt colour, skin tone and hair colour are his own
//   - some wear a beanie, some a scarf in the club's colours
//   - each sits turned a little in his seat, his head turned his own way
//   - a few have the right arm up
//
// About 250 triangles, so a few thousand of them cost little.
// ------------------------------------------------------------------

// What each part is
const SHIRT = 0;
const SKIN = 1; // neck and left hand
const HAIR = 2;
const TROUSERS = 3;
const RIGHT_ARM = 4; // the arm that may be raised: shirt sleeve
const RIGHT_HAND = 5;
const HAT = 6;
const SCARF = 7;
const HEAD = 8; // skin, but turns with the head

function part(geometry: BufferGeometry, kind: number, x: number, y: number, z: number, options: { tiltX?: number; scale?: [number, number, number] } = {}): BufferGeometry {
  const shaped = geometry.index ? geometry.toNonIndexed() : geometry;
  if (options.scale) shaped.scale(...options.scale);
  if (options.tiltX) shaped.rotateX(options.tiltX);
  shaped.translate(x, y, z);
  const count = shaped.getAttribute("position").count;
  shaped.setAttribute("aPart", new Float32BufferAttribute(new Float32Array(count).fill(kind), 1));
  shaped.deleteAttribute("uv");
  return shaped;
}

export function fanGeometry(): BufferGeometry {
  const pieces = [
    // the torso: an oval, wider at the shoulders, leaning back a little
    part(new CylinderGeometry(0.215, 0.18, 0.56, 9), SHIRT, 0, 0.76, 0.09, { scale: [1, 1, 0.6], tiltX: -0.08 }),
    // the neck, and the head a little taller than wide
    part(new CylinderGeometry(0.045, 0.05, 0.09, 6), SKIN, 0, 1.08, 0.1),
    part(new SphereGeometry(0.1, 8, 6), HEAD, 0, 1.19, 0.1, { scale: [1, 1.14, 1.05] }),
    // hair over the top and back of the head
    part(new SphereGeometry(0.106, 8, 3, 0, Math.PI * 2, 0, Math.PI * 0.55), HAIR, 0, 1.205, 0.088, { scale: [1, 1.12, 1.08] }),
    // a beanie, worn by some
    part(new SphereGeometry(0.112, 8, 3, 0, Math.PI * 2, 0, Math.PI * 0.5), HAT, 0, 1.225, 0.095, { scale: [1, 1.2, 1.05] }),
    // a scarf round the neck, its ends down the front, worn by some
    part(new CylinderGeometry(0.085, 0.09, 0.07, 8, 1, true), SCARF, 0, 1.03, 0.1, { scale: [1, 1, 0.9] }),
    part(new BoxGeometry(0.07, 0.32, 0.02), SCARF, 0.04, 0.85, 0.21, { tiltX: -0.1 }),
    // thighs along the seat, shins down to the step
    part(new BoxGeometry(0.38, 0.15, 0.44), TROUSERS, 0, 0.5, 0.3),
    part(new BoxGeometry(0.34, 0.46, 0.13), TROUSERS, 0, 0.25, 0.5),
    // the left arm hangs, hand on the knee
    part(new CylinderGeometry(0.05, 0.045, 0.46, 6), SHIRT, 0.24, 0.74, 0.13, { tiltX: -0.28 }),
    part(new BoxGeometry(0.075, 0.08, 0.1), SKIN, 0.24, 0.51, 0.22),
    // the right arm, which a few fans raise (see the shader)
    part(new CylinderGeometry(0.05, 0.045, 0.46, 6), RIGHT_ARM, -0.24, 0.74, 0.13, { tiltX: -0.28 }),
    part(new BoxGeometry(0.075, 0.08, 0.1), RIGHT_HAND, -0.24, 0.51, 0.22),
  ];
  const merged = mergeGeometries(pieces, false);
  pieces.forEach((piece) => piece.dispose());
  return merged;
}

export type CrowdUniforms = { uJump: { value: number }; uTime: { value: number } };

// One material for every close fan. Per fan: `aShirt`, `aFan` (pose,
// skin tone, timing) and `aLook` (hair colour, beanie, scarf, how far
// he sits turned).
export function fanMaterial(uniforms: CrowdUniforms): MeshStandardMaterial {
  const material = new MeshStandardMaterial({ roughness: 0.82 });
  material.name = "CrowdNear";
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uJump = uniforms.uJump;
    shader.uniforms.uTime = uniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        attribute float aPart;
        attribute vec3 aShirt;
        attribute vec3 aFan;
        attribute vec4 aLook;
        uniform float uJump;
        uniform float uTime;
        varying vec3 vBody;
        mat2 turnBy( float a ) { return mat2( cos( a ), sin( a ), -sin( a ), cos( a ) ); }`,
      )
      .replace(
        "#include <beginnormal_vertex>",
        `#include <beginnormal_vertex>
        // a fan in pose 1 has his right arm up: the arm and hand swing up and out about the shoulder
        float raised = ( aFan.x > 0.5 && aFan.x < 1.5 && aPart > 3.5 && aPart < 5.5 ) ? 1.0 : 0.0;
        mat2 turnArm = turnBy( -2.75 * raised );
        objectNormal.xy = turnArm * objectNormal.xy;
        // the head (and what is on it) turns his own way
        float onHead = ( aPart > 7.5 || ( aPart > 1.5 && aPart < 2.5 ) || ( aPart > 5.5 && aPart < 6.5 ) ) ? 1.0 : 0.0;
        mat2 turnHead = turnBy( onHead * ( fract( aFan.z * 7.13 ) - 0.5 ) * 0.9 );
        objectNormal.xz = turnHead * objectNormal.xz;
        // and he sits a little turned in his seat
        mat2 turnBody = turnBy( aLook.w );
        objectNormal.xz = turnBody * objectNormal.xz;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vec2 shoulder = vec2( -0.24, 0.96 );
        transformed.xy = shoulder + turnArm * ( transformed.xy - shoulder );
        vec2 neck = vec2( 0.0, 0.1 );
        transformed.xz = neck + turnHead * ( transformed.xz - neck );
        transformed.xz = turnBody * transformed.xz;
        // a beanie or a scarf only for those who wear one
        float hidden = ( ( aPart > 5.5 && aPart < 6.5 && aLook.y < 0.5 ) || ( aPart > 6.5 && aPart < 7.5 && aLook.z < 0.5 ) ) ? 1.0 : 0.0;
        transformed = mix( transformed, vec3( 0.0, 0.8, 0.05 ), hidden );
        // up and down out of the seat on a goal, each fan in his own time
        transformed.y += uJump * 0.32 * max( 0.0, sin( uTime * 8.5 + aFan.z * 6.2832 ) );

        vec3 skin = mix( vec3( 0.80, 0.55, 0.42 ), vec3( 0.10, 0.05, 0.03 ), aFan.y );
        // black, dark brown, mid brown, fair, grey
        float h = aLook.x;
        vec3 hair = h < 0.45 ? vec3( 0.018, 0.015, 0.013 ) : h < 0.72 ? vec3( 0.06, 0.035, 0.02 ) : h < 0.85 ? vec3( 0.16, 0.09, 0.045 ) : h < 0.94 ? vec3( 0.48, 0.34, 0.16 ) : vec3( 0.35, 0.34, 0.33 );
        // club colours for beanies and scarves: navy, gold, white, royal
        float c = fract( aLook.x * 17.31 );
        vec3 club = c < 0.3 ? vec3( 0.012, 0.025, 0.08 ) : c < 0.55 ? vec3( 0.68, 0.45, 0.1 ) : c < 0.8 ? vec3( 0.88, 0.88, 0.86 ) : vec3( 0.03, 0.08, 0.38 );
        vBody = ( aPart < 0.5 || ( aPart > 3.5 && aPart < 4.5 ) ) ? aShirt
          : ( aPart < 1.5 || ( aPart > 4.5 && aPart < 5.5 ) || aPart > 7.5 ) ? skin
          : aPart < 2.5 ? hair
          : aPart < 3.5 ? vec3( 0.04, 0.045, 0.06 )
          : club;`,
      );
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vBody;").replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb *= vBody;");
  };
  material.customProgramCacheKey = () => "crowd-near-v2";
  return withBakedLight(material, "seat");
}
