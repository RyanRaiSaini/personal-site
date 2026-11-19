import type { Metadata } from "next";

// ------------------------------------------------------------------
// The sections of the site and where each one lives in the stadium.
//
// The menu, the name tags in the 3D world, the flat "match view", the
// sitemap and each page's title are all generated from this list, so
// adding a section means adding an entry here and a page for it.
//
// The words inside each section stay in app/data/portfolio.ts. The
// camera positions for each place are in
// app/components/world3d/spots.ts.
// ------------------------------------------------------------------

export type SectionId = "home" | "about" | "projects" | "experience" | "awards" | "news" | "skills" | "resume" | "contact" | "live" | "github";

export type Section = {
  id: SectionId;
  href: `/${string}`;
  title: string; // the section: "Projects"
  place: string; // where it is in the stadium: "The goal"
  kicker: string; // the football name for it: "Goals scored"
  summary: string; // one line, for lists
  intro?: string; // a line about the place, at the top of the page
  // In the 3D tour: is the place out in the bowl (the camera flies
  // there) or a room inside the stadium (the view cuts to it)?
  scene: "bowl" | "room";
  // Which side of a wide screen the panel sits on. The camera frames
  // the place on the other side.
  side: "left" | "right";
  // The minute this section happens at in the flat "match view"
  minute: string;
  matchEvent: string; // "Kick-off", "Goal", "Half-time"...
  listed: boolean;
  metadata: { title: string; description: string };
};

