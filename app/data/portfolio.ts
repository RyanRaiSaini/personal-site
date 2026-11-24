// ------------------------------------------------------------------
// Every word on the site lives in this file.
//
// To change text, edit it here. The 3D stadium, the section panels,
// the flat "match view" and the résumé page all read from this data,
// so one edit updates all of them. See WHERE-TO-EDIT.md for a guide.
// ------------------------------------------------------------------

export type Link = { label: string; href: string };

export type Project = {
  id: string;
  title: string;
  kicker: string; // small line above the title: where and when
  summary: string; // one sentence: what it is
  description: string; // a short paragraph
  award?: string; // a prize it won, shown under the title
  features: string[]; // what it does, as short bullets
  role?: string; // what I did myself
  stats: { value: string; label: string }[];
  technologies: string[];
  links: Link[];
  status: "shipped" | "in-progress";
  minute: string; // the "match minute" shown next to the goal
  // pictures shown when the project is opened, the first one large
  // (files in public/projects/; width and height as saved)
  media?: ProjectPicture[];
};

export type ProjectPicture = { src: string; alt: string; caption: string; width: number; height: number };

export type Experience = {
  id: string;
  role: string;
  organization: string;
  organizationUrl?: string;
  team?: string; // department or programme
  location: string;
  start?: string; // leave both out to show no dates
  end?: string;
  kind: "work" | "leadership";
  summary: string;
  highlights: string[];
};

export type Award = {
  id: string;
  title: string;
  // the name on its plaque in the trophy room: two short lines at most
  plaque: [string, string];
  from?: string;
  amount?: string;
  year?: string;
  note: string;
};

export type SkillGroup = {
  category: string;
  skills: string[];
};

export type SquadPlayer = {
  number: number;
  name: string; // the tool, as printed on the shirt
  position: "GK" | "DF" | "MF" | "FW";
  x: number; // 0 (left touchline) to 100 (right), for the tactics board
  y: number; // 0 (own goal line) to 100 (opponent's)
};

export type NewsItem = {
  id: string;
  kind: "video" | "article" | "profile" | "social";
  outlet: string;
  title: string;
  date: string; // as shown
  isoDate?: string;
  summary: string;
  href: string;
  cta: string;
};

export type Interest = {
  name: string;
  description: string;
};

export type Egg = {
  id: "penalty" | "corner" | "hala" | "var" | "fifteen" | "basketball" | "pass";
  name: string;
  hint: string;
};

// ------------------------------------------------------------------
// Who I am
// ------------------------------------------------------------------

export const profile = {
  name: "Ryan Rai Saini",
  shortName: "Ryan Saini",
  firstName: "Ryan",
  shirtName: "SAINI",
  shirtNumber: 8,
  headline: "Mathematics student at the University of Waterloo, working in artificial intelligence, computer vision and web development.",
  shortHeadline: "math@uwaterloo",
  seeking: "Seeking internship and co-op positions in software engineering, artificial intelligence and data.",
  location: "Brampton, Ontario",
  email: "ryansinquires@gmail.com",
  githubUser: "RyanRaiSaini",
  githubUrl: "https://github.com/RyanRaiSaini",
  linkedinUrl: "https://www.linkedin.com/in/ryanraisaini",
  linkedinHandle: "in/ryanraisaini",
  resumeUrl: "/resume/Ryan-Saini-Resume.pdf",
  siteRepoUrl: "https://github.com/RyanRaiSaini/personal-site",
  // The address the site is served from (used for link previews and the sitemap)
  siteUrl: "https://ryansaini.vercel.app",
} as const;

// ------------------------------------------------------------------
// About (the centre circle)
// ------------------------------------------------------------------

