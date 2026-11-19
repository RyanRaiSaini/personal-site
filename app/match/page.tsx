import type { Metadata } from "next";
import EnterTour from "../components/match/EnterTour";
import MatchClock from "../components/match/MatchClock";
import EggList from "../components/ui/EggList";
import AboutContent from "../components/sections/AboutContent";
import AwardsContent from "../components/sections/AwardsContent";
import ContactContent from "../components/sections/ContactContent";
import ExperienceContent from "../components/sections/ExperienceContent";
import GithubContent from "../components/sections/GithubContent";
import LiveContent from "../components/sections/LiveContent";
import NewsContent from "../components/sections/NewsContent";
import ProjectsContent from "../components/sections/ProjectsContent";
import ResumeContent from "../components/sections/ResumeContent";
import SkillsContent from "../components/sections/SkillsContent";
import Colophon from "../components/ui/Colophon";
import PlaceIcon from "../components/ui/PlaceIcon";
import { profile } from "../data/portfolio";
import { matchOrder, section, type SectionId } from "../sections/registry";

// ------------------------------------------------------------------
// The match view: the whole site as one flat page, told as a match.
// You scroll from kick-off to full time and every section is something
// that happens along the way. It is what phones get by default, and
// what anyone gets who would rather not have the 3D stadium.
//
// The order of the sections is `matchOrder` in app/sections/registry.ts.
// ------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Match view",
  description: `${profile.name}'s portfolio on one page: projects, experience, skills, awards and contact.`,
  alternates: { canonical: "/match" },
};

const CONTENT: Record<Exclude<SectionId, "home">, () => React.ReactNode> = {
  about: AboutContent,
  projects: ProjectsContent,
  experience: ExperienceContent,
  live: LiveContent,
  skills: SkillsContent,
  awards: AwardsContent,
  news: NewsContent,
  github: GithubContent,
  resume: ResumeContent,
  contact: ContactContent,
};

const newTab = <span className="sr-only"> (opens in a new tab)</span>;

export default function MatchPage() {
  const sections = matchOrder.map((id) => section(id));

  return (
    <main className="pointer-events-auto relative">
      {/* A pitch seen from above, faint, behind the top of the page */}
      <div aria-hidden="true" className="match-pitch absolute inset-x-0 top-0 h-[38rem]" />

      <div className="relative mx-auto max-w-3xl px-5 pb-28 pt-28 sm:px-8 sm:pt-36">
        <header className="pb-14 sm:pb-20">
          <p className="kicker">
            Number {profile.shirtNumber} · {profile.location}
          </p>
          <h1 className="mt-2 font-display text-6xl font-extrabold uppercase leading-[0.9] tracking-tight sm:text-8xl">{profile.name}</h1>
          <p className="mt-4 max-w-xl text-lg text-ink-soft">{profile.headline}</p>
          <p className="mt-2 max-w-xl text-ink-soft">{profile.seeking}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#projects" className="btn btn-primary">
              View projects
            </a>
            <a href="#contact" className="btn">
              Contact
            </a>
            <a href={profile.resumeUrl} className="btn" target="_blank" rel="noopener noreferrer">
              Résumé{newTab}
            </a>
          </div>
          <ul aria-label="Links" className="mt-5 flex flex-wrap gap-x-5 gap-y-1 text-sm">
            <li>
              <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="link">
                GitHub{newTab}
              </a>
            </li>
            <li>
              <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="link">
                LinkedIn{newTab}
              </a>
            </li>
            <li>
              <a href={`mailto:${profile.email}`} className="link">
                {profile.email}
              </a>
            </li>
          </ul>

          {/* The team sheet: every section, in match order */}
          <nav aria-label="Sections" className="mt-10">
            <ol role="list" className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex items-center gap-2.5 rounded-xl border border-line bg-bg-raised/50 px-3 py-2.5 transition-colors hover:border-gold">
                    <span className="w-9 flex-none font-mono text-xs text-gold">{s.minute}</span>
                    <span className="truncate font-display text-base font-semibold uppercase tracking-wide">{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </header>

        {/* The match, minute by minute */}
        <ol role="list" className="match-timeline space-y-16 sm:space-y-24">
          {sections.map((s) => {
            const Content = CONTENT[s.id as Exclude<SectionId, "home">];
            return (
              <li key={s.id}>
                <section id={s.id} data-minute={s.minute} data-event={s.matchEvent} aria-labelledby={`${s.id}-title`} className="match-event scroll-mt-24">
                  <div className="mb-6 flex items-center gap-4">
                    <span className="grid h-14 w-14 flex-none place-items-center rounded-full border border-gold bg-bg font-mono text-sm font-semibold text-gold">{s.minute}</span>
                    <div className="min-w-0">
                      <p className="kicker flex items-center gap-2">
                        <PlaceIcon id={s.id} className="h-4 w-4" />
                        {s.matchEvent} · {s.place}
                      </p>
                      <h2 id={`${s.id}-title`} className="font-display text-5xl font-bold uppercase leading-none tracking-wide sm:text-6xl">
                        {s.title}
                      </h2>
                    </div>
                  </div>
                  {s.intro && <p className="mb-6 text-ink-soft">{s.intro}</p>}
                  <Content />
                </section>
              </li>
            );
          })}
        </ol>

        <footer className="mt-24 space-y-6 border-t border-line pt-8">
          <div>
            <p className="kicker">Full time</p>
            <p className="mt-1 font-display text-3xl font-bold uppercase tracking-wide">Thanks for watching.</p>
            <p className="mt-2 text-ink-soft">On a bigger screen this whole site is a 3D stadium you can walk around.</p>
            <div className="mt-4">
              <EnterTour />
            </div>
          </div>
          <EggList />
          <Colophon className="text-ink-faint" />
        </footer>
      </div>

      <MatchClock />
    </main>
  );
}
