"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useRef } from "react";
import { Color, FogExp2 } from "three";
import { now as nowData } from "../../../data/portfolio";
import { useWorld } from "../../../lib/store";
import { daylight, sunPosition, twilight } from "../../../lib/sun";
import { currentInstant } from "../../../lib/time";
import { overcastAmount, precipitationAmount } from "../../../lib/weather";
import { sceneOf } from "../spots";
import { SUN_DIRECTION, tune } from "./daylight";
import { atmo, smooth } from "./state";

// Works out the stadium's look once per frame and writes it into the
// shared `atmo` object (state.ts): whether it is day or night in
// Brampton, the weather, how far the roof has closed and how loud the
// crowd is.
//
// The clock decides only whether it is day or night. The daylight
// itself is always the same clear afternoon (daylight.ts), so the
// stadium is seen in one considered light rather than whatever angle
// the real sun happens to be at.

const HOME = nowData.homeCity;

// Sky colours for each condition
const NIGHT_TOP = new Color("#050916");
const NIGHT_HORIZON = new Color("#111a33");
const DAY_TOP = new Color("#2c6fd6");
const DAY_HORIZON = new Color("#b4d4f5");
const GREY_TOP = new Color("#7f8b9c");
const GREY_HORIZON = new Color("#b9c1cb");
const DUSK_TOP = new Color("#39407e");
const DUSK_HORIZON = new Color("#ff9456");
const SUN_WARM = new Color("#ffb37a");
const SUN_WHITE = new Color("#fff3df");
const MOON = new Color("#9db8ff");
const FOG_NIGHT = new Color("#080d1a");
const FOG_DAY = new Color("#c3d6ea");

// How long the roof takes to open or close, in seconds
export const ROOF_SECONDS = 6;

const scratchTop = new Color();
const scratchHorizon = new Color();

export default function AtmosphereDriver() {
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const sun = useRef({ elevation: -30, azimuth: 180, checkedAt: -10 });
  const first = useRef(true);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    const state = useWorld.getState();
    atmo.time += dt;

    // The sun moves slowly, so its position is refreshed once a second
    if (atmo.time - sun.current.checkedAt > 1) {
      const position = sunPosition(currentInstant(state.timeOverride, HOME.timeZone), HOME.latitude, HOME.longitude);
      sun.current = { ...position, checkedAt: atmo.time };
    }
    const { elevation } = sun.current;

    // On the very first frame jump straight to the right look
    const rate = first.current ? 1000 : 1.2;
    atmo.daylight = smooth(atmo.daylight, daylight(elevation), rate, dt);
    atmo.twilight = smooth(atmo.twilight, twilight(elevation), rate, dt);
    atmo.overcast = smooth(atmo.overcast, overcastAmount(state.weather), rate, dt);
    atmo.precipitation = smooth(atmo.precipitation, precipitationAmount(state.weather), rate, dt);
    atmo.snow = smooth(atmo.snow, state.weather?.sky === "snow" ? 1 : 0, rate, dt);

    // The roof moves at a steady speed, like the real one
    const roofTarget = state.roofClosed ? 1 : 0;
    if (first.current) atmo.roof = roofTarget;
    else if (atmo.roof !== roofTarget) {
      const step = dt / ROOF_SECONDS;
      atmo.roof = roofTarget > atmo.roof ? Math.min(roofTarget, atmo.roof + step) : Math.max(roofTarget, atmo.roof - step);
    }
    const roofEased = atmo.roof * atmo.roof * (3 - 2 * atmo.roof);

    // Light from outside: daylight, less under cloud, much less under the roof
    atmo.outdoor = atmo.daylight * (1 - 0.5 * atmo.overcast) * (1 - 0.82 * roofEased);
    atmo.floodlights = smooth(atmo.floodlights, Math.min(1, Math.max(0.22, 1.15 - atmo.outdoor * 1.25)), rate, dt);

    // The crowd calms down a few seconds after it last roared
    const sinceCheer = (performance.now() - state.cheerAt) / 1000;
    const cheerTarget = state.cheerAt > 0 && sinceCheer < 6 ? Math.max(0, 1 - sinceCheer / 6) : 0;
    atmo.cheer = smooth(atmo.cheer, cheerTarget, cheerTarget > atmo.cheer ? 8 : 1.5, dt);

    // Where the light comes from: the photographed sky's sun by day,
    // a high moon at night
    if (atmo.daylight > 0.02) {
      atmo.sunDirection.copy(SUN_DIRECTION);
      atmo.sunColor.copy(SUN_WHITE).lerp(SUN_WARM, atmo.twilight * 0.85);
    } else {
      atmo.sunDirection.set(-0.35, 0.8, 0.45).normalize();
      atmo.sunColor.copy(MOON);
    }

    // Sky: night to day, greyed by cloud, warmed at dawn and dusk
    scratchTop.copy(DAY_TOP).lerp(GREY_TOP, atmo.overcast * 0.9);
    scratchHorizon.copy(DAY_HORIZON).lerp(GREY_HORIZON, atmo.overcast * 0.9);
    atmo.skyTop.copy(NIGHT_TOP).lerp(scratchTop, atmo.daylight);
    atmo.skyHorizon.copy(NIGHT_HORIZON).lerp(scratchHorizon, atmo.daylight);
    const dusk = atmo.twilight * (1 - atmo.overcast * 0.7);
    atmo.skyTop.lerp(DUSK_TOP, dusk * 0.6);
    atmo.skyHorizon.lerp(DUSK_HORIZON, dusk * 0.8);

    // Haze: thin and bright by day, a little thicker under floodlights
    atmo.fogColor.copy(FOG_NIGHT).lerp(FOG_DAY, Math.min(1, atmo.outdoor * 1.1));
    atmo.fogDensity = 0.0021 - 0.0011 * Math.min(1, atmo.outdoor * 1.2) + atmo.precipitation * 0.0012;

    if (!(scene.fog instanceof FogExp2)) scene.fog = new FogExp2(atmo.fogColor.getHex(), atmo.fogDensity);
    const fog = scene.fog as FogExp2;
    const inBowl = sceneOf(state.section) === "bowl";
    fog.color.copy(atmo.fogColor);
    // The rooms are small and indoors: no haze in there
    fog.density = inBowl ? atmo.fogDensity : 0;
    // Light from the sky: full by day with the roof open, a fraction of
    // it through the closed roof's white fabric, almost none at night.
    // The rooms have their own soft indoor light.
    const throughRoof = atmo.daylight * (1 - 0.45 * atmo.overcast) * (1 - 0.7 * roofEased);
    scene.environmentIntensity = inBowl ? tune.sky * (0.05 + 1.0 * throughRoof) : 0.85;

    gl.toneMappingExposure = tune.exposure * (1.0 - 0.08 * Math.min(1, atmo.outdoor));
    first.current = false;
  }, -10);

  return null;
}
