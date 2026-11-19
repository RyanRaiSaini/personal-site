"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { profile } from "../../data/portfolio";
import { useWorld } from "../../lib/store";
import { places, sectionForPath } from "../../sections/registry";
import EggList from "./EggList";
import PlaceIcon from "./PlaceIcon";

// The bar across the top of every page: my name (back to the stadium),
// the list of places, and three switches: the roof (which is the
// light / dark theme), the sound, and 3D tour / flat match view.

function RoofIcon({ closed }: { closed: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* the stands */}
      <path d="M3 18c1.5-2 4.5-3 9-3s7.5 1 9 3" />
      {/* the roof: two halves that meet when closed */}
      <path d={closed ? "M3 10c2-3 5.5-4.5 9-4.5" : "M3 10c1.2-2 2.8-3.2 5-3.9"} style={{ transition: "d 0.6s ease" }} />
      <path d={closed ? "M21 10c-2-3-5.5-4.5-9-4.5" : "M21 10c-1.2-2-2.8-3.2-5-3.9"} style={{ transition: "d 0.6s ease" }} />
      {closed ? <path d="M9.5 12.5h5M12 10.5v4" strokeWidth="1.2" opacity="0.7" /> : <circle cx="12" cy="9" r="2.2" />}
    </svg>
  );
}

function SoundIcon({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" />
      {on ? <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11" /> : <path d="m16 9.5 5 5M21 9.5l-5 5" />}
    </svg>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const roofClosed = useWorld((s) => s.roofClosed);
  const sound = useWorld((s) => s.sound);
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  const inMatch = pathname.startsWith("/match");
  const current = sectionForPath(pathname);

  // Close the menu on Escape, on a click outside, and when the page changes
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    const click = (e: MouseEvent) => {
      if (!menu.current?.contains(e.target as Node) && !button.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", key);
    window.addEventListener("pointerdown", click);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("pointerdown", click);
    };
  }, [open]);

  const toggleRoof = () => {
    const next = roofClosed ? "open" : "closed";
    useWorld.getState().setRoofMode(next);
    try {
      localStorage.setItem("roof", next);
    } catch {
      // Not remembered in private browsing
    }
  };

  const toggleSound = () => useWorld.getState().setSound(!sound);

  const switchView = () => {
    const next = inMatch ? "tour" : "match";
    try {
      localStorage.setItem("view", next);
    } catch {
      // Not remembered in private browsing
    }
    useWorld.getState().setMode(next === "match" ? "flat" : "tour");
    if (next === "match") router.push(current && current.id !== "home" ? `/match#${current.id}` : "/match");
    else router.push("/");
  };

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
      <Link href={inMatch ? "/match" : "/"} className="pointer-events-auto group flex items-center gap-2.5 rounded-full py-1 pr-3" aria-label={`${profile.name}, home`}>
        <span className="grid h-10 w-10 place-items-center rounded-full border border-line-strong bg-panel font-display text-xl font-bold text-gold backdrop-blur-md transition-colors group-hover:border-gold">{profile.shirtNumber}</span>
        <span className="font-display text-xl font-bold uppercase tracking-[0.12em] [text-shadow:0_1px_12px_rgba(0,0,0,0.5)]">{profile.shortName}</span>
      </Link>

      <nav className="pointer-events-auto flex items-center gap-2" aria-label="Site">
        <div className="relative">
          <button ref={button} type="button" className="btn !min-h-11 !px-4 !text-sm" aria-expanded={open} aria-controls="places-menu" onClick={() => setOpen((o) => !o)}>
            <PlaceIcon id="home" className="h-5 w-5 text-gold" />
            <span>Places</span>
          </button>
          {open && (
            <div ref={menu} id="places-menu" className="glass panel-in absolute right-0 top-[calc(100%+0.6rem)] w-[min(22rem,calc(100vw-2rem))] rounded-2xl p-2">
              <ul role="list" className="scroll-area max-h-[70vh] overflow-y-auto">
                {places.map((place) => {
                  const href = inMatch ? `/match#${place.id}` : place.href;
                  const active = current?.id === place.id;
                  return (
                    <li key={place.id}>
                      <Link href={href} onClick={() => setOpen(false)} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-line ${active ? "bg-line" : ""}`}>
                        <PlaceIcon id={place.id} className="h-6 w-6 flex-none text-gold" />
                        <span className="min-w-0">
                          <span className="flex items-baseline gap-2">
                            <span className="font-display text-lg font-semibold uppercase tracking-wide">{place.title}</span>
                            <span className="truncate text-xs text-ink-faint">{place.place}</span>
                          </span>
                          <span className="block truncate text-sm text-ink-soft">{place.summary}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-2">
                <EggList compact />
              </div>
            </div>
          )}
        </div>

        <button type="button" className="icon-btn" onClick={toggleRoof} aria-pressed={roofClosed} aria-label={roofClosed ? "Open the roof (light theme)" : "Close the roof (dark theme)"} title={roofClosed ? "Open the roof (light theme)" : "Close the roof (dark theme)"}>
          <RoofIcon closed={roofClosed} />
        </button>
        {!inMatch && (
          <button type="button" className="icon-btn" onClick={toggleSound} aria-pressed={sound} aria-label={sound ? "Turn the crowd sound off" : "Turn the crowd sound on"} title={sound ? "Sound on" : "Sound off"}>
            <SoundIcon on={sound} />
          </button>
        )}
        <button type="button" className="btn !min-h-11 !px-4 !text-sm" onClick={switchView} title={inMatch ? "Switch to the 3D stadium tour" : "Switch to the flat match view"}>
          {inMatch ? "3D tour" : "Match view"}
        </button>
      </nav>
    </header>
  );
}
