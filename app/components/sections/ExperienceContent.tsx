import { experience } from "../../data/portfolio";
import { Chips, ExternalLink } from "./parts";

// Experience: the dugout. Each role in `experience`
// (app/data/portfolio.ts) is a signing.
export default function ExperienceContent() {
  return (
    <ol role="list" className="space-y-5">
      {experience.map((job) => (
        <li key={job.id} className="rounded-2xl border border-line bg-bg-raised/40 p-4 sm:p-5">
          <p className="kicker">
            {job.kind === "leadership" ? "Captaincy" : "Signed"} · {job.start} to {job.end}
          </p>
          <h2 className="mt-1 font-display text-3xl font-bold uppercase leading-none tracking-wide">{job.role}</h2>
          <p className="mt-1.5 text-sm">
            {job.organizationUrl ? <ExternalLink href={job.organizationUrl}>{job.organization}</ExternalLink> : <span className="font-medium">{job.organization}</span>}
            {job.team && <span className="text-ink-soft"> · {job.team}</span>}
            <span className="text-ink-faint"> · {job.location}</span>
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-soft">{job.summary}</p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed">
            {job.highlights.map((line) => (
              <li key={line.slice(0, 32)} className="flex gap-2.5">
                <span aria-hidden="true" className="mt-[0.55em] h-1.5 w-1.5 flex-none rounded-full bg-gold" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Chips items={job.tags} label="Skills used" />
          </div>
        </li>
      ))}
    </ol>
  );
}
