# Where to edit everything

This is the map of the site. Find what you want to change in the left column, open the file in the right column, and look for the name in the middle. Every file also starts with a comment that says what it is for.

After any change: save, check it at `http://localhost:3000` (run `npm run dev` first), then commit and push. Pushing to `main` puts it live on Vercel within about a minute.

**The short version:** almost every word on the site is in **`app/data/portfolio.ts`**. Start there.

---

## 1. Words and content

| I want to change… | Look for | File |
|---|---|---|
| My name, headline, email, GitHub, LinkedIn, location, shirt number | `profile` | `app/data/portfolio.ts` |
| The home screen's buttons and its one line of help | `home` | `app/data/portfolio.ts` |
| "Opening the gates", "Skip the walk-out" and the slow-loading note | `shell` | `app/data/portfolio.ts` |
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
| Easter egg names and hints | `eggs` | `app/data/portfolio.ts` |
| The small print (built with…, the credits the licences ask for, fan project note) | `colophon` | `app/data/portfolio.ts` |
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
| How the PDF is laid out | `GAP`, `SIZE` and the margins at the top | `scripts/build-resume-pdf.mjs` |
| The words on the Download and Open buttons, and the note under the page | `resumeText` | `app/data/portfolio.ts` |

The PDF is set to match my LaTeX résumé: the same typeface (Computer Modern, in `scripts/fonts/`), margins, sizes and spacing, so its lines turn where the original's do. The public résumé has **no phone number** on purpose; the email address is in its place. `**double asterisks**` in the résumé data make text bold.

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
| Small shared pieces (a titled part, stat boxes, short lists set as one line of text, quotes, links, and bullet lists that fold away behind "Show all") | `app/components/sections/parts.tsx` |
| The tabs that split a long section in two (Projects, Skills, Awards, In the News) | `app/components/ui/Tabs.tsx` |

| I want to change… | File |
|---|---|
| The home screen (the name caption in the corner, its buttons, the row of places on a phone, the folded-away credits) | `app/page.tsx` |
| The panel itself (size, close button, previous / next) | `app/components/ui/SectionPanel.tsx` |
| The top bar (name, the four direct links, Places menu, roof, sound, view buttons) | `app/components/ui/SiteHeader.tsx` |
| Which sections get a link of their own in the top bar | `DIRECT` in `app/components/ui/SiteHeader.tsx` |
| The name tags over the stadium (what they say, what they keep clear of) | `app/components/world/Tags.tsx` |
| The loading bar and the fallback when the stadium fails to load | `app/components/world/WorldShell.tsx` |
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
| Menus and notes that sit over the stadium | `.glass` | `app/globals.css` |
| The dark plates of the top bar and the home screen | `.plate`, `.wordmark`, `.top-links`, `.home-…` | `app/globals.css` |
| A section's panel: its broadcast colours (set in the panel's own tokens, so they hold in either theme), the header bar with the slanted title, the angled corners, and the blocks and tabs inside | `.panel`, `.panel-head`, and the `.panel …` rules after them | `app/globals.css` |
| The home screen's name card (same broadcast look) | `.home-plate` | `app/globals.css` |
| The flat view's big centred name | `.match-name` | `app/globals.css` |
| The gaps inside every section: between its parts, and between a heading and what follows | `--gap-block`, `--gap-item` in `.sec` | `app/globals.css` |
| Headings, cards, labels, facts, quotes and tabs inside a section | `.part-title`, `.card`, `.label`, `.facts`, `.quote`, `.tabs…` | `app/globals.css` |
| The start screen | `.start…` | `app/globals.css` |
| The name tags floating in the stadium | `.tag…` | `app/globals.css` |
| The loading bar | `.loading…` | `app/globals.css` |
| The "GOOOOOL!" banner animation | `.show-banner` | `app/globals.css` |
| The red card on the 404 page | `.red-card` | `app/globals.css` |
| The fonts (Barlow for text, Barlow Condensed for headings and buttons) | | `app/fonts.ts` |
| The browser tab icon (my initials) | | `app/icon.svg` |
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
| The words on the start screen | `home.tour`, `home.startNote`, `home.skipStart` (the name and line under it are `profile.name` and `profile.headline`) | `app/data/portfolio.ts` |
| How the start screen is laid out | the `.start` styles | `app/globals.css`, `app/components/world/StartScreen.tsx` |
| Where the camera stands on the start screen | `WAITING` | `app/components/world3d/camera/Intro.tsx` |
| The walk out of the tunnel (speed, path) | `WALK`, `EMERGE` | `app/components/world3d/camera/Intro.tsx` |
| Which section opens after the walk-out | `setSection("about")` and `navigate("/about")` at the end of the walk; `openTour` for the skip button | `app/components/world3d/camera/Intro.tsx`, `app/components/world/WorldShell.tsx` |
| How dark the tunnel is, and the haze of light in its mouth | `DEEP`, `spill`, and the `glow` in `Tunnel` | `app/components/world3d/stadium/PitchSide.tsx` |