export const about = {
  paragraphs: [
    "I am a Mathematics student at the University of Waterloo with a focus on applied artificial intelligence. My work includes real-time computer vision, data workflows that reduce manual research, and web development.",
    "In the summer of 2026, I was an AI Data Engineer Intern at BHive, Brampton's innovation hub, where I developed a research workflow that screened more than 6,000 local companies. In November 2026, I led a team of four at HackUMass XIV to build Empyrean, smart glasses that identify objects by touch for blind and low-vision users.",
    "Outside my studies, I serve on STARboard, Make-A-Wish Canada's national youth advisory board, and work in logistics and operations for Bleeding Disorders Canada.",
  ],
  factsTitle: "Profile",
  facts: [
    { label: "School", value: "University of Waterloo" },
    { label: "Degree", value: "Honours Bachelor of Mathematics" },
    { label: "Graduating", value: "Fall 2031 (expected)" },
    { label: "Based in", value: "Brampton, Ontario" },
    { label: "Seeking", value: "Internship and co-op positions" },
  ],
  courseworkTitle: "Current coursework",
  coursework: ["Designing Programs (CS135)", "Algebra (MATH135)", "Calculus 1 (MATH137)", "Microeconomics (EC120)"],
  interestsTitle: "Interests",
  // the two buttons at the end
  projectsButton: "View projects",
  resumeButton: "Résumé",
};

export const interests: Interest[] = [
  {
    name: "Football",
    description: "A long-standing Real Madrid supporter. My favourite player\u2019s old number, 66, is somewhere in this stadium.",
  },
  {
    name: "Basketball",
    description: "A lifelong follower of the NBA. In 2026, I attended NBA All-Star weekend through Make-A-Wish.",
  },
  {
    name: "Sports analytics",
    description: "The application of mathematics and data to sport.",
  },
  {
    name: "Community",
    description: "Long-standing involvement with Make-A-Wish Canada and the bleeding disorders community.",
  },
];

// ------------------------------------------------------------------
// Projects (the goal). Each project is a goal scored.
// ------------------------------------------------------------------

export const projectText = {
  // the label beside each project's match minute
  goal: "Goal",
  // the two halves an open project is split into
  overviewTab: "Overview",
  resultsTab: "My role and results",
  role: "My role",
  builtWith: "Built with",
};

