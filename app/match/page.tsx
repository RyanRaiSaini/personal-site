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
import { home, matchText, profile } from "../data/portfolio";
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

      <div className="relative mx-auto max-w-[54rem] px-5 pb-28 pt-28 sm:px-8 sm:pt-36">
        {/* centred, the name on the centre spot like a kick-off */}
        <header className="pb-14 text-center sm:pb-20">
          <p className="kicker">{profile.location}</p>
          <h1 className="match-name mt-3 font-display font-extrabold uppercase tracking-tight">{profile.name}</h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-ink-soft">{profile.headline}</p>
          <p className="mx-auto mt-2 max-w-xl text-ink-soft">{profile.seeking}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <a href="#projects" className="btn btn-primary">
              {home.projects}
            </a>
            <a href="#contact" className="btn">
              {home.contact}
            </a>
            <a href={profile.resumeUrl} className="btn" target="_blank" rel="noopener noreferrer">
              {home.resume}
              {newTab}
            </a>
          </div>
          <ul aria-label="Links" className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-1 text-[0.9375rem]">
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

          {/* The team sheet: every section, in match order. The minute
              sits above the name, so no name is ever cut short. */}
          <nav aria-label="Sections" className="mt-12 text-left">
            <ol role="list" className="match-index">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>
                    <span className="match-index-minute">{s.minute}</span>
                    <span className="match-index-title">{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </header>

        {/* The match, minute by minute */}
        {/* Each section has the minute in a gutter on its left. The line
            that joins one minute to the next runs down that gutter, clear
            of the text. On a phone the gutter goes and the minute sits
            beside the title. */}
        <ol role="list" className="match-timeline">
          {sections.map((s) => {
            const Content = CONTENT[s.id as Exclude<SectionId, "home">];
            return (
              <li key={s.id}>
                <section id={s.id} data-minute={s.minute} data-event={s.matchEvent} aria-labelledby={`${s.id}-title`} className="match-event scroll-mt-24">
                  <div className="match-rail" aria-hidden="true">
                    <span className="match-minute">{s.minute}</span>
                  </div>
                  <div className="min-w-0">
                    <header className="match-head">
                      <p className="sign">
                        <PlaceIcon id={s.id} className="h-[1.125rem] w-[1.125rem] flex-none text-gold" />
                        <span className="sign-place">{s.place}</span>
                        <span className="sign-what">{s.matchEvent}</span>
                      </p>
                      <h2 id={`${s.id}-title`} className="mt-1 font-display text-[2.75rem] font-bold uppercase leading-[0.95] tracking-[0.01em] sm:text-[3.5rem]">
                        {s.title}
                      </h2>
                      {s.intro && <p className="mt-2 text-ink-soft">{s.intro}</p>}
                    </header>
                    <Content />
                  </div>
                </section>
              </li>
            );
          })}
        </ol>

        <footer className="mt-24 space-y-6 border-t border-line pt-8">
          <div>
            <p className="kicker">{matchText.fullTime}</p>
            <p className="mt-1 font-display text-3xl font-bold uppercase tracking-wide">{matchText.thanks}</p>
            <p className="mt-2 text-ink-soft">{matchText.tourNote}</p>
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
