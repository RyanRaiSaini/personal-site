// ------------------------------------------------------------------
// My résumé, as data. The résumé page on the site and the PDF people
// download are both made from this file, so they can never disagree.
//
// **Double asterisks** make text bold.
//
// After changing anything here, rebuild the PDF:
//     npm run resume
//
// There is deliberately no phone number: this copy is public.
// ------------------------------------------------------------------

export type ResumeEntry = {
  title: string; // bold, left
  date: string; // right
  subtitle: string; // italic, left
  location: string; // italic, right
  bullets: string[];
};

export type ResumeSection = {
  heading: string;
  entries: ResumeEntry[];
};

export const resume = {
  name: "Ryan Rai Saini",
  contact: [
    { text: "ryansinquires@gmail.com", href: "mailto:ryansinquires@gmail.com" },
    { text: "github.com/RyanRaiSaini", href: "https://github.com/RyanRaiSaini" },
    { text: "linkedin.com/in/ryanraisaini", href: "https://www.linkedin.com/in/ryanraisaini" },
    { text: "Brampton, ON", href: "" },
  ],
  sections: [
    {
      heading: "Education",
      entries: [
        {
          title: "University of Waterloo",
          date: "Waterloo, ON",
          subtitle: "Honours Bachelor of Mathematics",
          location: "Expected Completion: Fall 2031",
          bullets: [],
        },
      ],
    },
    {
      heading: "Experience",
      entries: [
        {
          title: "AI Data Engineer Intern (BHive)",
          date: "June 2026 – August 2026",
          subtitle: "City of Brampton, Economic Development Office",
          location: "Brampton, ON",
          bullets: [
            "Developed an AI-assisted research and filtering workflow using Python, Java and Excel to screen **6,000+** Brampton companies and identify prospects aligned with BHive projects and sales priorities",
            "Structured company research into a shared registry with industry, estimated headcount, revenue and sources, letting team members filter prospects and build project-specific outreach lists",
            "Evaluated technology vendors across construction, healthcare, manufacturing and trucking; supported exploratory discussions with **Procore, Rockwell Automation and SOTI** through research, demos and follow-ups",
            "Created a personalized email outreach program sending **300+ emails** and supported onboarding for **50+ startups**, coordinating introductions, follow-ups and program information",
          ],
        },
        {
          title: "Logistics & Operations (Permanent Part-Time)",
          date: "October 2024 – Present",
          subtitle: "Bleeding Disorders Canada",
          location: "Ontario",
          bullets: [
            "Coordinated large-scale community events, including the “Just the Dads” weekend for **50+** families, managing logistics and allocating **$7,500** in funding from **Bayer, Pfizer** and local nonprofits",
            "Wrote and distributed website articles and community stories, translating organizational initiatives into clear, engaging content for over **150** families and sponsors",
            "Produced marketing materials and public calls for **125+** vendors; coordinated sponsor communications and sponsorship arrangements to connect community programs with external partners",
          ],
        },
      ],
    },
    {
      heading: "Projects",
      entries: [
        {
          title: "Empyrean | Python, PyTorch, YOLO11, MediaPipe, OpenCV, Grok Vision, FastAPI",
          date: "November 2026",
          subtitle: "HackUMass XIV, 36-hour in-person hackathon",
          location: "Amherst, MA",
          bullets: [
            "Led a team of four to build **AI-powered smart glasses** for blind and low-vision users that track the wearer’s fingertips and announce exactly what they touch, down to the brand (“Heinz ketchup”, not “bottle”)",
            "Architected a **10-module real-time vision pipeline**; fine-tuned YOLO11 on 8 custom objects to **0.885 mAP50** and reached **90% brand-level accuracy** (54/60) at a **435 ms** median naming time with Grok Vision",
            "Shipped **25,000+ lines** of Python across **210+ commits** and **32 merged PRs**, backed by **330+ automated tests**; delivered the entire final pitch to the **SpaceX** and **Gemini** track judges",
          ],
        },
      ],
    },
    {
      heading: "Leadership",
      entries: [
        {
          title: "Youth Advisory Board Member",
          date: "August 2026 – Present",
          subtitle: "Make-A-Wish Canada, STARboard",
          location: "Toronto, ON",
          bullets: [
            "Selected to represent youth wish recipients on Make-A-Wish Canada’s national advisory board, speaking with **100+ sponsors** and contributing to fundraising events that raised **$50,000+** for wishes",
            "Selected for a Make-A-Wish experience at NBA All-Star 2026, interviewing **Kevin Durant, Shai Gilgeous-Alexander, Adam Silver** and **Magic Johnson**, and published a first-person story on sports inclusion for Hemophilia Ontario",
          ],
        },
      ],
    },
  ] as ResumeSection[],
  skills: [
    { label: "Languages", value: "Python, Java, TypeScript, HTML/CSS, Racket" },
    { label: "Frameworks & Libraries", value: "PyTorch, Ultralytics YOLO, OpenCV, MediaPipe, FastAPI, React, Next.js, pandas" },
    { label: "Tools & Platforms", value: "Git/GitHub, Vercel, Cursor, Claude Code, Codex, Roboflow, Excel, Power BI, Adobe CC" },
    { label: "Coursework", value: "Designing Programs (CS135), Algebra (MATH135), Calculus 1 (MATH137), Microeconomics (EC120)" },
    { label: "Awards", value: "John Plater Scholarship ($8,000), President’s Scholarship of Distinction ($4,000), Leader of Tomorrow Canada Hemophilia Award" },
  ],
  pdf: {
    file: "Ryan-Saini-Resume.pdf",
    title: "Ryan Rai Saini – Résumé",
  },
};