export const projects: Project[] = [
  {
    id: "empyrean",
    title: "Empyrean",
    kicker: "HackUMass XIV · November 2026 · Team of four",
    award: "Winner of the “Build Your Hackathon A-Team with SpaceXSI” prize at HackUMass XIV",
    summary: "Smart glasses that identify what blind and low-vision users are touching.",
    description:
      "A camera mounted on the glasses tracks the wearer's fingertips. When the wearer touches an object, a speaker identifies it by name and brand, for example “Heinz ketchup” rather than “bottle”. The team built Empyrean in 36 hours at HackUMass XIV in Amherst, Massachusetts.",
    features: [
      "Tracks the wearer's fingertips and identifies each object touched, including its brand.",
      "Issues an audible warning when the wearer approaches stairs, a drop or a vehicle.",
      "Maintains a touch history, so the wearer can ask where an object was last handled.",
      "Provides offline speech output and a live monitoring dashboard.",
      "Runs as a 10-module real-time pipeline.",
    ],
    role: "I led the team of four, developed the speech output and the live dashboard, collected training and test images, tested the complete system on physical hardware, and delivered the final presentation to the SpaceX and Gemini track judges.",
    stats: [
      { value: "90%", label: "brand identification accuracy" },
      { value: "< 0.5 s", label: "response time" },
      { value: "36 hours", label: "from start to finish" },
    ],
    technologies: ["Python", "PyTorch", "YOLO11", "MediaPipe", "OpenCV", "Grok Vision", "FastAPI", "Tiger Data"],
    links: [{ label: "Code on GitHub", href: "https://github.com/richardlancs/Empyrean" }],
    status: "shipped",
    minute: "23'",
    media: [
      {
        src: "/projects/empyrean-touch.webp",
        alt: "The Empyrean dashboard. The camera view shows a ketchup bottle boxed in green and labelled “Touching Heinz ketchup”, with a coffee cup beside it; above, the dashboard shows “Heinz ketchup” in large type and that the name was spoken.",
        caption: "The live dashboard I built: the wearer touches a bottle, the system names it by brand and says it aloud.",
        width: 1200,
        height: 780,
      },
      {
        src: "/projects/empyrean-hazard.webp",
        alt: "The Empyrean dashboard showing an active warning, “Vehicle: the hazard check reported a possible vehicle approaching”, above the object being touched.",
        caption: "A hazard warning on the dashboard: a vehicle approaching, flagged while the wearer is holding an object.",
        width: 1200,
        height: 574,
      },
    ],
  },
  {
    id: "bhive-registry",
    title: "BHive Summer Internship",
    kicker: "City of Brampton, Economic Development Office · Summer 2026",
    summary: "An AI-assisted research workflow that screened more than 6,000 Brampton companies and organized the results into a shared, searchable registry.",
    description:
      "BHive needed to identify which local companies matched its projects and sales priorities. I developed a research and filtering workflow that assessed more than 6,000 Brampton companies and organized the findings for use by the whole team.",
    features: [
      "Screens companies against the criteria of each project using AI-assisted research.",
      "Records the industry, estimated headcount, revenue and supporting sources for each company.",
      "Allows team members to filter prospects and prepare project-specific outreach lists.",
      "Documented in Google Sheets and standard operating procedures, so that the process can be repeated.",
    ],
    role: "I designed and developed the workflow, the registry and its documentation during my internship. As an internal tool, its source code is not public.",
    stats: [
      { value: "6,000+", label: "companies screened" },
      { value: "50+", label: "startups onboarded" },
      { value: "10+", label: "in-person events supported" },
    ],
    technologies: ["Python", "Java", "Excel", "Google Sheets"],
    links: [{ label: "About BHive", href: "https://thebhive.ca/" }],
    status: "shipped",
    minute: "45+2'",
    media: [
      {
        src: "/projects/bhive-workflow.webp",
        alt: "A five-step diagram: 6,000+ Brampton companies, then AI-assisted screening against each project's criteria, then one record per company with industry, headcount, revenue and sources, then a shared registry in Google Sheets, then outreach lists for each project.",
        caption: "How the workflow runs, from a list of local companies to outreach lists. A diagram: the tool itself is internal.",
        width: 1200,
        height: 420,
      },
    ],
  },
  {
    id: "personal-site",
    title: "Personal Website",
    kicker: "Personal project · In progress",
    summary: "This portfolio: an interactive 3D football stadium in which each area presents a section of my work.",
    description: "A personal project. The stadium is modelled to scale in Blender and drawn in the browser with Three.js.",
    features: [],
    stats: [],
    technologies: ["Next.js", "React", "TypeScript", "Three.js", "React Three Fiber", "Blender", "Python", "Tailwind CSS", "Vercel"],
    links: [{ label: "Code on GitHub", href: "https://github.com/RyanRaiSaini/personal-site" }],
    status: "in-progress",
    minute: "67'",
    media: [
      {
        src: "/projects/site-overview.webp",
        alt: "The 3D stadium from high in the stands: a full crowd round a striped pitch under a partly open roof.",
        caption: "The stadium, modelled to scale in Blender and drawn live in the browser, crowd and all.",
        width: 1200,
        height: 675,
      },
      {
        src: "/projects/site-goal.webp",
        alt: "Number 8 in a white kit has just struck the ball; the goalkeeper dives as it flies into the top corner of the net.",
        caption: "Opening a project replays a goal, each into a different corner of the net.",
        width: 1200,
        height: 675,
      },
      {
        src: "/projects/site-ticket-office.webp",
        alt: "The ticket office: fans queuing at two lit windows, my framed résumé between them, scarves on the club shop wall.",
        caption: "The ticket office, where the résumé hangs between the windows.",
        width: 1200,
        height: 675,
      },
      {
        src: "/projects/site-dressing-room.webp",
        alt: "The dressing room: wooden lockers with numbered white shirts, boots beneath, a tactics board on the wall.",
        caption: "The dressing room, home of the Skills section.",
        width: 1200,
        height: 675,
      },
    ],
  },
];

// ------------------------------------------------------------------
// Experience (the dugout). Each role is a signing.
// ------------------------------------------------------------------

export const experienceText = {
  // the word before a role's dates
  work: "Signed",
  leadership: "Captaincy",
  // opens the rest of a role's points; {n} is how many there are in all
  more: "Show all {n} points",
};

