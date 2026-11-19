# Where to edit everything

This is the map of the site. Find what you want to change in the left column, open the file in the right column, and look for the name in the middle. Every file also starts with a comment that says what it is for.

After any change: save, check it at `http://localhost:3000` (run `npm run dev` first), then commit and push. Pushing to `main` puts it live on Vercel within about a minute.

**The short version:** almost every word on the site is in **`app/data/portfolio.ts`**. Start there.

---

## 1. Words and content

| I want to change… | Look for | File |
|---|---|---|
| My name, headline, email, GitHub, LinkedIn, location, shirt number | `profile` | `app/data/portfolio.ts` |
| The "Looking for internships…" line | `profile.seeking` | `app/data/portfolio.ts` |
| The About paragraphs | `about.paragraphs` | `app/data/portfolio.ts` |
| The facts table in About (school, degree, graduating…) | `about.facts` | `app/data/portfolio.ts` |
| My courses | `about.coursework` | `app/data/portfolio.ts` |
| Interests ("Away from the keyboard") | `interests` | `app/data/portfolio.ts` |
| A project's title, summary, bullets, numbers, links | `projects` | `app/data/portfolio.ts` |
| Add a project | add an entry to `projects` (copy an existing one) | `app/data/portfolio.ts` |
| A job's title, dates, bullets | `experience` | `app/data/portfolio.ts` |
| Awards and scholarships | `awards` | `app/data/portfolio.ts` |
| The Make-A-Wish and NBA story, the quote, the list of people I met | `makeAWish` | `app/data/portfolio.ts` |
| News links (NBA.com video, Hemophilia Ontario story, STARboard, Instagram) | `news` | `app/data/portfolio.ts` |
| The press room intro and album title | `pressRoom` | `app/data/portfolio.ts` |
| Skills lists | `skillGroups` | `app/data/portfolio.ts` |
| The starting eleven (which tool wears which number) | `squad` | `app/data/portfolio.ts` |
| The bench | `bench` | `app/data/portfolio.ts` |
| "Now building", "Studying", "Open to" | `now` | `app/data/portfolio.ts` |
| The text that scrolls on the pitch-side LED boards | `now.ticker` | `app/data/portfolio.ts` |
| Easter egg names and hints | `eggs` | `app/data/portfolio.ts` |
| The small print at the bottom (built with…, fan project note) | `colophon` | `app/data/portfolio.ts` |
| The site's web address (after adding a domain) | `profile.siteUrl` | `app/data/portfolio.ts` |

### Section names and one-line descriptions

| I want to change… | Look for | File |
|---|---|---|
| A section's title ("Projects"), its place ("The goal"), its football name ("Goals scored"), its intro line | `sections` | `app/sections/registry.ts` |
| The browser tab title and search description of a page | `metadata` inside each section | `app/sections/registry.ts` |
| The order of sections in the match view | `matchOrder` | `app/sections/registry.ts` |
| The minute each section happens at in the match view | `minute` inside each section | `app/sections/registry.ts` |

### Résumé

| I want to change… | Look for | File |
|---|---|---|
| Anything on the résumé | `resume` | `app/data/resume.ts` |
| Rebuild the PDF after a change | run `npm run resume` | writes `public/resume/Ryan-Saini-Resume.pdf` |
| How the résumé looks on the page | | `app/components/resume/resume.css` |
| How the PDF is laid out | | `scripts/build-resume-pdf.mjs` |

The public résumé has **no phone number** on purpose. `**double asterisks**` in the résumé data make text bold.

### Photos

| I want to change… | Look for | File |
|---|---|---|
| A photo's caption or description | the `photo(...)` lines | `app/data/photos.ts` |
| Which photos are in the album, and their order | `album` | `app/data/photos.ts` |
| Add a photo | 1. add a line to `PHOTOS` 2. run `npm run photos -- "C:\path\to\originals"` 3. add a `photo(...)` line and put it in `album` | `scripts/optimize-photos.mjs`, then `app/data/photos.ts` |
| My headshot | replace `public/photos/headshot.webp` (re-run the script) | `scripts/optimize-photos.mjs` |
| The three photos framed on the press-room wall | the `<Frame … />` lines (they use `album[0]`, `album[1]`, `album[4]`) | `app/components/world3d/rooms/PressRoom.tsx` |

