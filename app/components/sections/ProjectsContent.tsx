"use client";

import { useState } from "react";
import { projects, projectText } from "../../data/portfolio";
import { useWorld } from "../../lib/store";
import Tabs from "../ui/Tabs";
import { Arrow, Bullets, ExternalLink, InlineList, Stats } from "./parts";

// Projects: the goal. Every project in `projects`
// (app/data/portfolio.ts) is a goal. Opening one plays its replay in
// the 3D world: number 8 scores it again.
//
// An open project is split into two tabs, what it is and what I did,
// so that it fits on a screen without a long scroll.
export default function ProjectsContent() {
  // all closed at first: opening a project is what plays the goal
  const [open, setOpen] = useState<string>("");

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
    <ol role="list" className="sec !gap-3">
      {projects.map((project) => {
        const expanded = open === project.id;
        const hasResults = project.stats.length > 0 || Boolean(project.role);

        const builtWith = (
          <div className="grid gap-2">
            <p className="label">{projectText.builtWith}</p>
            <InlineList items={project.technologies} label={projectText.builtWith} />
          </div>
        );
        const links = (
          <div className="flex flex-wrap gap-2.5">
            {project.links.map((link) => (
              <ExternalLink key={link.href} href={link.href} className="btn !min-h-10 !px-3.5 !text-base">
                {link.label}
                <Arrow />
              </ExternalLink>
            ))}
          </div>
        );
        const overview = (
          <div className="grid gap-4">
            <p>{project.description}</p>
            {project.features.length > 0 && <Bullets items={project.features} />}
            {!hasResults && builtWith}
            {!hasResults && links}
          </div>
        );
        const results = (
          <div className="grid gap-4">
            <Stats items={project.stats} />
            {project.role && (
              <div className="grid gap-1.5">
                <p className="label">{projectText.role}</p>
                <p className="text-[0.9375rem] leading-[1.55]">{project.role}</p>
              </div>
            )}
            {builtWith}
            {links}
          </div>
        );

        return (
          <li key={project.id} className={`card !p-0 transition-colors ${expanded ? "!border-gold" : ""}`}>
            <h2>
              <button type="button" aria-expanded={expanded} aria-controls={`project-${project.id}`} onClick={() => choose(project.id, project.title)} className="flex w-full items-center gap-4 rounded-[10px] px-[1.125rem] pb-2 pt-4 text-left">
                <span className="flex-none text-center leading-none">
                  <span className="block font-display text-sm font-semibold text-ink-faint">{project.minute}</span>
                  <span className="mt-1 block font-display text-base font-bold tracking-wide text-gold">{projectText.goal}</span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="card-title block">{project.title}</span>
                  <span className="meta mt-1 block">{project.kicker}</span>
                </span>
                <svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true" className={`flex-none text-ink-soft transition-transform ${expanded ? "rotate-180" : ""}`}>
                  <path d="m3 6 5 5 5-5" />
                </svg>
              </button>
            </h2>
            <div className="grid gap-2 px-[1.125rem] pb-4">
              {project.award && <p className="font-display text-[1.0625rem] font-semibold leading-snug tracking-wide text-gold">{project.award}</p>}
              <p className="text-[0.9375rem] leading-[1.55] text-ink-soft">{project.summary}</p>
            </div>

            <div id={`project-${project.id}`} hidden={!expanded} className="border-t border-line px-[1.125rem] py-4">
              {hasResults ? (
                <Tabs
                  label={project.title}
                  tabs={[
                    { id: "overview", title: projectText.overviewTab, content: overview },
                    { id: "results", title: projectText.resultsTab, content: results },
                  ]}
                />
              ) : (
                overview
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
