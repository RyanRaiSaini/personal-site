"use client";

import { useEffect, useState } from "react";

// The match clock in the corner of the match view. It reads which
// section is on screen and shows that section's minute and event,
// with a bar that fills from kick-off to full time as you scroll.

type Now = { minute: string; event: string };

export default function MatchClock() {
  const [now, setNow] = useState<Now>({ minute: "0'", event: "Walk-out" });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const events = Array.from(document.querySelectorAll<HTMLElement>(".match-event"));
    const update = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
      // the last section whose top has passed the upper third of the screen
      const line = window.innerHeight * 0.36;
      let current: HTMLElement | null = null;
      for (const el of events) {
        if (el.getBoundingClientRect().top <= line) current = el;
      }
      setNow(current ? { minute: current.dataset.minute ?? "", event: current.dataset.event ?? "" } : { minute: "0'", event: "Walk-out" });
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div aria-hidden="true" className="glass pointer-events-none fixed bottom-4 right-4 z-30 w-40 overflow-hidden rounded-2xl sm:w-44">
      <div className="flex items-baseline justify-between gap-2 px-3.5 pt-2.5">
        <span className="font-mono text-2xl font-semibold tabular-nums text-gold">{now.minute}</span>
        <span className="truncate font-display text-sm font-semibold uppercase tracking-[0.14em] text-ink-soft">{now.event}</span>
      </div>
      <div className="mx-3.5 mb-3 mt-2 h-1 overflow-hidden rounded-full bg-line">
        <div className="h-full origin-left rounded-full bg-gold transition-transform duration-150" style={{ transform: `scaleX(${progress})` }} />
      </div>
    </div>
  );
}
