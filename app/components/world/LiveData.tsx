"use client";

import { useEffect } from "react";
import { now as nowData } from "../../data/portfolio";
import type { Contributions } from "../../lib/github";
import { useWorld } from "../../lib/store";
import { sunPosition } from "../../lib/sun";
import { currentInstant } from "../../lib/time";
import { describeCode, isWet, type Sky, type Weather } from "../../lib/weather";

// Keeps the site's live data fresh, on every page:
//   - Brampton's weather, every ten minutes
//   - my GitHub contributions, once
//   - the roof: in "auto" it shuts at night and in rain or snow, and
//     whatever the roof does, the colour theme follows
// It draws nothing.

const HOME = nowData.homeCity;

// Stand-in weather for the ?weather=snow test switch
const TEST_CODES: Partial<Record<Sky, number>> = { clear: 0, cloudy: 2, overcast: 3, fog: 45, drizzle: 53, rain: 63, snow: 73, storm: 95 };

function testWeather(kind: string): Weather | null {
  const code = TEST_CODES[kind as Sky];
  if (code === undefined) return null;
  const { sky, label } = describeCode(code);
  return {
    temperature: sky === "snow" ? -4 : 14,
    feelsLike: sky === "snow" ? -9 : 13,
    code,
    sky,
    label,
    isDay: true,
    cloudCover: sky === "clear" ? 5 : sky === "cloudy" ? 45 : 95,
    windSpeed: 12,
    precipitation: isWet(sky) ? 1.2 : 0,
    sunrise: null,
    sunset: null,
    fetchedAt: new Date().toISOString(),
  };
}

export default function LiveData() {
  const roofMode = useWorld((s) => s.roofMode);
  const weather = useWorld((s) => s.weather);
  const timeOverride = useWorld((s) => s.timeOverride);
  const weatherOverride = useWorld((s) => s.weatherOverride);

  // Weather
  useEffect(() => {
    if (weatherOverride) {
      useWorld.getState().setWeather(testWeather(weatherOverride));
      return;
    }
    let alive = true;
    const load = () => {
      fetch("/api/weather")
        .then((r) => (r.ok ? r.json() : null))
        .then((data: Weather | null) => {
          if (alive && data) useWorld.getState().setWeather(data);
        })
        .catch(() => {
          // No weather: the stadium assumes a clear sky
        });
    };
    load();
    const id = window.setInterval(load, 10 * 60_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [weatherOverride]);

  // GitHub contributions
  useEffect(() => {
    let alive = true;
    fetch("/api/contributions")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: Contributions | null) => {
        if (alive && data && data.levels?.length) useWorld.getState().setContributions(data);
      })
      .catch(() => {
        // The card display keeps its quiet placeholder pattern
      });
    return () => {
      alive = false;
    };
  }, []);

  // The roof, and with it the colour theme
  useEffect(() => {
    const resolve = () => {
      let closed: boolean;
      if (roofMode === "closed") closed = true;
      else if (roofMode === "open") closed = false;
      else {
        const sun = sunPosition(currentInstant(timeOverride, HOME.timeZone), HOME.latitude, HOME.longitude);
        const night = sun.elevation < -1;
        const wet = weather ? isWet(weather.sky) : false;
        closed = night || wet;
      }
      useWorld.getState().setRoofClosed(closed);
      document.documentElement.dataset.theme = closed ? "dark" : "light";
    };
    resolve();
    const id = window.setInterval(resolve, 60_000);
    return () => window.clearInterval(id);
  }, [roofMode, weather, timeOverride]);

  return null;
}