The originals are not in the repo. The script shrinks them, converts them to WebP and strips location data.

---

## 2. How each section looks (the panels)

Each section has one file that lays out its content. They are used by both the 3D tour panels and the flat match view.

| Section | File |
|---|---|
| About | `app/components/sections/AboutContent.tsx` |
| Projects | `app/components/sections/ProjectsContent.tsx` |
| Experience | `app/components/sections/ExperienceContent.tsx` |
| Skills (tactics board) | `app/components/sections/SkillsContent.tsx` |
| Awards and Make-A-Wish | `app/components/sections/AwardsContent.tsx` |
| In the News and the photo album | `app/components/sections/NewsContent.tsx` |
| GitHub chart | `app/components/sections/GithubContent.tsx` |
| Now (clocks, weather, roof buttons) | `app/components/sections/LiveContent.tsx` |
| Résumé | `app/components/sections/ResumeContent.tsx` |
| Contact | `app/components/sections/ContactContent.tsx` |
| Small shared pieces (stat boxes, chips, links) | `app/components/sections/parts.tsx` |

| I want to change… | File |
|---|---|
| The home screen (big name, buttons, row of places) | `app/page.tsx` |
| The panel itself (size, close button, previous / next) | `app/components/ui/SectionPanel.tsx` |
| The top bar (name, Places menu, roof, sound, view buttons) | `app/components/ui/SiteHeader.tsx` |
| The little icons for each place | `app/components/ui/PlaceIcon.tsx` |
| The flat match view page | `app/match/page.tsx` |
| The match clock in the corner of the match view | `app/components/match/MatchClock.tsx` |
| The 404 red-card page | `app/not-found.tsx` |
| The error page | `app/error.tsx` |
| The Easter egg tally | `app/components/ui/EggList.tsx` |

---

## 3. Colours, fonts and styles

| I want to change… | Look for | File |
|---|---|---|
| Any colour on the site (dark theme) | `:root, [data-theme="dark"]` | `app/globals.css` |
| Any colour on the site (light theme) | `[data-theme="light"]` | `app/globals.css` |
| The gold accent | `--gold` (both themes) | `app/globals.css` |
| Buttons | `.btn`, `.btn-primary`, `.icon-btn` | `app/globals.css` |
| The frosted panels | `.glass` | `app/globals.css` |
| The name tags floating in the stadium | `.tag…` | `app/globals.css` |
| The "GOOOOOL!" banner animation | `.show-banner` | `app/globals.css` |
| The red card on the 404 page | `.red-card` | `app/globals.css` |
| The fonts | | `app/fonts.ts` |
| The browser tab icon (the 8 badge) | | `app/icon.svg` |
| The picture shown when the link is shared | | `app/opengraph-image.tsx` |

---

## 4. The 3D stadium

Everything 3D is in `app/components/world3d/`. Sizes are in metres. The pitch is centred on 0, 0; north is +X, the main stand (tunnel, dugouts) is at -Z.

### Camera

| I want to change… | Look for | File |
|---|---|---|
| Where the camera goes for a section | `SPOTS.<section>.pose` (`position`, `target`, `fov`) | `app/components/world3d/spots.ts` |
| The phone framing for a section | `SPOTS.<section>.narrow` | `app/components/world3d/spots.ts` |
| Where a name tag floats | `SPOTS.<section>.anchor` | `app/components/world3d/spots.ts` |
| The overview track (height, distance, zoom) | `ORBIT` | `app/components/world3d/spots.ts` |
| Drift speed, drag speed, flight time, pointer lean | | `app/components/world3d/camera/CameraRig.tsx` |
| The walk out of the tunnel (speed, path) | `WALK`, `EMERGE` | `app/components/world3d/camera/Intro.tsx` |

### The stadium

