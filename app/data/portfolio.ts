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
  features: string[]; // what it does, as short bullets
  role?: string; // what I did myself
  stats: { value: string; label: string }[];
  technologies: string[];
  links: Link[];
  status: "shipped" | "in-progress";
  minute: string; // the "match minute" shown next to the goal
};

export type Experience = {
  id: string;
  role: string;
  organization: string;
  organizationUrl?: string;
  team?: string; // department or programme
  location: string;
  start: string;
  end: string;
  kind: "work" | "leadership";
  summary: string;
  highlights: string[];
  tags: string[];
};

export type Award = {
  id: string;
  title: string;
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
  id: "jude" | "mbappe" | "hala" | "var" | "fifteen" | "basketball" | "trent";
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
  headline: "Mathematics at the University of Waterloo. I build AI, computer vision and web projects.",
  shortHeadline: "math@uwaterloo",
  seeking: "Looking for software engineering, AI and data internships and co-op roles.",
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
  greeting: "Hi, I'm Ryan.",
  paragraphs: [
    "I'm a Mathematics student at the University of Waterloo who likes building things with AI: computer vision that runs in real time, data workflows that save a team hours, and web projects like this stadium.",
    "In summer 2026 I worked as an AI Data Engineer Intern at BHive, Brampton's innovation hub, where I built a research workflow that screened more than 6,000 local companies. That November I led a team of four at HackUMass XIV to build Empyrean, smart glasses that tell blind and low-vision people exactly what they are touching.",
    "Away from the keyboard I sit on Make-A-Wish Canada's youth advisory board, help run community events with Bleeding Disorders Canada, and watch far too much football and basketball.",
  ],
  facts: [
    { label: "School", value: "University of Waterloo" },
    { label: "Degree", value: "Honours Bachelor of Mathematics" },
    { label: "Graduating", value: "Fall 2031 (expected)" },
    { label: "Based in", value: "Brampton, Ontario" },
    { label: "Shirt number", value: "8" },
    { label: "Open to", value: "Internships and co-ops" },
  ],
  coursework: ["Designing Programs (CS135)", "Algebra (MATH135)", "Calculus 1 (MATH137)", "Microeconomics (EC120)"],
};

export const interests: Interest[] = [
  {
    name: "Football",
    description: "Real Madrid, every match. My favourite player of all time is Trent Alexander-Arnold, which explains a locker somewhere in this stadium.",
  },
  {
    name: "Basketball",
    description: "A lifelong NBA fan. In 2026 Make-A-Wish sent me to All-Star weekend, and I still haven't fully recovered.",
  },
  {
    name: "Sports analytics",
    description: "Where the maths degree and the sports obsession meet.",
  },
  {
    name: "Community",
    description: "Make-A-Wish Canada and the bleeding disorders community, both of which shaped who I am.",
  },
];

// ------------------------------------------------------------------
// Projects (the goal). Each project is a goal scored.
// ------------------------------------------------------------------