### The stadium

The stands, roof and seats are a model built in Blender. Its shape is changed in `blender/`, then rebuilt (see section 10). What it looks like in the browser is changed in the files below, with no rebuild.

| I want to change… | Look for | File |
|---|---|---|
| The stadium's shape: tiers, rows, aisles, entrances, roof, ring of screens, floodlights | the numbers, then rebuild | `blender/stadium/params.py` |
| How one seat is shaped | `build_seat` | `blender/stadium/seats.py` |
| What each surface looks like (colour, shine, which photographed texture) | `LOOKS`, `SURFACES` | `app/components/world3d/stadium/materials.ts` |
| Seat colour | `SEAT_COLOR` | `app/components/world3d/stadium/materials.ts` |
| How near the camera must be for the detailed seat | `DETAIL_DISTANCE` | `app/components/world3d/stadium/Seats.tsx` |
| The GitHub scoreboard under the main stand's second tier (its size, colours, layout) | `WIDTH`, `LEVELS`, `paint` | `app/components/world3d/stadium/GithubBoard.tsx` |
| The scoreboard's words, and how many recent weeks it and the GitHub panel show | `githubText.board`, `githubText.recentWeeks` | `app/data/portfolio.ts` |
| How deep the shade under the roof is | `bake` | `app/components/world3d/stadium/bakedLight.ts` |
| The roof panels sliding, the lamps' brightness | | `app/components/world3d/stadium/StadiumModel.tsx` |
| How long the roof takes to open or close | `ROOF_SECONDS` | `app/components/world3d/atmosphere/AtmosphereDriver.tsx` |
| What the ring of screens says during a goal or the fireworks (it is dark otherwise) | `showSegments` | `app/components/world3d/stadium/StadiumModel.tsx` |
| The pitch: grass colours, mowing stripes, wear, line markings | | `app/components/world3d/stadium/Pitch.tsx` |
| The boards round the pitch (blank on purpose: no sponsors) | | `app/components/world3d/stadium/AdBoards.tsx` |
| Goals and nets | | `app/components/world3d/stadium/Goals.tsx` |
| Corner flags, the team benches, the tunnel | | `app/components/world3d/stadium/PitchSide.tsx` |
| The few measurements the site repeats from the model (pitch, tunnel, dugout) | | `app/components/world3d/stadium/dims.ts` |

### Light, sky and weather

By day the stadium is lit by one photographed sky and one fixed sun. The real clock in Brampton only decides whether it is day or night.

