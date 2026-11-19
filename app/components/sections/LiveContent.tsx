"use client";

import { useEffect, useState } from "react";
import { now as nowData } from "../../data/portfolio";
import { useWorld, type RoofMode } from "../../lib/store";
import { clockText, currentInstant, dateText } from "../../lib/time";
import { SubHeading } from "./parts";

// Now: the big screen. Live time and weather from Brampton, the time
// in Madrid, the roof controls, and what I'm doing at the moment
// (`now` in app/data/portfolio.ts).

const ROOF_CHOICES: { mode: RoofMode; label: string; hint: string }[] = [
  { mode: "auto", label: "Follow Brampton", hint: "Shut at night and in rain or snow" },
  { mode: "open", label: "Open", hint: "Light theme" },
  { mode: "closed", label: "Closed", hint: "Dark theme" },
];

function sunTime(iso: string | null): string {
  if (!iso) return "--:--";
  return iso.slice(11, 16);
}

export default function LiveContent() {
  const weather = useWorld((s) => s.weather);
  const roofMode = useWorld((s) => s.roofMode);
  const roofClosed = useWorld((s) => s.roofClosed);
  const timeOverride = useWorld((s) => s.timeOverride);
  // Null until the page is running in the browser, so the server and
  // the browser never disagree about the time
  const [instant, setInstant] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setInstant(currentInstant(timeOverride, nowData.homeCity.timeZone));
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [timeOverride]);

  const setRoof = (mode: RoofMode) => {
    useWorld.getState().setRoofMode(mode);
    try {
      localStorage.setItem("roof", mode);
    } catch {
      // Not remembered in private browsing
    }
  };

  const home = nowData.homeCity;
  const away = nowData.awayCity;

  return (
    <div className="space-y-7">
      <section aria-label="Clocks" className="grid grid-cols-2 gap-3">
        {[home, away].map((city) => (
          <div key={city.name} className="rounded-2xl border border-line bg-bg-raised/40 px-4 py-3.5">
            <p className="kicker">{city.name}</p>
            <p className="mt-1 font-mono text-4xl font-semibold tabular-nums leading-none sm:text-5xl" suppressHydrationWarning>
              {instant ? clockText(instant, city.timeZone) : "--:--"}
            </p>
            <p className="mt-1.5 text-xs text-ink-faint" suppressHydrationWarning>
              {instant ? dateText(instant, city.timeZone) : " "}
            </p>
          </div>
        ))}
      </section>

      <section aria-labelledby="live-weather" className="space-y-3">
        <SubHeading id="live-weather">Weather in {home.name}</SubHeading>
        {weather ? (
          <div className="rounded-2xl border border-line bg-bg-raised/40 px-4 py-4">
            <div className="flex items-end justify-between gap-4">
              <p className="font-display text-6xl font-bold leading-none">{Math.round(weather.temperature)}°C</p>
              <p className="text-right">
                <span className="block font-display text-2xl font-bold uppercase tracking-wide text-gold">{weather.label}</span>
                <span className="text-sm text-ink-soft">Feels like {Math.round(weather.feelsLike)}°C</span>
              </p>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-ink-faint">Wind</dt>
                <dd>{Math.round(weather.windSpeed)} km/h</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-ink-faint">Sunrise</dt>
                <dd className="font-mono tabular-nums">{sunTime(weather.sunrise)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-ink-faint">Sunset</dt>
                <dd className="font-mono tabular-nums">{sunTime(weather.sunset)}</dd>
              </div>
            </dl>
            <p className="mt-3 text-xs text-ink-faint">Whatever the sky is doing over Brampton, it is doing over this stadium. Weather data from Open-Meteo.</p>
          </div>
        ) : (
          <p className="rounded-2xl border border-line bg-bg-raised/40 px-4 py-6 text-center text-sm text-ink-soft" role="status">
            Checking the sky over Brampton…
          </p>
        )}
      </section>

      <section aria-labelledby="live-roof" className="space-y-3">
        <SubHeading id="live-roof">The roof</SubHeading>
        <p className="text-sm text-ink-soft">
          The roof is this site&apos;s light and dark switch. It is <span className="font-medium text-ink">{roofClosed ? "closed" : "open"}</span> right now.
        </p>
        <div role="radiogroup" aria-label="Roof" className="grid gap-2 sm:grid-cols-3">
          {ROOF_CHOICES.map((choice) => {
            const checked = roofMode === choice.mode;
            return (
              <button key={choice.mode} type="button" role="radio" aria-checked={checked} onClick={() => setRoof(choice.mode)} className={`rounded-xl border px-3.5 py-2.5 text-left transition-colors ${checked ? "border-gold bg-gold/10" : "border-line hover:border-line-strong"}`}>
                <span className="block font-display text-lg font-semibold uppercase tracking-wide">{choice.label}</span>
                <span className="block text-xs text-ink-faint">{choice.hint}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="live-now" className="space-y-3">
        <SubHeading id="live-now">Right now</SubHeading>
        <dl className="space-y-2.5">
          {[nowData.building, nowData.studying, nowData.seeking].map((item) => (
            <div key={item.label} className="rounded-2xl border border-line bg-bg-raised/40 px-4 py-3">
              <dt className="kicker">{item.label}</dt>
              <dd>
                <span className="block font-display text-2xl font-bold uppercase leading-tight tracking-wide">{item.value}</span>
                <span className="text-sm text-ink-soft">{item.detail}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