export const projects: Project[] = [
  {
    id: "empyrean",
    title: "Empyrean",
    kicker: "HackUMass XIV · November 2026 · Team of four",
    summary: "AI-powered smart glasses that tell blind and low-vision people exactly what they are touching.",
    description:
      "A camera on a pair of glasses tracks the wearer's fingertips. When a hand lands on an object, a speaker says exactly what it is, down to the brand: \"Heinz ketchup\", not \"bottle\". We built it in 36 hours at HackUMass XIV in Amherst, Massachusetts.",
    features: [
      "Follows the wearer's fingertips and names whatever they touch, down to the brand.",
      "Sounds an alarm when the wearer walks toward stairs, a drop or a vehicle.",
      "Keeps a touch history, so you can ask \"where did I last touch the ketchup?\"",
      "Speaks with offline voices and shows everything on a live dashboard.",
      "Runs as a 10-module real-time pipeline with 330+ automated tests.",
    ],
    role: "I led the team, built the voice output and the live dashboard, collected training and test images for new objects, tested the full system with a real camera and speaker, and gave the final pitch to the SpaceX and Gemini track judges.",
    stats: [
      { value: "0.885", label: "mAP50 on 8 custom objects" },
      { value: "54/60", label: "brands named correctly" },
      { value: "435 ms", label: "median naming time" },
      { value: "330+", label: "automated tests" },
    ],
    technologies: ["Python", "PyTorch", "YOLO11", "MediaPipe", "OpenCV", "Grok Vision", "FastAPI", "Tiger Data"],
    links: [{ label: "Code on GitHub", href: "https://github.com/richardlancs/Empyrean" }],
    status: "shipped",
    minute: "23'",
  },
  {
    id: "bhive-registry",
    title: "BHive Prospect Registry",
    kicker: "BHive internship · Summer 2026",
    summary: "An AI-assisted research workflow that screened 6,000+ Brampton companies and turned the results into a shared, filterable registry.",
    description:
      "BHive needed to know which local companies fit its projects and sales priorities. I built a research and filtering workflow that worked through more than 6,000 Brampton companies, then organised what it found so the whole team could use it.",
    features: [
      "Screens companies against each project's criteria with AI-assisted research.",
      "Records industry, estimated headcount, revenue and sources for every company.",
      "Lets teammates filter prospects and build an outreach list for a specific project.",
      "Documented in Google Sheets and step-by-step SOPs, so the process can be repeated.",
    ],
    role: "I designed and built the workflow, the registry and its documentation during my internship. It is an internal tool, so the code is not public.",
    stats: [
      { value: "6,000+", label: "companies screened" },
      { value: "300+", label: "outreach emails sent" },
    ],
    technologies: ["Python", "Java", "Excel", "Google Sheets"],
    links: [{ label: "About BHive", href: "https://thebhive.ca/" }],
    status: "shipped",
    minute: "45+2'",
  },
  {
    id: "personal-site",
    title: "This stadium",
    kicker: "Personal site · In progress",
    summary: "The portfolio you are looking at: a football stadium modelled entirely in code, where every part of the ground is a section.",
    description:
      "No downloaded 3D models. The stands, the roof, the crowd and the players are all generated from code with Three.js. The roof is the dark-mode switch, the weather is Brampton's real weather, and the crowd in the main stand holds up my GitHub contributions.",
    features: [
      "A real-time 3D stadium built from code with React Three Fiber.",
      "A retractable roof that doubles as the dark-mode switch.",
      "Live Brampton time and weather on the big screen. If it rains there, it rains here.",
      "A crowd card display generated from my GitHub contributions.",
      "A flat \"match view\" for phones and anyone who prefers plain pages.",
      "A few Easter eggs. Try the penalty spot.",
    ],
    stats: [
      { value: "0", label: "downloaded 3D models" },
      { value: "11", label: "places to visit" },
      { value: "7", label: "Easter eggs" },
    ],
    technologies: ["Next.js", "React", "TypeScript", "Three.js", "React Three Fiber", "Tailwind CSS", "Vercel"],
    links: [{ label: "Code on GitHub", href: "https://github.com/RyanRaiSaini/personal-site" }],
    status: "in-progress",
    minute: "67'",
  },
];