| I want to change… | Look for | File |
|---|---|---|
| Which way the sun shines from | `SUN_COMPASS` here **and** `SUN` in `blender/stadium/params.py` (they must match), then rebuild | `app/components/world3d/atmosphere/daylight.ts` |
| The sky photo | `SKY`, then `npm run stadium:assets` and `blender/sky.py` | `scripts/fetch-polyhaven.mjs` |
| How bright the sun, the floodlights and the fill light are | the lines marked "strength" | `app/components/world3d/atmosphere/Lights.tsx` |
| How bright the stands are at night and with the roof closed | the `bake.` lines | `app/components/world3d/atmosphere/AtmosphereDriver.tsx` |
| Night sky colours, haze | the colour constants at the top | `app/components/world3d/atmosphere/AtmosphereDriver.tsx` |
| Stars, and the painted clouds used at night and when overcast | | `app/components/world3d/atmosphere/Sky.tsx` |
| The crowd: how full the ground is | `OCCUPANCY` | `app/components/world3d/stadium/crowdPlan.ts` |
| The crowd: shirt colours, trousers, hair, how many raise an arm, how long they jump after a goal | `SHIRTS`, the shader's `vLegs` and `vHair`, the `cell` choice, `CHEER_SECONDS` | `app/components/world3d/stadium/Crowd.tsx` |
| The crowd's people and poses (two Mixamo men, seated, four poses each) | `PEOPLE`, `POSES`; rebuild with `npm run crowd:build` then `npm run crowd:pack` | `blender/build_crowd.py`, `scripts/pack-crowd.mjs` |
| The shape of a fan in the round (body, head, hair, arms, legs) and the raised arm | `fanGeometry`, `fanMaterial` | `app/components/world3d/stadium/fanFigure.ts` |
| The colour a taken seat is darkened to | `TAKEN` | `app/components/world3d/stadium/Seats.tsx` |
| The floodlights' beams and the halo along the lamp bar at night (off at "low" quality) | `STRENGTH`, and `shafts` in the shader | `app/components/world3d/stadium/FloodBeams.tsx` |
| The glow round bright lights ("high" quality only) | `intensity`, `luminanceThreshold` | `app/components/world3d/atmosphere/Effects.tsx` |
| Rain and snow (how much, how fast) | `COUNT`, `fall` | `app/components/world3d/atmosphere/Precipitation.tsx` |
| The city used for time and weather | `now.homeCity` | `app/data/portfolio.ts` |
| The second clock (Madrid) | `now.awayCity` | `app/data/portfolio.ts` |
| When the roof closes by itself (night, rain, snow) | "The roof, and with it the colour theme" | `app/components/world/LiveData.tsx` |
| The weather source | | `app/api/weather/route.ts` |

### Rooms

| Room | Section | File |
|---|---|---|
| Dressing room (lockers, boots, the match ball on the crest, the ball bag) | Skills | `app/components/world3d/rooms/DressingRoom.tsx` |
| Trophy room (four cases, the cabinet, velvet ropes and runner) | Awards | `app/components/world3d/rooms/TrophyRoom.tsx` |
| Press room (lighting rig, studio light, TV cameras, PRESS chairs) | In the News | `app/components/world3d/rooms/PressRoom.tsx` |
| Ticket office (lit windows, the club banner, the player profile with my photo, the scarf wall, the matchday board; the words are `resumeText.board`, `resumeText.banner` and `resumeText.profileTitle` in `portfolio.ts`) | Résumé | `app/components/world3d/rooms/TicketOffice.tsx` |
| Mixed zone (interview board, barrier, broadcasters' microphones, TV camera) | Contact | `app/components/world3d/rooms/MixedZone.tsx` |
| Shared building blocks (boxes, lit signs, the room shell, the TV camera on its tripod) | | `app/components/world3d/rooms/common.tsx` |

The shirts in the dressing room come from `squad` and `bench`. The trophies come from `awards` (the first four). The programme cover in the ticket office and the signs in the mixed zone read from `profile`.

### Players

Every player is a copy of one model (`public/players/player.glb`), moved by motion capture. Each has his own skin tone, hair, beard, height and shirt print.

| I want to change… | Look for | File |
|---|---|---|
| A player's number, skin tone, hair colour, hairstyle, beard, height | `KITS` (the choices for hair and beard are listed at the top of the file). Only number 8 has a `name`. | `app/components/world3d/players/kits.ts` |
| My own figure (number 8): 1.85 m, brown skin, a goatee | `KITS.saini` (`height`, `skin`, `beard`) | `app/components/world3d/players/kits.ts` |
| The print on the back of the shirt (size, place, colour) | `PRINT`; `INK` is the navy on the white kit, `PALE` the white on any other | `app/components/world3d/players/Player.tsx` |
| The kit's colour for someone not in white (the goalkeeper) | `colour` in `KITS` | `app/components/world3d/players/kits.ts` |
| A celebration | `celebration` in `GOALS`: a standing pose (`"wide"`, `"folded"`, `"hips"`) or the motion-captured `"victory"` | `app/components/world3d/players/shows.ts` |
| Where a goal is scored from, how the scorer arrives, where he runs, how long he celebrates | `GOALS` (keep the running speeds human: the note at the top says how) | `app/components/world3d/players/shows.ts` |
| The goalkeeper: who he is, and which way he dives | `KITS.keeper`; `keeper` in `GOALS` (`"wrong"` or `"late"`). His dive was recorded one way only, so for the other he is shown as in a mirror (`keeperMirrored`), with his number printed to suit. | `players/kits.ts`, `players/shows.ts`, `players/Cast.tsx` |
| Where number 8 stands in each outdoor section, and how he stands | `REST` | `app/components/world3d/players/Cast.tsx` |
| Where number 8 is in each room, and what he is doing | `MARKS` | `app/components/world3d/players/RoomSaini.tsx` |
| The camera during a goal | "The camera, for the two guest stars" | `app/components/world3d/players/Cast.tsx` |
| The body's build (shoulders, chest, waist, arms, neck, calves, thighs) | `SHAPE`, and `THIGH` (each row: a height, the thigh's radius there, and how far forward it sits), then rebuild (section 11) | `blender/players/params.py` |
| The shorts: how long, how narrow at the hem, how close to the thigh | `SHORTS_HEM`, `SHORTS_SLIM`, `SHORTS_CLEAR`, then rebuild and run the check | `blender/players/params.py` |
| How even and how smooth the skin is (a blotchy skin goes rusty under a brown tint) | `SKIN_EVEN`, `SKIN_SMOOTH`, then rebuild | `blender/players/params.py` |
| The cut of the kit, the hairstyles and beards | the numbers in `params.py`, and the file beside it for each part, then rebuild | `blender/players/` |
| The goatee's outline | `_circle` (the other two beards are `_jaw` and `_chin`), then rebuild | `blender/players/head.py` |
| A standing pose (where the hands or the foot go) | `hands_on_hips`, `arms_folded`, `arms_wide`, `foot_on_ball`, then rebuild | `blender/players/stances.py` |
| Which motion-capture clips the model carries | `CLIPS`, then rebuild | `blender/build_players.py` |