| I want to change… | Look for | File |
|---|---|---|
| Stadium measurements (tiers, roof height, pitch size) | | `app/components/world3d/stadium/dims.ts` |
| Seat colour, the glowing boxes, the walls | `seatTexture`, `boxesTexture` | `app/components/world3d/stadium/Stands.tsx` |
| Grass colours, stripes, line markings | `pitchShader` | `app/components/world3d/stadium/Pitch.tsx` |
| Crowd shirt colours and how white the crowd is | `SHIRTS` | `app/components/world3d/stadium/crowdLayout.ts` |
| How full the stands are at each quality level | `DENSITY` | `app/components/world3d/stadium/Crowd.tsx` |
| The GitHub card display colours | `LEVEL_HEX` | `app/lib/github.ts` |
| The roof, how many panels, how they slide | `ROOF` in `dims.ts`, and | `app/components/world3d/stadium/Roof.tsx` |
| How long the roof takes to open or close | `ROOF_SECONDS` | `app/components/world3d/atmosphere/AtmosphereDriver.tsx` |
| What the big screen says | `segments` | `app/components/world3d/stadium/Halo.tsx` |
| The LED boards round the pitch | | `app/components/world3d/stadium/AdBoards.tsx` (text is `now.ticker` in `portfolio.ts`) |
| Goals and nets | | `app/components/world3d/stadium/Goals.tsx` |
| Corner flags, dugouts, the tunnel | | `app/components/world3d/stadium/PitchSide.tsx` |

### Light, sky and weather

| I want to change… | Look for | File |
|---|---|---|
| Sky colours for day, night, dusk, cloud | the colour constants at the top | `app/components/world3d/atmosphere/AtmosphereDriver.tsx` |
| How bright the sun, floodlights and sky light are | | `app/components/world3d/atmosphere/Lights.tsx` |
| Clouds, stars, the sun disc | | `app/components/world3d/atmosphere/Sky.tsx` |
| The glow round bright lights (strength, what glows) | `intensity`, `luminanceThreshold` | `app/components/world3d/atmosphere/Effects.tsx` |
| Rain and snow (how much, how fast) | `COUNT`, `fall` | `app/components/world3d/atmosphere/Precipitation.tsx` |
| The city used for time and weather | `now.homeCity` | `app/data/portfolio.ts` |
| The second clock (Madrid) | `now.awayCity` | `app/data/portfolio.ts` |
| When the roof closes by itself (night, rain, snow) | "The roof, and with it the colour theme" | `app/components/world/LiveData.tsx` |
| The weather source | | `app/api/weather/route.ts` |

### Rooms

| Room | Section | File |
|---|---|---|
| Dressing room | Skills | `app/components/world3d/rooms/DressingRoom.tsx` |
| Trophy room | Awards | `app/components/world3d/rooms/TrophyRoom.tsx` |
| Press room | In the News | `app/components/world3d/rooms/PressRoom.tsx` |
| Ticket office | Résumé | `app/components/world3d/rooms/TicketOffice.tsx` |
| Mixed zone | Contact | `app/components/world3d/rooms/MixedZone.tsx` |
| Shared building blocks (boxes, lit signs, the room shell) | | `app/components/world3d/rooms/common.tsx` |

The shirts in the dressing room come from `squad` and `bench`. The trophies come from `awards` (the first four). The programme cover in the ticket office and the signs in the mixed zone read from `profile`.

### Players

| I want to change… | Look for | File |
|---|---|---|
| A player's name, number, skin tone, hair | `KITS` | `app/components/world3d/players/kits.ts` |
| My own figure (number 8) | `KITS.saini` | `app/components/world3d/players/kits.ts` |
| The body shape and kit colours | `KIT`, `TRIM`, the shapes in `parts` | `app/components/world3d/players/Player.tsx` |
| A celebration pose | `ARMS_WIDE` (Jude), `ARMS_CROSSED` (Mbappé), `FIST_UP` (me) | `app/components/world3d/players/poses.ts` |
| Where a goal is scored from, where the scorer runs, how long he celebrates | `GOALS` | `app/components/world3d/players/shows.ts` |
| Where number 8 stands in each outdoor section | `REST` | `app/components/world3d/players/Cast.tsx` |
| Where number 8 stands in each room | `MARKS` | `app/components/world3d/players/RoomSaini.tsx` |
| The camera during a goal | "The camera, for the two guest stars" | `app/components/world3d/players/Cast.tsx` |

---

## 5. Easter eggs