export const experience: Experience[] = [
  {
    id: "bhive",
    role: "AI Data Engineer Intern",
    organization: "BHive",
    organizationUrl: "https://thebhive.ca/",
    team: "City of Brampton, Economic Development Office",
    location: "Brampton, ON",
    start: "June 2026",
    end: "August 2026",
    kind: "work",
    summary: "A summer 2026 internship at BHive, Brampton's innovation hub, established with the City of Brampton to support founders, startups and established businesses.",
    highlights: [
      "Developed an AI-assisted research and filtering workflow using Python, Java and Excel to screen 6,000+ Brampton companies and identify prospects for BHive projects and sales priorities.",
      "Organized company research into a shared registry with industry, estimated headcount, revenue and sources, so that team members could filter prospects and build project-specific outreach lists.",
      "Prepared Google Sheets documenting BHive's internal project work and its categorization, and wrote standard operating procedures so that the process can be repeated.",
      "Evaluated technology vendors across construction, healthcare, manufacturing and trucking, and supported exploratory discussions with Procore, Rockwell Automation and SOTI through research, demonstrations and follow-ups.",
      "Created a personalized email outreach program and supported onboarding for 50+ startups, coordinating introductions, follow-ups and program information.",
      "Identified and engaged startup founders and senior leaders of small and medium-sized businesses as attendees for 10+ in-person events planned for 2026 to 2029, and introduced prospective partners to BHive's partnership program, including discussions of sponsorships valued at $100,000 or more.",
    ],
  },
  {
    id: "bleeding-disorders-canada",
    role: "Logistics and Operations",
    organization: "Bleeding Disorders Canada",
    team: "Permanent part-time",
    location: "Ontario",
    start: "October 2024",
    end: "Present",
    kind: "work",
    summary: "Logistics, events and communications for families living with bleeding disorders.",
    highlights: [
      "Coordinated large-scale community events, including the “Just the Dads” weekend for 50+ families, managing logistics and allocating $7,500 in funding from Bayer, Pfizer and local nonprofits.",
      "Wrote and distributed website articles and community stories for more than 150 families and sponsors.",
      "Produced marketing materials and public calls for 125+ vendors, and coordinated sponsor communications and sponsorship arrangements.",
    ],
  },
  {
    id: "make-a-wish",
    role: "Youth Advisory Board Member",
    organization: "Make-A-Wish Canada",
    organizationUrl: "https://makeawish.ca/about-us/our-people/starboard/",
    team: "STARboard",
    location: "Toronto, ON",
    // no dates are shown for this role, at my request
    kind: "leadership",
    summary: "A member of STARboard, Make-A-Wish Canada's national youth advisory board of wish recipients.",
    highlights: [
      "Selected to represent youth wish recipients across Canada, advising Make-A-Wish Canada on the needs of young people and their families.",
      "Spoke with more than 100 sponsors and contributed to fundraising events that raised more than $50,000 for wishes.",
      "Supported event safety protocols and assisted wish children and their families at Make-A-Wish events.",
    ],
  },
];

// ------------------------------------------------------------------
// Awards and Make-A-Wish (the trophy room)
// ------------------------------------------------------------------

export const awards: Award[] = [
  {
    id: "john-plater",
    title: "John Plater Scholarship",
    plaque: ["John Plater", "Scholarship"],
    from: "Hemophilia Ontario",
    amount: "$8,000",
    note: "Awarded to students in Ontario's bleeding disorders community.",
  },
  {
    id: "presidents-scholarship",
    title: "President's Scholarship of Distinction",
    plaque: ["President's", "Scholarship"],
    from: "University of Waterloo",
    amount: "$4,000",
    note: "Entrance scholarship for top incoming students.",
  },
  {
    id: "leader-of-tomorrow",
    title: "Leader of Tomorrow Canada Hemophilia Award",
    plaque: ["Leader of", "Tomorrow"],
    note: "For leadership in the hemophilia community.",
  },
  {
    id: "starboard",
    title: "STARboard selection",
    plaque: ["STARboard", "Selection"],
    from: "Make-A-Wish Canada",
    note: "Chosen for the national youth advisory board of wish recipients.",
  },
];