How a player moves is a short list of clips to mix, written in `players/moves.ts` (`standing`, `playing`, `blend`). The timings that come with the model (how long each clip is, when and where its kick lands) are read from `public/players/player.json` by `players/notes.ts`.

---

## 5. Easter eggs

| Egg | How it is triggered | Where the code is |
|---|---|---|
| **From the spot** (number 6, a penalty, arms wide) | Click the ball on the south penalty spot | trigger and direction: `players/Cast.tsx`; script: `GOALS.six` in `players/shows.ts` |
| **Corner specialist** (number 10, arms folded) | Click the south-east corner flag | trigger: `players/Cast.tsx`; script: `GOALS.ten` in `players/shows.ts` |
| **Hala!** (fireworks, "GOOOL" on the big screen) | Type `hala` anywhere, or ↑ ↑ ↓ ↓ ← → ← → B A | keys: `app/components/world/ShowOverlay.tsx`; fireworks: `world3d/eggs/Fireworks.tsx` |
| **VAR check** (red card) | Visit any address that does not exist | `app/not-found.tsx` |
| **La Decimoquinta** (the big cup) | Click the trophy cabinet 15 times | `Cabinet` and `BigCup` in `world3d/rooms/TrophyRoom.tsx` |
| **Wrong sport** (opens the All-Star album) | Click the basketball on the desk in the press room | `Basketball` in `world3d/rooms/PressRoom.tsx` |
| **Number 66** (the long pass) | Click the shirt left on a seat in the south dugout | `world3d/eggs/BenchShirt.tsx` (where the shirt is, where the pass is hit from and lands); its timing is `LONG_PASS` in `players/shows.ts` |

Both goals are scored past a goalkeeper (number 1), who is nobody in particular. He also stands in the north goal whenever Projects is open, and dives when number 8's goal plays. Otherwise he is on the pitch only during a goal.

**Only number 8 has a name on his shirt.** Every other player is a number and nothing more, on the shirt, in the goal banner and on the ring of screens. No other player is named anywhere on the site, in the code or in these notes.

Also: opening a project in the Projects panel replays a goal by number 8 (`ProjectsContent.tsx` starts it, `GOALS.saini` scripts it).

The banner text for each show ("Gooooool!", "¡Hala Madrid!", "15", "66") is in `bannerFor` in `app/components/world/ShowOverlay.tsx`. What the ring of screens says during a show is `showSegments` in `world3d/stadium/StadiumModel.tsx`.

The number of clicks for the cabinet is the `15` in `Cabinet` (`TrophyRoom.tsx`).

---

## 6. Sound

