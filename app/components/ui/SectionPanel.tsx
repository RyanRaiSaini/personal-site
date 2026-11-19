"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useWorld } from "../../lib/store";
import { places, section as getSection, type SectionId } from "../../sections/registry";
import PlaceIcon from "./PlaceIcon";

// The panel a section's page is written on. On a wide screen it sits
// on the right and the camera frames the place on the left; on a
// narrow screen it is a sheet across the bottom. It tells the 3D world
// how much room it takes, so the view can slide aside for it.

export default function SectionPanel({ id, children }: { id: SectionId; children: React.ReactNode }) {
  const router = useRouter();
  const panel = useRef<HTMLElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const info = getSection(id);

  const index = places.findIndex((p) => p.id === id);
  const previous = places[(index - 1 + places.length) % places.length];
  const next = places[(index + 1) % places.length];

  // Tell the camera how far to slide the view
  useEffect(() => {
    const el = panel.current;
    if (!el) return;
    const report = () => {
      const rect = el.getBoundingClientRect();
      const wide = window.matchMedia("(min-width: 1024px)").matches;
      if (wide) useWorld.getState().setViewOffset(Math.round((window.innerWidth - rect.left) / 2), 0);
      else useWorld.getState().setViewOffset(0, Math.round((window.innerHeight - rect.top) / 2));
    };
    report();
    const observer = new ResizeObserver(report);
    observer.observe(el);
    window.addEventListener("resize", report);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", report);
      useWorld.getState().setViewOffset(0, 0);
    };
  }, []);

  // Move keyboard focus to the new section's heading
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [id]);

  // Escape goes back to the stadium
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      // Leave Escape alone while something on top (a menu, the photo viewer) is open
      if (document.querySelector("[data-overlay-open]")) return;
      router.push("/");
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [router]);

  return (
    <main className="pointer-events-none fixed inset-0 z-10 flex items-end justify-end lg:items-stretch">
      <article
        ref={panel}
        aria-labelledby="section-title"
        className="glass panel-in pointer-events-auto flex max-h-[64dvh] w-full flex-col rounded-t-3xl lg:mb-4 lg:mr-4 lg:mt-[4.75rem] lg:max-h-none lg:w-[min(34rem,44vw)] lg:rounded-3xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 pb-4 pt-5 sm:px-7">
          <div className="min-w-0">
            <p className="kicker flex items-center gap-2">
              <PlaceIcon id={id} className="h-4 w-4" />
              <span>
                {info.place} · {info.kicker}
              </span>
            </p>
            <h1 id="section-title" ref={heading} tabIndex={-1} className="mt-1 font-display text-4xl font-bold uppercase leading-none tracking-wide outline-none sm:text-5xl">
              {info.title}
            </h1>
            {info.intro && <p className="mt-2 text-sm text-ink-soft">{info.intro}</p>}
          </div>
          <Link href="/" className="icon-btn flex-none" aria-label="Back to the stadium" title="Back to the stadium (Esc)">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </Link>
        </header>

        <div className="scroll-area min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">{children}</div>

        <footer className="flex items-center justify-between gap-2 border-t border-line px-3 py-2.5 sm:px-5">
          <Link href={previous.href} className="group flex min-w-0 items-center gap-2 rounded-full px-3 py-2 text-sm text-ink-soft transition-colors hover:text-gold" aria-label={`Previous: ${previous.title}`}>
            <span aria-hidden="true">←</span>
            <span className="truncate font-display text-base font-semibold uppercase tracking-wide">{previous.title}</span>
          </Link>
          <Link href="/" className="hidden rounded-full px-3 py-2 text-xs uppercase tracking-[0.16em] text-ink-faint transition-colors hover:text-gold sm:block">
            Stadium
          </Link>
          <Link href={next.href} className="group flex min-w-0 items-center gap-2 rounded-full px-3 py-2 text-sm text-ink-soft transition-colors hover:text-gold" aria-label={`Next: ${next.title}`}>
            <span className="truncate font-display text-base font-semibold uppercase tracking-wide">{next.title}</span>
            <span aria-hidden="true">→</span>
          </Link>
        </footer>
      </article>
    </main>
  );
}
