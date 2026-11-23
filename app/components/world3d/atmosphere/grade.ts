import { ShaderChunk } from "three";

// ------------------------------------------------------------------
// The broadcast look: how the picture is finished, as a television
// match picture is graded.
//
// Light in the scene is worked out in real units, far brighter at a
// lamp than in a shadow, and has to be squeezed into what a screen can
// show. That is tone mapping; this does it as ACES does (the film
// industry's standard curve), then grades the result:
//
//   - a little more contrast, so the shadows are deep and not grey
//   - richer colour (ACES leaves greens and blues dull)
//   - shadows a touch cool, highlights a touch warm, as broadcast
//     cameras are set up for floodlit grass
//
// It costs nothing extra: at "low" and "medium" it is the renderer's
// own last step for every surface (three.js's "custom" tone mapping,
// switched on in AtmosphereDriver.tsx), and at "high" it is the last
// step of the one pass that already exists for the glow (Effects.tsx).
//
// To change the look, change GRADE.
// ------------------------------------------------------------------

export const GRADE = {
  contrast: 0.22, // 0 leaves the curve as it is
  saturation: 1.1, // 1 leaves the colour as it is
  black: 0.012, // how far the darkest tones are pressed to black
  cool: [0.975, 1.0, 1.035], // the shadows' tint
  warm: [1.025, 1.005, 0.965], // the highlights' tint
};

const v3 = (c: number[]) => `vec3( ${c.map((n) => n.toFixed(3)).join(", ")} )`;

// In: light in the scene's own units (linear). Out: linear 0 to 1.
export const gradeShader = /* glsl */ `
  vec3 gradeAcesFit( vec3 v ) {
    vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
    vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
    return a / b;
  }

  vec3 broadcastLook( vec3 color, float exposure ) {
    // ACES, fitted (the same curve three.js uses)
    const mat3 inMat = mat3( vec3( 0.59719, 0.07600, 0.02840 ), vec3( 0.35458, 0.90834, 0.13383 ), vec3( 0.04823, 0.01566, 0.83777 ) );
    const mat3 outMat = mat3( vec3( 1.60475, -0.10208, -0.00327 ), vec3( -0.53108, 1.10813, -0.07276 ), vec3( -0.07367, -0.00605, 1.07602 ) );
    color *= exposure / 0.6;
    color = clamp( outMat * gradeAcesFit( inMat * color ), 0.0, 1.0 );

    // the grade, done on tones as the eye sees them
    vec3 p = pow( color, vec3( 1.0 / 2.2 ) );
    p = mix( p, p * p * ( 3.0 - 2.0 * p ), ${GRADE.contrast.toFixed(3)} );
    float luma = dot( p, vec3( 0.2126, 0.7152, 0.0722 ) );
    p = mix( vec3( luma ), p, ${GRADE.saturation.toFixed(3)} );
    p *= mix( ${v3(GRADE.cool)}, ${v3(GRADE.warm)}, smoothstep( 0.15, 0.85, luma ) );
    p = max( p - ${GRADE.black.toFixed(3)}, 0.0 ) / ${(1 - GRADE.black).toFixed(3)};
    return pow( clamp( p, 0.0, 1.0 ), vec3( 2.2 ) );
  }
`;

// three.js's "custom" tone mapping is an empty function to be filled in.
// This fills it, once, before anything is drawn.
const EMPTY = "vec3 CustomToneMapping( vec3 color ) { return color; }";
if (ShaderChunk.tonemapping_pars_fragment.includes(EMPTY)) {
  ShaderChunk.tonemapping_pars_fragment = ShaderChunk.tonemapping_pars_fragment.replace(
    EMPTY,
    `${gradeShader}\nvec3 CustomToneMapping( vec3 color ) { return broadcastLook( color, toneMappingExposure ); }`,
  );
}