export const makeAWish = {
  // the names of the section's two tabs
  awardsTab: "Awards",
  storyTab: "Make-A-Wish and the NBA",
  paragraphs: [
    "I live with severe Type 3 von Willebrand disease, a rare bleeding disorder. Throughout my childhood, I was often advised to sit out of sports rather than encouraged to take part.",
    "In February 2026, I was selected for a Make-A-Wish experience at NBA All-Star weekend. I took part in NBA Cares programming, Media Day, the Rising Stars game and the Celebrity Game, and interviewed Kevin Durant, Shai Gilgeous-Alexander, Adam Silver and Magic Johnson.",
    "Afterwards, I wrote a first-person account of the experience for Hemophilia Ontario, which distributed the article to more than 50 sponsors and partners, including Bayer and Pfizer. I now serve on STARboard, Make-A-Wish Canada's national youth advisory board, where I have spoken with more than 100 sponsors and contributed to fundraising events that raised more than $50,000 for wishes.",
  ],
  quote: {
    text: "Those challenges don't define my limits.",
    source: "From my article for Hemophilia Ontario",
  },
  stats: [
    { value: "100+", label: "sponsors engaged" },
    { value: "$50,000+", label: "raised for wishes" },
    { value: "50+", label: "sponsors and partners sent my article" },
  ],
  board: {
    name: "STARboard, Make-A-Wish Canada",
    note: "A national advisory board of young people whose wishes were granted.",
    link: "View the board",
  },
  photosButton: "Photos and press",
  // the two organisations' logos, at the top of the tab (public/logos;
  // sources in docs/redesign/ASSETS.md)
  logos: [
    { src: "/logos/make-a-wish.png", alt: "Make-A-Wish", width: 900, height: 251 },
    { src: "/logos/nba.svg", alt: "NBA", width: 915, height: 2079 },
  ],
  starboardUrl: "https://makeawish.ca/about-us/our-people/starboard/",
};

// ------------------------------------------------------------------
// In the news (the press room)
// ------------------------------------------------------------------

export const news: NewsItem[] = [
  {
    id: "nba-video",
    kind: "video",
    outlet: "NBA.com",
    title: "Make-A-Wish at NBA All-Star 2026",
    date: "March 5, 2026",
    isoDate: "2026-03-05",
    summary: "The NBA's behind-the-scenes film of Make-A-Wish families at NBA All-Star 2026, in which I appear.",
    href: "https://www.nba.com/watch/video/make-a-wish-at-nba-all-star-2026",
    cta: "Watch on NBA.com",
  },
  {
    id: "hemophilia-ontario-story",
    kind: "article",
    outlet: "Hemophilia Ontario",
    title: "My Make-A-Wish Moment with the NBA: Ryan's Story",
    date: "April 17, 2026",
    isoDate: "2026-04-17",
    summary: "My first-person account of growing up with a bleeding disorder, of inclusion in sport, and of my experience at NBA All-Star 2026.",
    href: "https://www.hemophilia.on.ca/hemophilia/the-collab-of-a-lifetime-when-the-nba-and-hemophilia-connect/",
    cta: "Read the article",
  },
  {
    id: "starboard-profile",
    kind: "profile",
    outlet: "Make-A-Wish Canada",
    title: "STARboard: Young Voices, Big Impact",
    date: "2026",
    summary: "My profile as a member of STARboard, Make-A-Wish Canada's national youth advisory board of wish recipients aged 13 to 18.",
    href: "https://makeawish.ca/about-us/our-people/starboard/",
    cta: "View the board",
  },
  {
    id: "instagram-post",
    kind: "social",
    outlet: "NBA Cares on Instagram",
    title: "Rising Stars x Make-A-Wish",
    date: "February 18, 2026",
    isoDate: "2026-02-18",
    summary: "NBA Cares' post on the Rising Stars and Make-A-Wish event at NBA All-Star 2026.",
    href: "https://www.instagram.com/p/DU6guPKkYb2/",
    cta: "View the post",
  },
];

export const pressRoom = {
  // the names of the section's two tabs
  coverageTab: "Coverage",
  photosTab: "Photos",
  intro: "Media coverage of my Make-A-Wish weekend at NBA All-Star 2026.",
  albumTitle: "NBA All-Star 2026",
  albumNote: "Photos from my Make-A-Wish weekend at NBA All-Star 2026.",
  // A second line from the same published article. The Awards section
  // carries a different one, so no quote appears twice.
  quote: {
    text: "For the first time, I wasn't watching from the sidelines or through a screen. I was there, part of the moment.",
    source: "From my article for Hemophilia Ontario",
  },
};

