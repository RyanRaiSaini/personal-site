import { BoxGeometry, BufferGeometry, Float32BufferAttribute, MeshStandardMaterial, SphereGeometry } from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { withBakedLight } from "./bakedLight";

// ------------------------------------------------------------------
// The fan who sits in a seat near the camera: a simple figure in the
// round, used in place of the flat cut-out wherever the camera comes
// close to the stands (Crowd.tsx decides where).
//
// He is built in the seat's own frame: +Z toward the pitch, up is +Y,
// the seat's step at y = 0 and the seat back just behind z = 0. Each
// part is marked with what it is, so one material can colour them all:
// the shirt takes the fan's shirt colour, the skin his skin tone. About
// 170 triangles, so a few thousand of them cost little.
// ------------------------------------------------------------------

// What each part is
const SHIRT = 0;
const SKIN = 1;
const HAIR = 2;
const TROUSERS = 3;
const RIGHT_ARM = 4; // the arm that may be raised: shirt sleeve
const RIGHT_HAND = 5;

function part(geometry: BufferGeometry, kind: number, x: number, y: number, z: number, tiltX = 0): BufferGeometry {
  const shaped = geometry.toNonIndexed();
  if (tiltX) shaped.rotateX(tiltX);
  shaped.translate(x, y, z);
  const count = shaped.getAttribute("position").count;
  shaped.setAttribute("aPart", new Float32BufferAttribute(new Float32Array(count).fill(kind), 1));
  shaped.deleteAttribute("uv");
  return shaped;
}

export function fanGeometry(): BufferGeometry {
  const pieces = [
    // the torso, shoulders and all, leaning back a little against the seat
    part(new BoxGeometry(0.44, 0.56, 0.24), SHIRT, 0, 0.76, 0.09, -0.08),
    // neck and head, and hair over the top and back of the head
    part(new BoxGeometry(0.09, 0.08, 0.09), SKIN, 0, 1.05, 0.09),
    part(new SphereGeometry(0.105, 7, 5), SKIN, 0, 1.17, 0.1),
    part(new SphereGeometry(0.11, 7, 2, 0, Math.PI * 2, 0, Math.PI * 0.5), HAIR, 0, 1.19, 0.085),
    // thighs along the seat, shins down to the step
    part(new BoxGeometry(0.38, 0.15, 0.44), TROUSERS, 0, 0.5, 0.3),
    part(new BoxGeometry(0.34, 0.46, 0.13), TROUSERS, 0, 0.25, 0.5),
    // the left arm hangs, hand on the knee
    part(new BoxGeometry(0.1, 0.44, 0.11), SHIRT, 0.25, 0.74, 0.12, -0.25),
    part(new BoxGeometry(0.08, 0.08, 0.1), SKIN, 0.25, 0.52, 0.22),
    // the right arm, which a few fans raise (see the shader)
    part(new BoxGeometry(0.1, 0.44, 0.11), RIGHT_ARM, -0.25, 0.74, 0.12, -0.25),
    part(new BoxGeometry(0.08, 0.08, 0.1), RIGHT_HAND, -0.25, 0.52, 0.22),
  ];
  const merged = mergeGeometries(pieces, false);
  pieces.forEach((piece) => piece.dispose());
  return merged;
}

export type CrowdUniforms = { uJump: { value: number }; uTime: { value: number } };

// One material for every close fan. `aShirt` and `aFan` (pose, skin
// tone, timing) come per fan, as for the cut-outs.
export function fanMaterial(uniforms: CrowdUniforms): MeshStandardMaterial {
  const material = new MeshStandardMaterial({ roughness: 0.8 });
  material.name = "CrowdNear";
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uJump = uniforms.uJump;
    shader.uniforms.uTime = uniforms.uTime;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        "#include <common>\nattribute float aPart;\nattribute vec3 aShirt;\nattribute vec3 aFan;\nuniform float uJump;\nuniform float uTime;\nvarying vec3 vBody;",
      )
      .replace(
        "#include <beginnormal_vertex>",
        `#include <beginnormal_vertex>
        // a fan in pose 1 has his right arm up: the arm and hand swing up
        // and out about the shoulder
        float raised = ( aFan.x > 0.5 && aFan.x < 1.5 && aPart > 3.5 ) ? 1.0 : 0.0;
        float swing = -2.75 * raised;
        mat2 turnArm = mat2( cos( swing ), sin( swing ), -sin( swing ), cos( swing ) );
        objectNormal.xy = turnArm * objectNormal.xy;`,
      )
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        vec2 shoulder = vec2( -0.25, 0.95 );
        transformed.xy = shoulder + turnArm * ( transformed.xy - shoulder );
        // up and down out of the seat on a goal, each fan in his own time
        transformed.y += uJump * 0.32 * max( 0.0, sin( uTime * 8.5 + aFan.z * 6.2832 ) );
        vec3 skin = mix( vec3( 0.80, 0.55, 0.42 ), vec3( 0.10, 0.05, 0.03 ), aFan.y );
        vBody = aPart < 0.5 || ( aPart > 3.5 && aPart < 4.5 ) ? aShirt
          : aPart < 1.5 || aPart > 4.5 ? skin
          : aPart < 2.5 ? vec3( 0.03, 0.025, 0.02 )
          : vec3( 0.05, 0.055, 0.07 );`,
      );
    shader.fragmentShader = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vBody;").replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb *= vBody;");
  };
  material.customProgramCacheKey = () => "crowd-near-v1";
  return withBakedLight(material, "seat");
}
