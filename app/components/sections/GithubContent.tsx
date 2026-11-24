"use client";

import { githubText, profile } from "../../data/portfolio";
import { useWorld } from "../../lib/store";
import { Arrow, ExternalLink, Stats } from "./parts";

// GitHub: the stands. The year's figures and the last few weeks as a
// chart; the scoreboard on the main stand (world3d/stadium/GithubBoard.tsx)
// shows the same. The data comes from app/api/contributions/route.ts.

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function describe(date: string, count: number): string {
  if (!date) return "";
  const pretty = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  if (count < 0) return pretty;
  return `${count === 0 ? "No" : count} contribution${count === 1 ? "" : "s"} on ${pretty}`;
}

export default function GithubContent() {
  const data = useWorld((s) => s.contributions);
  // GitHub's five shades, from the stylesheet: the dark ones in the
  // stadium's panel and at night, the light ones by day in the flat view
  const palette = [0, 1, 2, 3, 4].map((n) => `var(--level-${n})`);

  const activeDays = data ? data.levels.flat().filter((level) => level > 0).length : 0;
  const busiest = data ? Math.max(0, ...data.counts.flat()) : 0;
  // only the last few weeks: a whole year is mostly empty squares
  const from = data ? Math.max(0, data.levels.length - githubText.recentWeeks) : 0;
  const weeks = data ? data.levels.slice(from) : [];

  return (
    <div className="sec">
      <p className="text-ink-soft">
        <span className="text-ink">{githubText.lead}</span> {githubText.body}
      </p>

      {data ? (
        <>
          <Stats
            items={[
              { value: String(data.total), label: githubText.total },
              { value: String(activeDays), label: githubText.active },
              { value: String(busiest), label: githubText.best },
            ]}
          />
          <div className="card">
            {/* a calendar of the last few weeks: a row a week, a column a day,
                each day's count written in its square */}
            <div role="img" aria-label={`GitHub contributions for ${data.user}, the last ${weeks.length} weeks. ${data.total} contributions in the last year, on ${activeDays} days.`} className="grid grid-cols-7 gap-[6px] text-center">
              {githubText.dayHeads.map((head) => (
                <span key={head} className="pb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  {head}
                </span>
              ))}
              {weeks.map((week, i) =>
                week.map((level, d) => {
                  const count = data.counts[from + i]?.[d] ?? -1;
                  const date = data.dates[from + i]?.[d] ?? "";
                  return (
                    <span key={`${i}-${d}`} title={describe(date, count) || undefined} className="flex aspect-square w-full flex-col items-center justify-center rounded-[5px]" style={{ background: level < 0 ? "transparent" : palette[Math.min(4, level)] }} data-day={DAY_NAMES[d]}>
                      {/* in each square's own readable colour (--level-ink-N in globals.css) */}
                      {level >= 0 && (
                        <span className="text-[0.62rem] leading-none" style={{ color: `var(--level-ink-${Math.min(4, level)})` }}>
                          {date.slice(8).replace(/^0/, "")}
                        </span>
                      )}
                      {count > 0 && (
                        <span className="mt-0.5 font-display text-lg font-bold leading-none" style={{ color: `var(--level-ink-${Math.min(4, level)})` }}>
                          {count}
                        </span>
                      )}
                    </span>
                  );
                }),
              )}
            </div>
            <div className="mt-3 flex items-center justify-between gap-1.5 text-xs text-ink-faint">
              <span>{githubText.board.recent}</span>
              <span className="flex items-center gap-1.5">
                <span>Less</span>
                {palette.map((hex) => (
                  <span key={hex} className="h-[11px] w-[11px] rounded-[2px]" style={{ background: hex }} />
                ))}
                <span>More</span>
              </span>
            </div>
          </div>
          {!data.live && <p className="meta">{githubText.saved}</p>}
        </>
      ) : (
        <p className="card text-center text-ink-soft" role="status">
          Loading contributions…
        </p>
      )}

      <div className="flex flex-wrap gap-2.5">
        <ExternalLink href={profile.githubUrl} className="btn btn-primary !min-h-10 !px-3.5 !text-base">
          My GitHub profile <Arrow />
        </ExternalLink>
        <ExternalLink href={profile.siteRepoUrl} className="btn !min-h-10 !px-3.5 !text-base">
          This site&apos;s code <Arrow />
        </ExternalLink>
      </div>
    </div>
  );
}