// ------------------------------------------------------------------
// Skills (the dressing room)
// ------------------------------------------------------------------

export const skillsText = {
  // the names of the section's two tabs
  elevenTab: "Starting eleven",
  allTab: "All skills",
  elevenNote: "The tools I use most, set out in a 4-3-3.",
  bench: "On the bench",
};

export const skillGroups: SkillGroup[] = [
  {
    category: "Languages",
    skills: ["Python", "Java", "TypeScript", "JavaScript", "HTML/CSS", "Racket"],
  },
  {
    category: "Frameworks and libraries",
    skills: ["PyTorch", "Ultralytics YOLO", "OpenCV", "MediaPipe", "FastAPI", "React", "Next.js", "Tailwind CSS", "Three.js", "pandas", "NumPy"],
  },
  {
    category: "Tools and platforms",
    skills: ["Git and GitHub", "Vercel", "Cursor", "Claude Code", "Codex", "Roboflow", "Excel", "Power BI", "Adobe CC"],
  },
];

// The starting eleven, in a 4-3-3. These are the shirts hanging in the
// dressing room and the dots on the tactics board.
export const squad: SquadPlayer[] = [
  { number: 1, name: "Git", position: "GK", x: 50, y: 6 },
  { number: 2, name: "HTML/CSS", position: "DF", x: 86, y: 26 },
  { number: 4, name: "Java", position: "DF", x: 62, y: 20 },
  { number: 5, name: "JavaScript", position: "DF", x: 38, y: 20 },
  { number: 3, name: "FastAPI", position: "DF", x: 14, y: 26 },
  { number: 6, name: "OpenCV", position: "MF", x: 50, y: 42 },
  { number: 8, name: "React", position: "MF", x: 72, y: 54 },
  { number: 10, name: "TypeScript", position: "MF", x: 28, y: 54 },
  { number: 7, name: "PyTorch", position: "FW", x: 84, y: 78 },
  { number: 9, name: "Python", position: "FW", x: 50, y: 86 },
  { number: 11, name: "Next.js", position: "FW", x: 16, y: 78 },
];

export const bench: string[] = ["YOLO", "MediaPipe", "Three.js", "Tailwind CSS", "pandas", "NumPy", "Racket"];

// ------------------------------------------------------------------
// Now (the big screen)
// ------------------------------------------------------------------

export const now = {
  weatherTitle: "Weather in {city}",
  weatherNote: "The stadium's weather follows Brampton's. Weather data from Open-Meteo.",
  weatherLoading: "Loading the weather for Brampton…",
  roofTitle: "The roof",
  // {state} becomes "open" or "closed"
  roofNote: "The roof is this site's light and dark switch. It is currently {state}.",
  currentTitle: "Currently",
  building: {
    label: "Current project",
    value: "This website",
    detail: "A stadium modelled in Blender and drawn with Three.js.",
  },
  studying: {
    label: "Studying",
    value: "First year at Waterloo",
    detail: "Programming, algebra, calculus and microeconomics.",
  },
  seeking: {
    label: "Seeking",
    value: "Internships and co-ops",
    detail: "Software engineering, artificial intelligence and data.",
  },
  homeCity: { name: "Brampton", timeZone: "America/Toronto", latitude: 43.7315, longitude: -79.7624 },
  awayCity: { name: "Madrid", timeZone: "Europe/Madrid" },
};

// ------------------------------------------------------------------
// GitHub (the stands), Résumé (the ticket office), Contact (the mixed zone)
// ------------------------------------------------------------------

export const githubText = {
  lead: "The last four weeks, a square a day.",
  body: "The number in a square is that day's contributions; the brighter the green, the busier the day. The scoreboard on the main stand shows the same.",
  saved: "GitHub is temporarily unavailable. A saved copy is shown.",
  // the figures above the chart
  total: "contributions in the last year",
  active: "days with a commit",
  best: "most in one day",
  // how many recent weeks the chart and the scoreboard show
  recentWeeks: 4,
  // the calendar's column heads, Sunday first, as GitHub counts weeks
  dayHeads: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  // the scoreboard hung under the main stand's second tier
  board: {
    title: "GitHub",
    total: "Contributions this year",
    best: "Best day",
    active: "Active days",
    recent: "Last 4 weeks",
    loading: "Loading contributions",
  },
};

