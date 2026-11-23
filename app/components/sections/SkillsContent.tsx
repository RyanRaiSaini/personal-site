import { bench, skillGroups, skillsText, squad } from "../../data/portfolio";
import Tabs from "../ui/Tabs";
import { InlineList } from "./parts";

// Skills: the dressing room. The starting eleven comes from `squad`
// and the full lists from `skillGroups` (app/data/portfolio.ts).
//
// Two tabs: the tactics board with the tools I use most, and the plain
// lists of everything.
export default function SkillsContent() {
  const eleven = (
    <div className="grid gap-4">
      <p className="text-ink-soft">{skillsText.elevenNote}</p>

      {/* The tactics board. Decorative: the same names are listed underneath for screen readers. */}
      <div aria-hidden="true" className="relative mx-auto aspect-[68/74] w-full max-w-[22rem] overflow-hidden rounded-[10px] border border-line" style={{ background: "repeating-linear-gradient(0deg, #1d6b37 0 12.5%, #23783f 12.5% 25%)" }}>
        <svg viewBox="0 0 68 74" className="absolute inset-0 h-full w-full" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.35">
          <rect x="2" y="2" width="64" height="70" />
          <path d="M2 37h64" />
          <circle cx="34" cy="37" r="7.5" />
          <rect x="15" y="57" width="38" height="15" />
          <rect x="25" y="66.5" width="18" height="5.5" />
          <rect x="15" y="2" width="38" height="15" />
          <rect x="25" y="2" width="18" height="5.5" />
        </svg>
        {squad.map((player) => (
          <div key={player.number} className="absolute flex -translate-x-1/2 translate-y-1/2 flex-col items-center" style={{ left: `${player.x}%`, bottom: `${5 + player.y * 0.88}%` }}>
            <span className="grid h-7 w-7 place-items-center rounded-full border border-white/70 bg-white font-display text-[0.9375rem] font-bold text-[#10224a] shadow-lg">{player.number}</span>
            <span className="mt-0.5 whitespace-nowrap rounded-[3px] bg-black/65 px-1.5 py-px font-display text-[0.8125rem] font-semibold tracking-wide text-white">{player.name}</span>
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

      <div className="grid gap-2">
        <p className="label">{skillsText.bench}</p>
        <InlineList items={bench} label={skillsText.bench} />
      </div>
    </div>
  );

  const all = (
    <div className="grid gap-5">
      {skillGroups.map((group) => (
        <div key={group.category} className="grid gap-2">
          <h3 className="label">{group.category}</h3>
          <InlineList items={group.skills} label={group.category} />
        </div>
      ))}
    </div>
  );

  return (
    <div className="sec">
      <Tabs
        label="Skills"
        tabs={[
          { id: "eleven", title: skillsText.elevenTab, content: eleven },
          { id: "all", title: skillsText.allTab, content: all },
        ]}
      />
    </div>
  );
}