// ------------------------------------------------------------------
// Experience (the dugout). Each role is a signing.
// ------------------------------------------------------------------

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
    summary: "Summer 2026 internship at Brampton's innovation hub, created with the City of Brampton to support founders, start-ups and established businesses.",
    highlights: [
      "Built an AI-assisted research and filtering workflow in Python, Java and Excel that screened 6,000+ Brampton companies for BHive's projects and sales priorities.",
      "Turned the research into a shared registry with industry, estimated headcount, revenue and sources, so teammates could filter prospects and build outreach lists for each project.",
      "Built the Google Sheets that explain BHive's internal project work and how it is categorised, and wrote SOPs with AI tools so the process can be repeated.",
      "Evaluated technology vendors across construction, healthcare, manufacturing and trucking, and supported exploratory talks with Procore, Rockwell Automation and SOTI through research, calls, demos and follow-ups.",
      "Ran a personalised outreach programme of 300+ emails and helped onboard 50+ startups.",
    ],
    tags: ["Python", "Java", "Excel", "Google Sheets", "AI research"],
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
    summary: "Running community events and communications for families living with bleeding disorders.",
    highlights: [
      "Coordinated large community events, including the \"Just the Dads\" weekend for 50+ families, managing logistics and allocating $7,500 in funding from Bayer, Pfizer and local nonprofits.",
      "Wrote website articles and community stories read by 150+ families and sponsors.",
      "Produced marketing materials and public calls for 125+ vendors, and coordinated sponsor communications.",
    ],
    tags: ["Event logistics", "Writing", "Sponsor relations"],
  },
  {
    id: "make-a-wish",
    role: "Youth Advisory Board Member",
    organization: "Make-A-Wish Canada",
    organizationUrl: "https://makeawish.ca/about-us/our-people/starboard/",
    team: "STARboard",
    location: "Toronto, ON",
    start: "August 2026",
    end: "Present",
    kind: "leadership",
    summary: "Representing youth wish recipients on Make-A-Wish Canada's national advisory board.",
    highlights: [
      "Selected to represent youth wish recipients across Canada, advising Make-A-Wish on decisions and acting as an ambassador.",
      "Spoke with 100+ sponsors and contributed to fundraising events that raised $50,000+ for wishes.",
    ],
    tags: ["Leadership", "Public speaking", "Fundraising"],
  },
];

// ------------------------------------------------------------------
// Awards and Make-A-Wish (the trophy room)
// ------------------------------------------------------------------

export const awards: Award[] = [
  {
    id: "john-plater",
    title: "John Plater Scholarship",
    from: "Hemophilia Ontario",
    amount: "$8,000",
    note: "Awarded to students in Ontario's bleeding disorders community.",
  },
  {
    id: "presidents-scholarship",
    title: "President's Scholarship of Distinction",
    from: "University of Waterloo",
    amount: "$4,000",
    note: "Entrance scholarship for top incoming students.",
  },
  {
    id: "leader-of-tomorrow",
    title: "Leader of Tomorrow Canada Hemophilia Award",
    note: "For leadership in the hemophilia community.",
  },
  {
    id: "starboard",
    title: "STARboard selection",
    from: "Make-A-Wish Canada",
    year: "2026",
    note: "Chosen for the national youth advisory board of wish recipients.",
  },
];

