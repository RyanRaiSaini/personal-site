import { bench, skillGroups, squad } from "../../data/portfolio";
import { Chips, SubHeading } from "./parts";

// Skills: the dressing room. The starting eleven comes from `squad`
// and the full lists from `skillGroups` (app/data/portfolio.ts).
export default function SkillsContent() {
  return (
    <div className="space-y-7">
      <section aria-labelledby="skills-eleven" className="space-y-3">
        <SubHeading id="skills-eleven">Starting eleven</SubHeading>
        <p className="text-sm text-ink-soft">The tools I reach for first, lined up 4-3-3.</p>

        {/* The tactics board. Decorative: the same names are listed below. */}
        <div aria-hidden="true" className="relative mx-auto aspect-[68/82] w-full max-w-md overflow-hidden rounded-2xl border border-line" style={{ background: "repeating-linear-gradient(0deg, #1d6b37 0 12.5%, #23783f 12.5% 25%)" }}>
          <svg viewBox="0 0 68 82" className="absolute inset-0 h-full w-full" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.35">
            <rect x="2" y="2" width="64" height="78" />
            <path d="M2 41h64" />
            <circle cx="34" cy="41" r="8" />
            <rect x="15" y="64" width="38" height="16" />
            <rect x="25" y="74" width="18" height="6" />
            <rect x="15" y="2" width="38" height="16" />
            <rect x="25" y="2" width="18" height="6" />
          </svg>
          {squad.map((player) => (
            <div key={player.number} className="absolute flex -translate-x-1/2 translate-y-1/2 flex-col items-center" style={{ left: `${player.x}%`, bottom: `${4 + player.y * 0.9}%` }}>
              <span className="grid h-8 w-8 place-items-center rounded-full border border-white/70 bg-white font-display text-base font-bold text-[#10224a] shadow-lg sm:h-9 sm:w-9">{player.number}</span>
              <span className="mt-0.5 whitespace-nowrap rounded bg-black/60 px-1.5 py-px font-display text-xs font-semibold uppercase tracking-wide text-white sm:text-sm">{player.name}</span>
            </div>
          ))}
        </div>

        <ol className="sr-only">
          {squad.map((player) => (
            <li key={player.number}>
              Number {player.number}: {player.name}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="skills-bench" className="space-y-3">
        <SubHeading id="skills-bench">On the bench</SubHeading>
        <Chips items={bench} label="Substitutes" />
      </section>

      <section aria-labelledby="skills-all" className="space-y-4">
        <SubHeading id="skills-all">The full squad</SubHeading>
        {skillGroups.map((group) => (
          <div key={group.category} className="space-y-2">
            <h3 className="text-xs uppercase tracking-[0.14em] text-ink-faint">{group.category}</h3>
            <Chips items={group.skills} label={group.category} />
          </div>
        ))}
      </section>
    </div>
  );
}
