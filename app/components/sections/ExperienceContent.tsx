import { experience, experienceText } from "../../data/portfolio";
import { Bullets, Chips, ExternalLink } from "./parts";

// Experience: the dugout. Each role in `experience`
// (app/data/portfolio.ts) is a signing.
//
// A role shows its first two points; the rest open with one click, so
// three roles fit in the space one used to take.
const SHOWN = 2;

export default function ExperienceContent() {
  return (
    <ol role="list" className="sec !gap-3.5">
      {experience.map((job) => {
        const kind = job.kind === "leadership" ? experienceText.leadership : experienceText.work;
        return (
          <li key={job.id} className="card grid gap-3">
            <div>
              <p className="kicker">
                {kind}
                {/* a role can be listed without dates */}
                {job.start && job.end && (
                  <span className="font-medium text-ink-faint">
                    {" "}
                    · {job.start} to {job.end}
                  </span>
                )}
              </p>
              <h2 className="card-title mt-1">{job.role}</h2>
              <p className="mt-1.5 text-[0.9375rem]">
                {job.organizationUrl ? <ExternalLink href={job.organizationUrl}>{job.organization}</ExternalLink> : <span className="font-medium">{job.organization}</span>}
                {job.team && <span className="text-ink-soft"> · {job.team}</span>}
                <span className="text-ink-faint"> · {job.location}</span>
              </p>
            </div>
            <p className="text-[0.9375rem] leading-[1.55] text-ink-soft">{job.summary}</p>
            <Bullets items={job.highlights} show={SHOWN} more={experienceText.more} />
            <Chips items={job.tags} label={experienceText.skills} />
          </li>
        );
      })}
    </ol>
  );
}
