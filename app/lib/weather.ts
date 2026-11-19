// The weather in Brampton, as the site understands it. The numbers
// come from Open-Meteo through app/api/weather/route.ts.

export type Sky = "clear" | "cloudy" | "overcast" | "fog" | "drizzle" | "rain" | "snow" | "storm";

export type Weather = {
  temperature: number; // °C
  feelsLike: number;
  code: number; // WMO weather code
  sky: Sky;
  label: string; // "Light snow"
  isDay: boolean;
  cloudCover: number; // 0 to 100
  windSpeed: number; // km/h
  precipitation: number; // mm in the last hour
  sunrise: string | null; // ISO, Brampton local time
  sunset: string | null;
  fetchedAt: string; // ISO
};

type CodeInfo = { sky: Sky; label: string };

// WMO weather interpretation codes, as Open-Meteo reports them
const CODES: Record<number, CodeInfo> = {
  0: { sky: "clear", label: "Clear" },
  1: { sky: "clear", label: "Mostly clear" },
  2: { sky: "cloudy", label: "Partly cloudy" },
  3: { sky: "overcast", label: "Overcast" },
  45: { sky: "fog", label: "Fog" },
  48: { sky: "fog", label: "Freezing fog" },
  51: { sky: "drizzle", label: "Light drizzle" },
  53: { sky: "drizzle", label: "Drizzle" },
  55: { sky: "drizzle", label: "Heavy drizzle" },
  56: { sky: "drizzle", label: "Freezing drizzle" },
  57: { sky: "drizzle", label: "Freezing drizzle" },
  61: { sky: "rain", label: "Light rain" },
  63: { sky: "rain", label: "Rain" },
  65: { sky: "rain", label: "Heavy rain" },
  66: { sky: "rain", label: "Freezing rain" },
  67: { sky: "rain", label: "Freezing rain" },
  71: { sky: "snow", label: "Light snow" },
  73: { sky: "snow", label: "Snow" },
  75: { sky: "snow", label: "Heavy snow" },
  77: { sky: "snow", label: "Snow grains" },
  80: { sky: "rain", label: "Light showers" },
  81: { sky: "rain", label: "Showers" },
  82: { sky: "rain", label: "Heavy showers" },
  85: { sky: "snow", label: "Snow showers" },
  86: { sky: "snow", label: "Heavy snow showers" },
  95: { sky: "storm", label: "Thunderstorm" },
  96: { sky: "storm", label: "Thunderstorm with hail" },
  99: { sky: "storm", label: "Thunderstorm with hail" },
};

export function describeCode(code: number): CodeInfo {
  return CODES[code] ?? { sky: "cloudy", label: "Cloudy" };
}

// Is something falling from the sky?
export function isWet(sky: Sky): boolean {
  return sky === "drizzle" || sky === "rain" || sky === "snow" || sky === "storm";
}

// How much of the sky is covered, 0 to 1, for dimming the sun
export function overcastAmount(weather: Weather | null): number {
  if (!weather) return 0;
  const fromClouds = weather.cloudCover / 100;
  const fromSky = weather.sky === "clear" ? 0 : weather.sky === "cloudy" ? 0.35 : 0.85;
  return Math.min(1, Math.max(fromClouds * 0.9, fromSky));
}

// How hard it is raining or snowing, 0 to 1
export function precipitationAmount(weather: Weather | null): number {
  if (!weather || !isWet(weather.sky)) return 0;
  if (weather.sky === "drizzle") return 0.3;
  if (weather.sky === "storm") return 1;
  const heavy = [65, 67, 75, 82, 86].includes(weather.code);
  const light = [61, 71, 80, 85, 77].includes(weather.code);
  return heavy ? 1 : light ? 0.45 : 0.7;
}
