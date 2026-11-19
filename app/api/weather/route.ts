import { cacheLife } from "next/cache";
import { now } from "../../data/portfolio";
import { describeCode, type Weather } from "../../lib/weather";

// The current weather in Brampton, from Open-Meteo (free, no key).
// The answer is kept for ten minutes, so however many people visit,
// Open-Meteo is asked at most a few times an hour.

type OpenMeteo = {
  current?: {
    temperature_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    weather_code: number;
    cloud_cover: number;
    wind_speed_10m: number;
  };
  daily?: { sunrise?: string[]; sunset?: string[] };
};

async function loadWeather(): Promise<Weather | null> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 600, expire: 3600 });

  const { latitude, longitude, timeZone } = now.homeCity;
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${latitude}&longitude=${longitude}` +
    "&current=temperature_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m" +
    "&daily=sunrise,sunset&forecast_days=1" +
    `&timezone=${encodeURIComponent(timeZone)}`;

  const response = await fetch(url);
  if (!response.ok) return null;
  const data = (await response.json()) as OpenMeteo;
  const current = data.current;
  if (!current) return null;

  const { sky, label } = describeCode(current.weather_code);
  return {
    temperature: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    code: current.weather_code,
    sky,
    label,
    isDay: current.is_day === 1,
    cloudCover: current.cloud_cover,
    windSpeed: current.wind_speed_10m,
    precipitation: current.precipitation,
    sunrise: data.daily?.sunrise?.[0] ?? null,
    sunset: data.daily?.sunset?.[0] ?? null,
    fetchedAt: new Date().toISOString(),
  };
}

export async function GET() {
  try {
    return Response.json(await loadWeather());
  } catch {
    // No weather is fine: the stadium just assumes a clear sky
    return Response.json(null);
  }
}
