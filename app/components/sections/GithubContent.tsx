"use client";

import { profile } from "../../data/portfolio";
import { LEVEL_HEX, LEVEL_HEX_LIGHT } from "../../lib/github";
import { useWorld } from "../../lib/store";
import { Arrow, ExternalLink, Stats } from "./parts";

// GitHub: the stands. The same contribution grid the crowd is holding
// up in the main stand, as a normal chart. The data comes from
// app/api/contributions/route.ts.

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function describe(date: string, count: number): string {
  if (!date) return "";
  const pretty = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  if (count < 0) return pretty;
  return `${count === 0 ? "No" : count} contribution${count === 1 ? "" : "s"} on ${pretty}`;
}

export default function GithubContent() {
  const data = useWorld((s) => s.contributions);
  const roofClosed = useWorld((s) => s.roofClosed);
  const palette = roofClosed ? LEVEL_HEX : LEVEL_HEX_LIGHT;

  const activeDays = data ? data.levels.flat().filter((level) => level > 0).length : 0;
  const busiest = data ? Math.max(0, ...data.counts.flat()) : 0;

  return (
    <div className="space-y-6">
      <p className="leading-relaxed text-ink-soft">
        <span className="text-ink">Every square is a day.</span> The greener it is, the more I committed. Across the pitch, the fans in the main stand are holding up the same picture.
      </p>

      {data ? (
        <>
          <Stats
            items={[
              { value: String(data.total), label: "contributions in the last year" },
              { value: String(activeDays), label: "days with a commit" },
              { value: String(busiest), label: "most in one day" },
            ]}
          />
          <div className="scroll-area overflow-x-auto rounded-2xl border border-line bg-bg-raised/40 p-3.5">
            <div role="img" aria-label={`GitHub contribution chart for ${data.user}: ${data.total} contributions in the last year, on ${activeDays} days.`} className="grid w-max grid-flow-col grid-rows-7 gap-[3px]">
              {data.levels.map((week, w) =>
                week.map((level, d) => (
                  <span key={`${w}-${d}`} title={describe(data.dates[w]?.[d] ?? "", data.counts[w]?.[d] ?? -1) || undefined} className="h-[11px] w-[11px] rounded-[2px]" style={{ background: level < 0 ? "transparent" : palette[Math.min(4, level)] }} data-day={DAY_NAMES[d]} />
                )),
              )}
            </div>
            <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-ink-faint">
              <span>Less</span>
              {palette.map((hex) => (
                <span key={hex} className="h-[11px] w-[11px] rounded-[2px]" style={{ background: hex }} />
              ))}
              <span>More</span>
            </div>
          </div>
          {!data.live && <p className="text-xs text-ink-faint">GitHub could not be reached just now, so this is a saved copy.</p>}
        </>
      ) : (
        <p className="rounded-2xl border border-line bg-bg-raised/40 px-4 py-6 text-center text-sm text-ink-soft" role="status">
          Counting the cards…
        </p>
      )}

      <div className="flex flex-wrap gap-2.5">
        <ExternalLink href={profile.githubUrl} className="btn btn-primary !min-h-10 !px-4 !text-sm">
          My GitHub profile <Arrow />
        </ExternalLink>
        <ExternalLink href={profile.siteRepoUrl} className="btn !min-h-10 !px-4 !text-sm">
          This site&apos;s code <Arrow />
        </ExternalLink>
      </div>
    </div>
  );
}