export const sections: Section[] = [
  {
    id: "home",
    href: "/",
    title: "Home",
    place: "The stadium",
    kicker: "Welcome",
    summary: "My name, what I do, and the way to everything else.",
    scene: "bowl",
    side: "left",
    minute: "0'",
    matchEvent: "Walk-out",
    listed: false,
    metadata: {
      title: "Ryan Rai Saini | Mathematics at Waterloo, AI and software projects",
      description: "Portfolio of Ryan Rai Saini, a Mathematics student at the University of Waterloo who builds AI, computer vision and web projects. Set inside a 3D football stadium.",
    },
  },
  {
    id: "about",
    href: "/about",
    title: "About",
    place: "The centre circle",
    kicker: "Kick-off",
    summary: "Who I am and what I'm working toward.",
    intro: "Every match starts here.",
    scene: "bowl",
    side: "right",
    minute: "1'",
    matchEvent: "Kick-off",
    listed: true,
    metadata: { title: "About", description: "About Ryan Rai Saini, a Mathematics student at the University of Waterloo." },
  },
  {
    id: "projects",
    href: "/projects",
    title: "Projects",
    place: "The goal",
    kicker: "Goals scored",
    summary: "What I've built, one goal at a time.",
    intro: "Each project is a goal. Pick one for the replay.",
    scene: "bowl",
    side: "right",
    minute: "23'",
    matchEvent: "Goal",
    listed: true,
    metadata: { title: "Projects", description: "Projects by Ryan Rai Saini: Empyrean smart glasses, the BHive prospect registry and this 3D stadium." },
  },
  {
    id: "experience",
    href: "/experience",
    title: "Experience",
    place: "The dugout",
    kicker: "Signings",
    summary: "Where I've worked and led.",
    intro: "The clubs I've signed for so far.",
    scene: "bowl",
    side: "right",
    minute: "38'",
    matchEvent: "Signing",
    listed: true,
    metadata: { title: "Experience", description: "Ryan Rai Saini's experience: AI Data Engineer Intern at BHive, Bleeding Disorders Canada and Make-A-Wish Canada." },
  },
  {
    id: "skills",
    href: "/skills",
    title: "Skills",
    place: "The dressing room",
    kicker: "The squad",
    summary: "The languages and tools I pick first.",
    intro: "A shirt on every peg. This is the squad I take into a project.",
    scene: "room",
    side: "right",
    minute: "52'",
    matchEvent: "Team sheet",
    listed: true,
    metadata: { title: "Skills", description: "Languages, frameworks and tools Ryan Rai Saini works with." },
  },
  {
    id: "awards",
    href: "/awards",
    title: "Awards",
    place: "The trophy room",
    kicker: "Silverware",
    summary: "Scholarships, awards and Make-A-Wish.",
    intro: "Scholarships and awards, and the story behind them.",
    scene: "room",
    side: "right",
    minute: "67'",
    matchEvent: "Trophy",
    listed: true,
    metadata: { title: "Awards", description: "Scholarships and awards earned by Ryan Rai Saini, and his work with Make-A-Wish Canada." },
  },
  {
    id: "news",
    href: "/news",
    title: "In the News",
    place: "The press room",
    kicker: "Press conference",
    summary: "TV, articles and NBA All-Star 2026.",
    intro: "Clippings, cameras and one very good weekend.",
    scene: "room",
    side: "right",
    minute: "78'",
    matchEvent: "Press",
    listed: true,
    metadata: { title: "In the News", description: "Ryan Rai Saini in the news: NBA.com, Hemophilia Ontario and Make-A-Wish Canada, with photos from NBA All-Star 2026." },
  },
  {
    id: "github",
    href: "/github",
    title: "GitHub",
    place: "The stands",
    kicker: "Crowd display",
    summary: "My contributions, held up by the crowd.",
    intro: "The main stand is holding up a year of my GitHub contributions.",
    scene: "bowl",
    side: "right",
    minute: "84'",
    matchEvent: "Crowd display",
    listed: true,
    metadata: { title: "GitHub", description: "Ryan Rai Saini's GitHub contributions, shown as a crowd card display." },
  },
  {
    id: "live",
    href: "/live",
    title: "Now",
    place: "The big screen",
    kicker: "Live",
    summary: "The time and weather in Brampton, and what I'm doing now.",
    intro: "Live from Brampton, Ontario.",
    scene: "bowl",
    side: "right",
    minute: "45'",
    matchEvent: "Half-time",
    listed: true,
    metadata: { title: "Now", description: "What Ryan Rai Saini is working on now, with live time and weather from Brampton, Ontario." },
  },
  {
    id: "resume",
    href: "/resume",
    title: "Résumé",
    place: "The ticket office",
    kicker: "Matchday programme",
    summary: "My résumé, to read here or download.",
    intro: "Pick up a programme on your way in.",
    scene: "room",
    side: "right",
    minute: "88'",
    matchEvent: "Programme",
    listed: true,
    metadata: { title: "Résumé", description: "Résumé of Ryan Rai Saini, Mathematics student at the University of Waterloo." },
  },
  {
    id: "contact",
    href: "/contact",
    title: "Contact",
    place: "The mixed zone",
    kicker: "Post-match",
    summary: "Email and LinkedIn.",
    intro: "Where players stop to talk on the way out. So do I.",
    scene: "room",
    side: "right",
    minute: "90'",
    matchEvent: "Full time",
    listed: true,
    metadata: { title: "Contact", description: "How to reach Ryan Rai Saini: email and LinkedIn." },
  },
];

const byId = new Map(sections.map((s) => [s.id, s]));

export function section(id: SectionId): Section {
  const found = byId.get(id);
  if (!found) throw new Error(`Unknown section: ${id}`);
  return found;
}

// The sections a visitor can travel to (everything but home)
export const places = sections.filter((s) => s.listed);

// The section a path belongs to: "/projects" -> projects
export function sectionForPath(pathname: string): Section | null {
  const clean = pathname.replace(/\/+$/, "") || "/";
  return sections.find((s) => s.href === clean) ?? null;
}

export function sectionMetadata(id: SectionId): Metadata {
  const s = section(id);
  return {
    title: s.metadata.title,
    description: s.metadata.description,
    alternates: { canonical: s.href },
  };
}

// The places in the order a match is played, for the flat view
export const matchOrder: SectionId[] = ["about", "projects", "experience", "live", "skills", "awards", "news", "github", "resume", "contact"];
