"use client";

import { useState } from "react";
import { projects } from "../../data/portfolio";
import { useWorld } from "../../lib/store";
import { Arrow, Chips, ExternalLink, Stats } from "./parts";

// Projects: the goal. Every project in `projects`
// (app/data/portfolio.ts) is a goal. Opening one plays its replay in
// the 3D world: number 8 scores it again.
export default function ProjectsContent() {
  const [open, setOpen] = useState<string>(projects[0].id);

  const choose = (id: string, title: string) => {
    const opening = open !== id;
    setOpen(opening ? id : "");
    if (!opening) return;
    const world = useWorld.getState();
    world.select("project", id);
    // The replay only plays in the 3D tour, and never over another show
    if (world.worldReady && world.section === "projects" && !world.show && !world.reducedMotion) {
      world.startShow({ kind: "goal", scorer: "saini", label: title.toUpperCase() });
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-soft">
        <span className="font-display text-lg font-bold uppercase tracking-wide text-gold">{projects.length} goals.</span> A hat-trick so far. Choose one to see the replay.
      </p>
      <ol role="list" className="space-y-3">
        {projects.map((project) => {
          const expanded = open === project.id;
          return (
            <li key={project.id} className={`rounded-2xl border bg-bg-raised/40 transition-colors ${expanded ? "border-gold" : "border-line"}`}>
              <h2>
                <button type="button" aria-expanded={expanded} aria-controls={`project-${project.id}`} onClick={() => choose(project.id, project.title)} className="flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left sm:px-5">
                  <span className="flex-none text-center">
                    <span className="block font-mono text-xs text-ink-faint">{project.minute}</span>
                    <span className="block font-display text-sm font-bold uppercase tracking-[0.16em] text-gold">Goal</span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-3xl font-bold uppercase leading-none tracking-wide">{project.title}</span>
                    <span className="mt-1 block text-xs text-ink-faint">{project.kicker}</span>
                  </span>
                  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className={`flex-none text-ink-soft transition-transform ${expanded ? "rotate-180" : ""}`}>
                    <path d="m3 6 5 5 5-5" />
                  </svg>
                </button>
              </h2>
              <p className="px-4 pb-3.5 text-sm leading-relaxed text-ink-soft sm:px-5">{project.summary}</p>

              <div id={`project-${project.id}`} hidden={!expanded} className="space-y-4 border-t border-line px-4 py-4 sm:px-5">
                <p className="text-sm leading-relaxed">{project.description}</p>
                <Stats items={project.stats} />
                <ul className="space-y-2 text-sm leading-relaxed">
                  {project.features.map((feature) => (
                    <li key={feature.slice(0, 32)} className="flex gap-2.5">
                      <span aria-hidden="true" className="mt-[0.55em] h-1.5 w-1.5 flex-none rounded-full bg-gold" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                {project.role && (
                  <p className="rounded-xl border border-line bg-bg/40 px-3.5 py-3 text-sm leading-relaxed">
                    <span className="kicker mb-1 block">My part</span>
                    {project.role}
                  </p>
                )}
                <Chips items={project.technologies} label="Built with" />
                <div className="flex flex-wrap gap-2.5">
                  {project.links.map((link) => (
                    <ExternalLink key={link.href} href={link.href} className="btn !min-h-10 !px-4 !text-sm">
                      {link.label}
                      <Arrow />
                    </ExternalLink>
                  ))}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
