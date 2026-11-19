import { Color, Vector3 } from "three";

// ------------------------------------------------------------------
// The look of the stadium right now, as plain numbers that change a
// little every frame: how much daylight there is, how closed the roof
// is, how hard it is raining. AtmosphereDriver.tsx writes these; the
// sky, the lights, the roof, the crowd and the big screen read them.
//
// It is one shared object rather than React state, because it changes
// 60 times a second and nothing needs to re-render when it does.
// ------------------------------------------------------------------

export const atmo = {
  time: 0, // seconds since the world started
  daylight: 0, // 0 night, 1 day
  twilight: 0, // 0 to 1, the warm colour around sunrise and sunset
  overcast: 0, // 0 clear sky, 1 fully grey
  precipitation: 0, // 0 dry, 1 pouring
  snow: 0, // 0 rain, 1 snow
  roof: 1, // 0 open, 1 closed (this one glides as the roof moves)
  floodlights: 1, // 0 off, 1 full
  cheer: 0, // 0 calm crowd, 1 roaring
  // How much outdoor light reaches the pitch: daylight, cut down by
  // clouds and by the roof
  outdoor: 0,

  sunDirection: new Vector3(0.3, 0.8, 0.2).normalize(), // points at the sun
  sunColor: new Color("#fff4e0"),
  skyTop: new Color("#0a1024"),
  skyHorizon: new Color("#1a2344"),
  fogColor: new Color("#0a0f1c"),
  fogDensity: 0.0016,
};

export type Atmo = typeof atmo;

export function smooth(current: number, target: number, rate: number, dt: number): number {
  return current + (target - current) * (1 - Math.exp(-rate * dt));
}