export const makeAWish = {
  heading: "Make-A-Wish and the NBA",
  paragraphs: [
    "I live with severe Von Willebrand disease, Type 3, a rare bleeding disorder. Growing up, that often meant being told to sit out of sports instead of being encouraged to try.",
    "In February 2026 Make-A-Wish sent me to NBA All-Star weekend. I watched the Rising Stars, stood on the court at the Celebrity Game, and interviewed Kevin Durant, Shai Gilgeous-Alexander, Adam Silver and Magic Johnson. I also spoke with Kawhi Leonard at Media Day and met rising stars Stephon Castle, Dylan Harper, Ace Bailey and VJ Edgecombe.",
    "Afterwards I wrote about the weekend for Hemophilia Ontario. The story was shared with 50+ sponsors and partners, including Bayer and Pfizer. Today I sit on STARboard, Make-A-Wish Canada's youth advisory board, where I have spoken with 100+ sponsors and helped with events that raised $50,000+ for wishes.",
  ],
  quote: {
    text: "Those challenges don't define my limits.",
    source: "From my story for Hemophilia Ontario",
  },
  stats: [
    { value: "100+", label: "sponsors spoken with" },
    { value: "$50,000+", label: "raised for wishes" },
    { value: "50+", label: "sponsors read my story" },
  ],
  met: ["Kevin Durant", "Shai Gilgeous-Alexander", "Kawhi Leonard", "Adam Silver", "Magic Johnson", "Stephon Castle", "Dylan Harper", "Ace Bailey", "VJ Edgecombe"],
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
    summary: "The NBA's behind-the-scenes film of Make-A-Wish families meeting the 2026 All-Stars. I am in a lot of it.",
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
    summary: "My first-person story about growing up with a bleeding disorder, being treated differently in sports, and the weekend that changed how I see myself.",
    href: "https://www.hemophilia.on.ca/hemophilia/the-collab-of-a-lifetime-when-the-nba-and-hemophilia-connect/",
    cta: "Read the story",
  },
  {
    id: "starboard-profile",
    kind: "profile",
    outlet: "Make-A-Wish Canada",
    title: "STARboard: Young Voices, Big Impact",
    date: "2026",
    summary: "My profile on Make-A-Wish Canada's national youth advisory board, a group of wish recipients aged 13 to 18 from across the country.",
    href: "https://makeawish.ca/about-us/our-people/starboard/",
    cta: "See the board",
  },
  {
    id: "instagram-post",
    kind: "social",
    outlet: "NBA Cares on Instagram",
    title: "Rising Stars x Make-A-Wish",
    date: "February 18, 2026",
    isoDate: "2026-02-18",
    summary: "NBA Cares' post from the Rising Stars and Make-A-Wish meet-up at All-Star weekend.",
    href: "https://www.instagram.com/p/DU6guPKkYb2/",
    cta: "View the post",
  },
];

export const pressRoom = {
  intro: "A few times the cameras were pointed my way, and one time I was the one asking the questions.",
  albumTitle: "NBA All-Star 2026",
  albumNote: "Photos from my Make-A-Wish weekend at NBA All-Star 2026, shared with the NBA's permission.",
};

// ------------------------------------------------------------------
// Skills (the dressing room)
// ------------------------------------------------------------------

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
  building: {
    label: "Now building",
    value: "This stadium",
    detail: "My personal site, modelled in code with Three.js.",
  },
  studying: {
    label: "Studying",
    value: "First year at Waterloo",
    detail: "Programming, algebra, calculus and microeconomics.",
  },
  seeking: {
    label: "Open to",
    value: "Internships and co-ops",
    detail: "Software engineering, AI and data roles.",
  },
  // Scrolls around the big screen and the pitch-side boards
  ticker: ["RYAN RAI SAINI", "MATHEMATICS · UNIVERSITY OF WATERLOO", "PYTHON · TYPESCRIPT · PYTORCH", "OPEN TO INTERNSHIPS AND CO-OPS", "BRAMPTON, ONTARIO"],
  homeCity: { name: "Brampton", timeZone: "America/Toronto", latitude: 43.7315, longitude: -79.7624 },
  awayCity: { name: "Madrid", timeZone: "Europe/Madrid" },
};

// ------------------------------------------------------------------
// Easter eggs. The 3D world reports each one here when it is found.
// ------------------------------------------------------------------

export const eggs: Egg[] = [
  { id: "jude", name: "Hey Jude", hint: "Something is waiting on a penalty spot." },
  { id: "mbappe", name: "Corner specialist", hint: "One of the corner flags is worth a click." },
  { id: "hala", name: "Hala!", hint: "Type the first word of the anthem, anywhere." },
  { id: "var", name: "VAR check", hint: "Visit a page that does not exist." },
  { id: "fifteen", name: "La Decimoquinta", hint: "The trophy cabinet likes attention. Fifteen clicks of it." },
  { id: "basketball", name: "Wrong sport", hint: "Someone left a basketball in the press room." },
  { id: "trent", name: "Locker 66", hint: "One locker in the dressing room is not quite shut." },
];

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
  built: "Designed and built by Ryan Rai Saini with Next.js, React Three Fiber and TypeScript. The stadium, the crowd and the players are generated from code.",
  disclaimer: "A fan project. Not affiliated with or endorsed by Real Madrid C.F., the NBA or any player named here.",
};
