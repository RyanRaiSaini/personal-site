"use client";

import { useEffect, useState } from "react";
import { now as nowData } from "../../data/portfolio";
import { useWorld, type RoofMode } from "../../lib/store";
import { clockText, currentInstant, dateText } from "../../lib/time";
import { Block } from "./parts";

// Now: the big screen. Live time and weather from Brampton, the time
// in Madrid, the roof controls, and what I'm doing at the moment
// (`now` in app/data/portfolio.ts).

const ROOF_CHOICES: { mode: RoofMode; label: string; hint: string }[] = [
  { mode: "auto", label: "Follow Brampton", hint: "Closed at night and in rain or snow" },
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
  const [roofBefore, roofAfter] = nowData.roofNote.split("{state}");

  return (
    <div className="sec">
      <section aria-label="Clocks" className="grid grid-cols-2 gap-2.5">
        {[home, away].map((city) => (
          <div key={city.name} className="card">
            <p className="kicker">{city.name}</p>
            <p className="mt-1 font-display text-[2.75rem] font-semibold leading-none" suppressHydrationWarning>
              {instant ? clockText(instant, city.timeZone) : "--:--"}
            </p>
            <p className="meta mt-1.5" suppressHydrationWarning>
              {instant ? dateText(instant, city.timeZone) : " "}
            </p>
          </div>
        ))}
      </section>

      <Block title={nowData.weatherTitle.replace("{city}", home.name)} id="live-weather">
        {weather ? (
          <div className="card">
            <div className="flex items-end justify-between gap-4">
              <p className="font-display text-[3.25rem] font-bold leading-none">{Math.round(weather.temperature)}°C</p>
              <p className="text-right">
                <span className="block font-display text-2xl font-bold uppercase tracking-wide text-gold">{weather.label}</span>
                <span className="text-[0.9375rem] text-ink-soft">Feels like {Math.round(weather.feelsLike)}°C</span>
              </p>
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-3 text-[0.9375rem]">
              <div>
                <dt className="label">Wind</dt>
                <dd>{Math.round(weather.windSpeed)} km/h</dd>
              </div>
              <div>
                <dt className="label">Sunrise</dt>
                <dd>{sunTime(weather.sunrise)}</dd>
              </div>
              <div>
                <dt className="label">Sunset</dt>
                <dd>{sunTime(weather.sunset)}</dd>
              </div>
            </dl>
            <p className="meta mt-3">{nowData.weatherNote}</p>
          </div>
        ) : (
          <p className="card text-center text-ink-soft" role="status">
            {nowData.weatherLoading}
          </p>
        )}
      </Block>

      <Block title={nowData.roofTitle} id="live-roof">
        <p className="text-ink-soft">
          {roofBefore}
          <span className="font-medium text-ink">{roofClosed ? "closed" : "open"}</span>
          {roofAfter}
        </p>
        <div role="radiogroup" aria-label="Roof" className="grid gap-2 sm:grid-cols-3">
          {ROOF_CHOICES.map((choice) => {
            const checked = roofMode === choice.mode;
            return (
              <button key={choice.mode} type="button" role="radio" aria-checked={checked} onClick={() => setRoof(choice.mode)} className={`rounded-[10px] border px-3.5 py-2.5 text-left transition-colors ${checked ? "border-gold bg-gold/10" : "border-line hover:border-line-strong"}`}>
                <span className="block font-display text-lg font-semibold tracking-wide">{choice.label}</span>
                <span className="meta block !text-[0.8125rem]">{choice.hint}</span>
              </button>
            );
          })}
        </div>
      </Block>

      <Block title={nowData.currentTitle} id="live-now">
        {/* three across where there is room, so this is one row and not three */}
        <dl className="current-grid">
          {[nowData.building, nowData.studying, nowData.seeking].map((item) => (
            <div key={item.label} className="card">
              <dt className="kicker">{item.label}</dt>
              <dd>
                <span className="mt-0.5 block font-display text-[1.375rem] font-bold uppercase leading-tight tracking-wide">{item.value}</span>
                <span className="mt-1 block text-[0.9375rem] leading-normal text-ink-soft">{item.detail}</span>
              </dd>
            </div>
          ))}
        </dl>
      </Block>
    </div>
  );
}