| Egg | How it is triggered | Where the code is |
|---|---|---|
| **Hey Jude** (number 5, arms wide) | Click the ball on the south penalty spot | trigger and direction: `players/Cast.tsx`; script: `GOALS.jude` in `players/shows.ts` |
| **Corner specialist** (Mbappé, number 10, arms crossed) | Click the south-east corner flag | trigger: `players/Cast.tsx`; script: `GOALS.mbappe` in `players/shows.ts` |
| **Hala!** (fireworks, "GOOOL" on the big screen) | Type `hala` anywhere, or ↑ ↑ ↓ ↓ ← → ← → B A | keys: `app/components/world/ShowOverlay.tsx`; fireworks: `world3d/eggs/Fireworks.tsx` |
| **VAR check** (red card) | Visit any address that does not exist | `app/not-found.tsx` |
| **La Decimoquinta** (the big cup) | Click the trophy cabinet 15 times | `Cabinet` and `BigCup` in `world3d/rooms/TrophyRoom.tsx` |
| **Wrong sport** (opens the All-Star album) | Click the basketball on the desk in the press room | `Basketball` in `world3d/rooms/PressRoom.tsx` |
| **Locker 66** (Trent's pass) | Click the half-open locker at the left end of the dressing room's back wall | `TrentLocker` and `TrentPass` in `world3d/rooms/DressingRoom.tsx` |

Also: opening a project in the Projects panel replays a goal by number 8 (`ProjectsContent.tsx` starts it, `GOALS.saini` scripts it).

The banner text for each show ("Gooooool!", "¡Hala Madrid!", "15", "66") is in `bannerFor` in `app/components/world/ShowOverlay.tsx`. What the big screen says during a show is `showSegments` in `world3d/stadium/Halo.tsx`.

The number of clicks for the cabinet is the `15` in `Cabinet` (`TrophyRoom.tsx`).

---

## 6. Sound

| I want to change… | Look for | File |
|---|---|---|
| Overall volume | `MASTER` | `app/lib/audio.ts` |
| The crowd, the roar, the whistle, the thump | the methods of `StadiumSound` | `app/lib/audio.ts` |
| When each sound plays | | `app/components/world/SoundEngine.tsx` |

There are no audio files. Everything is generated in the browser, and it is silent until the sound button is pressed.

---

## 7. How it decides things

| Question | Answer | File |
|---|---|---|
| Who gets the 3D tour and who gets the flat match view? | Phones and browsers without WebGL get the match view unless the visitor picks "3D tour". The choice is remembered. | `app/components/world/WorldShell.tsx` |
| How good should the 3D be on this device? | Guessed from the device, then lowered if the frame rate drops below 24 | `app/lib/quality.ts`, `app/components/world3d/World3D.tsx` |
| Light or dark on first load? | The roof follows Brampton: dark at night. Decided before the page paints. | the `bootScript` in `app/layout.tsx` |
| When does the walk-out play? | Home page, once per visit, on the 3D tour only | `bootScript` in `app/layout.tsx`, `world3d/camera/Intro.tsx` |
| Where does the GitHub data come from? | GitHub's public contribution calendar, refreshed hourly, with a saved copy as a fallback | `app/api/contributions/route.ts`, `app/lib/githubParse.ts` |

---

## 8. Test switches

Add these to the address to see a particular look without waiting for it:

| Address | Shows |
|---|---|
| `/?time=22:30` | The stadium as it is at 10:30 pm in Brampton |
| `/?time=13:00&roof=open` | A sunny afternoon with the roof open |
| `/?weather=snow&roof=open` | Snow falling through the open roof (`clear`, `cloudy`, `overcast`, `fog`, `rain`, `snow`, `storm`) |
| `/?roof=closed` | Roof closed (dark theme) |
| `/?quality=low` | The lightest 3D (also `medium`, `high`) |
| `/?nointro=1` | Skip the walk-out |
| `/?view=tour` or `/?view=match` | Force the 3D tour or the flat match view |

In the browser console, `__world.getState()` shows the site's live state, and `__look(x, y, z, targetX, targetY, targetZ, fov)` parks the camera anywhere (`__look()` lets go).

---

## 9. Commands

```bash
npm run dev        # run the site at http://localhost:3000
npm run build      # production build (what Vercel runs)
npm run lint       # check the code style
npm run typecheck  # check the types
npm run resume     # rebuild the résumé PDF from app/data/resume.ts
npm run photos -- "<folder>"   # shrink photos from a folder into public/photos
```

Every push to `main` is checked by GitHub Actions (`.github/workflows/ci.yml`) and deployed by Vercel.