export const resumeText = {
  download: "Download PDF",
  open: "Open in a new tab",
  note: "A complete copy, including my telephone number, is available on request.",
  // the ticket office: the lit sign over the windows, the windows' signs,
  // the player profile, and the board of numbers from the résumé
  sign: "Ticket office",
  windowSign: "Open",
  profileTitle: "Player profile",
  stats: {
    title: "Season stats",
    items: [
      { value: "6,000+", label: "companies screened" },
      { value: "50+", label: "startups onboarded" },
      { value: "25,000+", label: "lines in 36 hours" },
      { value: "$50,000+", label: "raised for wishes" },
    ],
  },
  // the matchday board hanging from the ceiling
  board: {
    heading: "Today's fixture",
    fixture: "The Résumé Issue",
    gate: "Gate A  ·  Programmes on sale now",
  },
};

// The panel's footer: the way back to the whole stadium, which is also
// where the last section leads
export const panelText = {
  stadium: "Stadium",
};

export const contactText = {
  // the flash-interview spot by the tunnel: the boards on the grass
  zone: { email: "Email", linkedin: "LinkedIn", backdrop: "Contact" },
  lead: "Email is the most reliable way to reach me.",
  email: "Email",
  linkedin: "LinkedIn",
  copy: "Copy email address",
  copied: "Copied",
  basedIn: "Based in {location}.",
};

// ------------------------------------------------------------------
// The flat match view's own lines
// ------------------------------------------------------------------

export const matchText = {
  fullTime: "Full time",
  thanks: "Thank you for visiting.",
  tourNote: "On a larger screen, this site is a 3D stadium that can be explored.",
};

// ------------------------------------------------------------------
// Easter eggs. The 3D world reports each one here when it is found.
// These keep their playful wording: they are hidden extras.
// ------------------------------------------------------------------

export const eggs: Egg[] = [
  { id: "penalty", name: "From the spot", hint: "Something is waiting on a penalty spot." },
  { id: "corner", name: "Corner specialist", hint: "One of the corner flags is worth a click." },
  { id: "hala", name: "Hala!", hint: "Type the first word of the anthem, anywhere." },
  { id: "var", name: "VAR check", hint: "Visit a page that does not exist." },
  { id: "fifteen", name: "La Decimoquinta", hint: "The trophy cabinet likes attention. Fifteen clicks of it." },
  { id: "basketball", name: "Wrong sport", hint: "Someone left a basketball in the press room." },
  { id: "pass", name: "Number 66", hint: "A shirt has been left on a seat in the dugout." },
];

// ------------------------------------------------------------------
// The home screen's buttons and its one line of help
// ------------------------------------------------------------------

export const home = {
  projects: "View projects",
  tour: "Start the tour",
  resume: "Résumé",
  contact: "Contact",
  hint: "Drag to look around. Click a sign to go there.",
  // the start screen, shown once per visit before the walk out of the tunnel
  startNote: "A short walk out of the players' tunnel, then each section in turn.",
  skipStart: "Skip to the stadium",
  // opens the small print
  credits: "Credits and small print",
};

// ------------------------------------------------------------------
// Words on the page's own controls
// ------------------------------------------------------------------

export const shell = {
  loading: "Opening the gates",
  // shown if the stadium has not appeared after a while
  loadingSlow: "Taking a while? Everything here is in the flat view too.",
  openFlat: "Open the flat view",
  skipIntro: "Skip the walk-out",
};

// ------------------------------------------------------------------
// Small print
// ------------------------------------------------------------------

export const colophon = {
  built: "Designed and developed by Ryan Rai Saini using Next.js, React Three Fiber, TypeScript and Blender.",
  // Required by the licence of the scan the stadium's measurements came from, and a thank-you for the free textures
  credits: "Stadium proportions measured from “Estadio Santiago Bernabéu, Madrid” by DALGO (CC BY 4.0). Surfaces and sky from Poly Haven (CC0).",
  disclaimer: "An independent personal project. Not affiliated with or endorsed by Real Madrid C.F., the NBA or any individual named.",
};
