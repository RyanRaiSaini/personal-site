"use client";

import { eggs } from "../../data/portfolio";
import { useWorld } from "../../lib/store";

// The Easter egg tally: the ones found so far by name, the rest as
// hints. The eggs themselves are listed in `eggs` in
// app/data/portfolio.ts.
export default function EggList({ compact = false }: { compact?: boolean }) {
  const found = useWorld((s) => s.eggsFound);

  return (
    <details className={`rounded-2xl border border-line bg-bg-raised/40 ${compact ? "text-sm" : ""}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
        <span className="kicker">Easter eggs</span>
        <span className="font-mono text-sm tabular-nums text-ink-soft">
          {found.length} of {eggs.length} found
        </span>
      </summary>
      <ul role="list" className="space-y-2 border-t border-line px-4 py-3">
        {eggs.map((egg) => {
          const got = found.includes(egg.id);
          return (
            <li key={egg.id} className="flex gap-2.5">
              <span aria-hidden="true" className={`mt-1 grid h-4 w-4 flex-none place-items-center rounded-full border text-[10px] ${got ? "border-gold bg-gold text-gold-ink" : "border-line-strong text-transparent"}`}>
                ✓
              </span>
              <span className="min-w-0">
                {got ? <span className="font-display text-base font-semibold uppercase tracking-wide">{egg.name}</span> : <span className="text-sm text-ink-soft">{egg.hint}</span>}
                <span className="sr-only">{got ? " (found)" : " (not found yet)"}</span>
              </span>
            </li>
          );
        })}
      </ul>
    </details>
  );
}
