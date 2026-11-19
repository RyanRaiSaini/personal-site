# Ryan Rai Saini — Personal Site

My portfolio, set inside a real-time 3D football stadium. I'm a Mathematics student at the University of Waterloo looking for software engineering, AI and data internships and co-op roles. Every part of the ground is a section of the site: the goal is my projects, the dugout is my experience, the dressing room is my skills.

**Live site:** https://personal-site-olive-tau.vercel.app

## What's in it

| Place in the stadium | Section |
| --- | --- |
| The centre circle | About |
| The goal | Projects (each one is a goal, with a replay) |
| The dugout | Experience |
| The dressing room | Skills: a shirt on every peg |
| The trophy room | Awards and my Make-A-Wish story |
| The press room | In the News, with photos from NBA All-Star 2026 |
| The stands | GitHub: the crowd holds up my contribution graph |
| The big screen | Now: live Brampton time and weather |
| The ticket office | Résumé |
| The mixed zone | Contact |

## Highlights

- **A stadium modelled entirely in code.** The stands, roof, pitch, crowd and players are generated with Three.js. No 3D models, textures or audio files are downloaded: every texture is painted onto a canvas and every sound is synthesised in the browser.
- **The roof is the dark-mode switch.** Closing the retractable roof switches the site to its dark theme and turns the floodlights up. Left alone, the roof follows Brampton: shut at night and in rain or snow.
- **Live from Brampton.** The sun is where it really is over Brampton right now, and the weather comes from Open-Meteo. If it is snowing there, it snows through the open roof here.
- **A crowd card display of my GitHub contributions.** About 35,000 fans are drawn in a single call. The second tier of the main stand holds up a year of my contributions, read from GitHub's public calendar and refreshed hourly.
- **A camera tour with real addresses.** Each section has its own URL (`/projects`, `/skills`…) and its own page of real text, so it can be linked, searched and read by a screen reader. The 3D view flies between them.
- **A flat "match view".** Phones, browsers without WebGL and anyone who prefers plain pages get the whole site as one scrolling page, told as a match from kick-off to full time.
- **Easter eggs.** Seven of them. Try the ball on the far penalty spot.
- **Adapts to the device.** Three quality levels (crowd size, shadows, resolution) chosen from the hardware and lowered automatically if the frame rate drops. Motion is switched off for visitors who ask their device for less of it.

## Tech stack

| Area | Tools |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org) (App Router), React 19 |
| Language | TypeScript |
| 3D | [Three.js](https://threejs.org) with [React Three Fiber](https://r3f.docs.pmnd.rs) |
| Styling | Tailwind CSS v4, with CSS custom properties for the two themes |
| State | Zustand |
| Data | Open-Meteo (weather), GitHub's public contribution calendar |
| Tooling | ESLint, Turbopack, GitHub Actions |
| Hosting | Vercel |

## Project structure

```
app/
├── data/
│   ├── portfolio.ts      # every word on the site
│   ├── resume.ts         # the résumé, as data
│   └── photos.ts         # photo captions and album order
├── sections/registry.ts  # the list of sections and where each lives in the stadium
├── components/
│   ├── sections/         # the content of each section (one file each)
│   ├── ui/               # header, panel, icons
│   ├── world/            # the page shell: tour or match view, live data, sound, name tags
│   ├── world3d/          # the 3D world
│   │   ├── stadium/      # stands, pitch, roof, crowd, big screen, goals
│   │   ├── rooms/        # dressing room, trophy room, press room, ticket office, mixed zone
│   │   ├── players/      # the player figure, poses and goal scripts
│   │   ├── atmosphere/   # sky, lights, weather
│   │   ├── camera/       # the camera rig and the walk-out
│   │   └── spots.ts      # camera positions for every section
│   ├── match/            # pieces of the flat match view
│   └── resume/           # the résumé page
├── api/                  # weather and GitHub contributions
├── lib/                  # sun position, clocks, sound, shared store
├── match/page.tsx        # the flat match view
└── <section>/page.tsx    # one small page per section
scripts/                  # photo optimiser and résumé PDF builder
```

**Changing something?** [WHERE-TO-EDIT.md](WHERE-TO-EDIT.md) lists every piece of the site and the file it lives in.

## Running locally

Requires Node.js 22 or newer.

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
npm run build      # production build
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run resume     # rebuild the résumé PDF from app/data/resume.ts
npm run photos -- "<folder>"   # shrink photos into public/photos
```

## Deployment

Every push to `main` is linted, type-checked and built by GitHub Actions, and deployed to Vercel.

## Credits

Built by me, Ryan Rai Saini. Weather data from [Open-Meteo](https://open-meteo.com). Photos from NBA All-Star 2026 are shared with the NBA's permission; my STARboard portrait is by Make-A-Wish Canada.

This is a fan project. It is not affiliated with or endorsed by Real Madrid C.F., the NBA or any player named in it. The stadium is an original model inspired by the Santiago Bernabéu and uses no official crests, kits or other club assets.

## Contact

- Email: [ryansinquires@gmail.com](mailto:ryansinquires@gmail.com)
- LinkedIn: [in/ryanraisaini](https://www.linkedin.com/in/ryanraisaini)
- GitHub: [@RyanRaiSaini](https://github.com/RyanRaiSaini)