| I want to change… | Look for | File |
|---|---|---|
| Overall volume | `MASTER` | `app/lib/audio.ts` |
| How loud each sound is against the others | `LEVEL` | `app/lib/audio.ts` |
| How often something happens in the crowd (a swell, clapping, a drum) | `EVENT_GAP`, in seconds | `app/lib/audio.ts` |
| The crowd, the roar, the whistle, the thump | the methods of `StadiumSound` | `app/lib/audio.ts` |
| When each sound plays | | `app/components/world/SoundEngine.tsx` |

There are no audio files. Everything is generated in the browser, and it is silent until the sound button is pressed.

---

## 7. How it decides things

| Question | Answer | File |
|---|---|---|
| Who gets the 3D tour and who gets the flat match view? | Phones and browsers without WebGL get the match view unless the visitor picks "3D tour". The choice is remembered. | `app/components/world/WorldShell.tsx` |
| How good should the 3D be on this device? | Guessed from the device (three levels), then lowered if the frame rate drops below 24 | `app/lib/quality.ts`, `app/components/world3d/FrameGovernor.tsx` |
| How often is the stadium redrawn? | Every frame while something moves or the visitor is doing something, 30 a second for a while after, then not at all until the next input. Never while the tab is hidden. | `REST_AFTER` in `app/components/world3d/FrameGovernor.tsx` |
| What if the stadium fails to load? | A loading bar shows progress; after 12 seconds it offers the flat view; if the 3D breaks, the flat view opens by itself | `app/components/world/WorldShell.tsx` |
| Light or dark on first load? | The roof follows Brampton: dark at night. Decided before the page paints. | the `bootScript` in `app/layout.tsx` |
| When is the start screen shown? | Home page, once per visit, on the 3D tour only, and not for visitors who have asked their device for less motion. "Start the tour" plays the walk-out and opens About; "Skip to the stadium" goes to the overview. The top bar is there throughout. | `bootScript` in `app/layout.tsx`, `app/lib/intro.ts`, `app/components/world/WorldShell.tsx`, `world3d/camera/Intro.tsx` |
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
| `/?nointro=1` | Skip the start screen and the walk-out |
| `/?view=tour` or `/?view=match` | Force the 3D tour or the flat match view |

In the browser console:

- `__world.getState()` shows the site's live state.
- `__look(x, y, z, targetX, targetY, targetZ, fov)` parks the camera anywhere (`__look()` lets go).
- `__tune.sun = 1.2` (also `sky`, `fill`, `floods`, `exposure`, `bounce`, `floor`) tries a lighting change live; 1 is the built-in value.
- `__bake` holds the shade settings, and `__activity.pace` says whether the picture is being drawn at "full", "ambient" or "rest".

---

## 9. Commands

```bash
npm run dev        # run the site at http://localhost:3000
npm run build      # production build (what Vercel runs)
npm run lint       # check the code style
npm run typecheck  # check the types
npm run resume     # rebuild the résumé PDF from app/data/resume.ts
npm run photos -- "<folder>"   # shrink photos from a folder into public/photos

npm run shots -- http://localhost:3000 <folder>     # the same set of pictures every time, for before and after
npm run measure -- http://localhost:3000            # frame rate and processor load, on this computer
npm run peek -- "<address>" "<code>"                # run a line of code in the page and print the result

npm run stadium:build    # rebuild the stadium model in Blender (section 10)
npm run stadium:pack     # squeeze the model for the web
npm run stadium:assets   # fetch the Poly Haven textures and sky again

npm run players:build    # rebuild the player model in Blender (section 11)
npm run players:check    # play every movement and make sure no thigh shows through the shorts
npm run players:pack     # squeeze the player model for the web
```

Every push to `main` is checked by GitHub Actions (`.github/workflows/ci.yml`) and deployed by Vercel.

---

## 10. Rebuilding the stadium model

Needed only after changing the stadium's **shape** or the sun's direction. Colours and materials need no rebuild.

1. Change a number in `blender/stadium/params.py` (tiers, rows, roof…). Every file in `blender/stadium/` says at the top which part it builds.
2. Run Blender with no window (about two minutes). It builds every part, works out the light and shadow, and writes the editable `.blend` file plus the files the site reads:

   ```bash
   "C:/Program Files/Blender Foundation/Blender 5.3/blender.exe" --background --factory-startup --python blender/build.py -- --blend "C:/Users/ryanr/stadium-work/bernabeu-stadium.blend" --site public/stadium
   ```

3. Squeeze the model for the web:

   ```bash
   npm run stadium:pack
   ```

4. Look at it (`npm run dev`), then take the pictures again (`npm run shots -- http://localhost:3000 docs/redesign/after`).

What the build writes into `public/stadium/`:

| File | What it is |
|---|---|
| `stadium.glb` | The model the site loads (1.7 MB) |
| `stadium.raw.glb` | The same before squeezing (12 MB; not committed) |
| `seats-positions.bin`, `seats-details.bin` | Where each of the 63,322 seats goes, and its tier, row and light |
| `pitch-light.png` | A small picture of where the sun and sky reach the ground |
| `manifest.json` | Counts and measurements the site needs |
| `sky.jpg`, `sky-light.hdr`, `sky.json` | The sky, from `blender/sky.py` |
| `textures/` | The Poly Haven surfaces, from `npm run stadium:assets` |

To open the stadium in Blender itself, open `C:\Users\ryanr\stadium-work\bernabeu-stadium.blend`. Every part is a named object (Terraces, Structure, Roof, Steel, Screen, Floodlights, RoofPanel.000 to .009, SeatHi, SeatLo). Edits made by hand there are lost on the next rebuild; lasting changes belong in the scripts.

Sources and licences for everything used are in [docs/redesign/ASSETS.md](docs/redesign/ASSETS.md).

---

## 11. Rebuilding the player model

Needed only after changing the player's **body, kit, hair, beards, poses or clips**. Names, numbers, skin tones and heights are in `kits.ts` and need no rebuild.

The player is built from a stock character in Adobe's Mixamo library ("Remy") and Mixamo's motion-capture clips. Only his body and skeleton are kept; the build makes him a footballer. The Mixamo downloads are **not in this repository** (see [docs/redesign/ASSETS.md](docs/redesign/ASSETS.md)); they are in `C:\Users\ryanr\stadium-work\mixamo\source\`.

1. Change a number in `blender/players/params.py`, or the file for the part you want (each says at the top what it does):

   | File | What it does |
   |---|---|
   | `body.py` | Loads the base, gives him an athlete's build, builds the thighs the base comes without |
   | `kit.py` | Shorts, socks, boots, and the shirt's picture |
   | `head.py` | Skin, eyes, the short curls, the three beards |
   | `clips.py` | Brings each motion-capture clip onto the player and measures its kick |
   | `stances.py` | The standing poses |
   | `look.py` | Materials, and the preview pictures |

2. Run Blender with no window (about a minute; add `--preview <folder>` for pictures of each player):

   ```bash
   "C:/Program Files/Blender Foundation/Blender 5.3/blender.exe" --background --factory-startup --python blender/build_players.py -- --source "C:/Users/ryanr/stadium-work/mixamo/source" --blend "C:/Users/ryanr/stadium-work/mixamo/footballer.blend" --site public/players
   ```

3. After a change to the thighs or the shorts, or a new clip, check that no thigh shows through the cloth. This plays every clip and pose and measures (about a minute; it ends with "passed" or names the clip and frame):

   ```bash
   "C:/Program Files/Blender Foundation/Blender 5.3/blender.exe" --background "C:/Users/ryanr/stadium-work/mixamo/footballer.blend" --python blender/check_players.py
   ```

4. Squeeze the model for the web:

   ```bash
   npm run players:pack
   ```

5. Look at it (`npm run dev`), then take the pictures again (`npm run shots -- http://localhost:3000 docs/redesign/after`).

For a quick look at the body and kit alone, add `--no-clips` to the build and point `--blend` and `--site` at a spare folder: it takes five seconds, and leaves the site's own files as they were.

What the build writes into `public/players/`:

| File | What it is |
|---|---|
| `player.glb` | The model the site loads (1.6 MB): one body, the kit, two hairstyles, three beards, ten clips and four poses |
| `player.raw.glb` | The same before squeezing (6 MB; not committed) |
| `player.json` | The timings the site needs: each clip's length, the moment and place of each kick, how far the player travels |

To add a clip: download it from Mixamo for the same character (FBX, "Without Skin", 30 frames a second), put it in the source folder, and add a line to `CLIPS` in `blender/build_players.py`. Then name it in `ClipName` in `players/moves.ts`.
