# Build log

A record of what was built and what was decided. Newest at the bottom. For where each thing lives, see [WHERE-TO-EDIT.md](../WHERE-TO-EDIT.md).

## 2026-11-19, the first night (Claude Code, working alone overnight)

### Decisions made before starting

- **Concept:** a tour of a football stadium inspired by the Santiago Bernabéu. Each part of the ground is a section. Players other than number 8 appear only in Easter eggs.
- **Look:** realistic shapes and bright floodlit colour, not cartoon. Night and day both supported.
- **Phones:** the flat "match view" by default, with the 3D tour one tap away.
- **No official club assets.** White kit, names and numbers only, no crest, no anthem.
- **Résumé:** a public copy with no phone number.
- **Photo captions:** general ("All-Star Media Day"), no names on individual photos.
- **Contact:** email and LinkedIn buttons, no form.
- **Hosting:** a free `vercel.app` address.

### Phase 1: setup

- Next.js 16 app created, GitHub repo `RyanRaiSaini/personal-site` made public, Vercel project created and connected so every push to `main` deploys.
- GitHub Actions runs lint, type-check and build on every push.
- Three.js, React Three Fiber, drei and zustand added.

### Phase 2: content

- All copy written into `app/data/portfolio.ts` from the résumé, the GitHub profile README and Ryan's answers.
- 13 All-Star photos chosen from the 34 supplied, shrunk to WebP with location data stripped. Headshot taken from the GitHub avatar; STARboard portrait from Make-A-Wish Canada's page.
- Section registry written: eleven places, their names, minutes and page titles.
- Checked against the sources: BHive's own description (thebhive.ca), the STARboard page, the Hemophilia Ontario article, the NBA.com video page and the NBA Cares Instagram post.
- **Spelling corrected:** the scholarship is "John Plater" (Hemophilia Ontario's own spelling). The original résumé file says "Platter".

### Phase 3: the stadium

- The bowl is a rounded rectangle; a "sweep" builder (`stadium/path.ts`) makes the tiers, walls, roof and big screen by running a cross-section round it.
- Pitch drawn by a shader, so lines stay sharp at any distance.
- About 35,000 fans drawn in one call (`stadium/Crowd.tsx`), with a card display in the main stand's second tier.
- Roof with ten sliding panels; the big screen is an LED ring under it; LED boards round the pitch; goals, nets, corner flags, dugouts and the tunnel.
- Light follows the real sun over Brampton (`lib/sun.ts`), with floodlights taking over at night or under a closed roof.

### Phase 4: the tour

- Camera rig: an oval track for the overview (drag to turn, scroll to zoom, slow drift), eased flights between sections, a curtain when cutting into a room.
- Each section is its own page with real text. The page shell (`world/WorldShell.tsx`) keeps the 3D world in step with the address.
- Name tags were first drawn with drei's `Html`; it threw errors when unmounting under React 19, so they were replaced with ordinary page links positioned from a per-frame projection (`world3d/Hotspots.tsx` and `world/Tags.tsx`).
- Panels slide the 3D view aside using a camera view offset, so the subject stays centred in the free space.

### Phase 5: rooms

- Dressing room, trophy room, press room, ticket office and mixed zone, each built from boxes and lit signs at its own far-away origin. Only the room being visited exists.
- After testing, locker 66 was moved to the left end of the main row, the press photos to the back wall and the basketball to the desk, because the panel was hiding them on wide screens.

### Phase 6: live data

- `/api/weather` (Open-Meteo, kept ten minutes) and `/api/contributions` (GitHub's public calendar, kept an hour, with a saved fallback copy).
- The roof in "auto" closes at night and in rain or snow; the colour theme follows the roof. A script in the page head sets the theme before first paint.
- Rain and snow fall through the open roof.

### Phase 7: players and Easter eggs

- A jointed player figure with poses for running, shooting and three celebrations.
- Seven eggs: the penalty, the corner-flag goal, the "hala" fireworks (also the classic cheat code), the VAR 404 page, the fifteenth click on the trophy cabinet, the basketball, and locker 66.
- Opening a project replays a goal by number 8.
- Five were set off with real clicks that night: the ball on the penalty spot, locker 66, the basketball, the trophy cabinet and the VAR page. The corner flag and the "hala" fireworks were only started from code; both were set off for real the next morning (see below).

### Phase 8: match view, 404, extras

- `/match`: the whole site on one page, with a match clock that follows the scroll.
- Red-card 404, error page, sitemap, robots rules, number 8 icon, link-preview image.

### Phase 9: sound and polish

- Crowd, roar, thump and whistle synthesised in the browser (`lib/audio.ts`); off until the visitor turns it on.
- The home text no longer swallows clicks meant for the pitch.
- Stars redrawn as points, the trophy room brightened, several camera framings widened.
- A glow pass (bloom) added for the two higher quality levels, so floodlights, the big screen and lit signs shine. Measured at the browser's 30 frames-a-second cap on an Intel Iris Xe laptop.

### Known gaps and things to look at next

- The résumé PDF was checked for length (one page) but not viewed as an image on this machine; open it once and check the layout.
- The notes under two awards ("Leader of Tomorrow…", "John Plater…") are general wording; replace with the exact criteria if wanted.
- The 3D tour on a phone works (lighter crowd, bottom sheet) but has had only a quick look.

## 2026-11-19, the morning after

### The address

- `ryansaini.vercel.app` added to the Vercel project and set as `profile.siteUrl`, so the sitemap and link previews use it. The README and the repo's website link point to it too.
- The first address, `personal-site-olive-tau.vercel.app`, still works.

### Easter eggs, checked again

- **The corner flag:** a real click on the south-east corner flag starts the goal. From the normal overview the flag was a small moving target (about 14 pixels wide from across the stadium, and off the bottom of the screen when the camera is near it), so the test click was made with the camera parked beside it.
- **"hala":** real key presses (h, a, l, a) start the fireworks.
- **Bigger targets:** the invisible click targets on the ball and the corner flag were enlarged (`players/Cast.tsx`), and a click at the end of a drag no longer counts.
- Not tried with real keys: the cheat code (up up down down left right left right B A).

### Seen while testing, not yet changed

- In the corner-flag scorer's close-up, the "GOOOOOOL!" banner sits over his head.
- On the home view, name tags can drift across the name and the opening lines at some camera angles.

## 2026-11-19, the realism redesign

Ryan's verdict on the first build was "cartoony". This pass rebuilt the stadium to look like a real building, cut what it costs to run, and restyled the page's own text. The write-ups are in [redesign/](redesign/): why it looked cartoonish ([FINDINGS](redesign/FINDINGS.md)), the two Sketchfab models ([MODELS](redesign/MODELS.md)), every asset and licence ([ASSETS](redesign/ASSETS.md)), the pictures ([COMPARE](redesign/COMPARE.md)), the interface ([INTERFACE](redesign/INTERFACE.md)) and the measurements ([PERFORMANCE](redesign/PERFORMANCE.md)).

### Before starting

- The old site was photographed from 14 fixed spots (`npm run shots`, pictures in `redesign/before/`) and tagged `checkpoint-before-realism`.
- Both Sketchfab models were downloaded, opened in Blender and measured. Neither became the stadium: one is three million loose points, the other is the old ground with club lettering on it. The scan's outer measurements were used; its author is credited.

### The stadium

- **Built in Blender from Python scripts** (`blender/`): four tiers with real steps (24, 16, 16 and 17 rows), aisles, entrances cut into the upper tiers, tier fronts with glass, a truss roof with ten sliding panels, a ring of screens and a ring of floodlights. 63,322 seats, each placed.
- **Packed to 1.7 MB** (`scripts/pack-stadium.mjs`). The seats are drawn as 152 blocks of copies, with a detailed seat near the camera and a plain one far away.
- **Light worked out in Blender.** Every corner of the model, every seat and every half-metre of the ground carries how much sky it sees, how much sunlit pitch, and whether the sun reaches it. The site reads those numbers (`stadium/bakedLight.ts`), so the roof's shadow and the gloom under the tiers cost nothing while the page runs.
- **One daylight.** A photographed sky from Poly Haven lights the bowl and shows through the roof. The clock in Brampton now decides only day or night.
- **Photographed surfaces** on concrete, painted walls, the roof deck and the pitch, at life size.
- **The pitch** has mowing stripes that change with the viewing angle, wear, and blade detail.
- **No sponsors anywhere.** The boards round the pitch are blank and the ring of screens is dark except during a goal or the fireworks. The scrolling text is gone.
- **Night** is a ring of lamps under the roof, a bright pitch and lit blue stands.
- **Pitch side:** the dugouts are rows of high-backed bench seats under a ribbed canopy; the boards open in front of them; the tunnel is dim.
- **Cameras:** the overview rides a track along the third tier; About, Projects, Experience and GitHub use long lenses from further back.

### Two bugs found on the way

- The packing step was throwing away the model's texture positions, so the photographed surfaces showed as one flat colour. Found while asking why the floodlights would not light up. Fixed in the packer.
- The floodlight glass had been modelled facing the stands, not the pitch.

### What it costs to run

- **It no longer draws when nothing is happening** (`world3d/FrameGovernor.tsx`): full rate while something moves or the visitor is active, 30 a second for a while after, then nothing until the next input, and never while the tab is hidden.
- **The biggest single cost was not 3D at all:** the ten floating name tags. Their pulsing pins made the browser restyle the page on every frame, and moving ten of them cost about 6 ms a frame. They now move in whole pixels, only when a frame is drawn, and the pins are still.
- Fourteen see-through materials were being re-checked twice a frame by three.js (`forceSinglePass` fixes it).
- Frosted glass is gone from the interface: blurring a moving 3D picture behind every panel is work for the graphics chip on every frame.
- Quality levels were set from measurements on this laptop's built-in graphics, not guesses. The glow pass is "high" only.
- A simpler material for the seats was tried and thrown away: the saving was inside the noise and the seats looked like toys.

### The interface

- One type family (Barlow) in two widths, solid plates, a name caption in the corner of the home screen, and Projects, Experience, Résumé and Contact in the top bar.
- Name tags are one short line and keep clear of the page's text and of each other.
- A loading bar with a percentage; after 12 seconds an offer of the flat view; if the 3D breaks, the flat view opens.
- "Number 8" is on the shirt and nowhere else.

### Not done in this pass

- The player figure and the five rooms are still the earlier code-drawn versions.
- The stadium is empty. A believable crowd is a job of its own.
- The outside of the stadium is not modelled, because no camera goes there.
- Ryan's content decisions from the same day (dropping Skills and Now, folding GitHub into Projects, the formal rewrite, the start screen in the tunnel, the résumé from his LaTeX original, moving number 66's egg) are waiting for his go.
- In the corner-flag scorer's close-up, the "GOOOOOOL!" banner still sits over his head.

## 2026-11-19 and 20, the content pass and the new players

Ryan's go covered: a quieter sound, a second quote, tabs for the long sections, formal wording, his earlier content decisions except removing sections, and realistic players from Mixamo.

### Words and layout

- Every section is written in a formal register, and built from one set of parts with one set of gaps (`.sec`, `.part`, `--gap-block`, `--gap-item`). The long sections are split with tabs (`Tabs.tsx`): Projects, Skills, Awards and In the News.
- Skills, Now and GitHub stay as sections (Ryan reversed the earlier decision to drop them).
- The quote under the photo album is a second, different one from the same published article.
- The sound is about ten decibels quieter and no longer one steady hum: a low murmur with far-off swells, claps and a drum at random.

### The players

- The code-drawn figures are gone. Every player is a copy of one model, rebuilt in Blender from Mixamo's "Remy" (body and skeleton only) and moved by Mixamo motion capture: `blender/build_players.py`, section 11 of WHERE-TO-EDIT.md.
- What the build does to the base: an athlete's build; the thighs the base model comes without; shorts shortened and cleared of pockets; long socks cut level under the knee; the shirt's picture made white with a gold collar and cuffs; hair and eyebrows near black, eyes brown, one skin colour all over so a single tint suits it; short curls and three beards as separate pieces; four standing poses worked out from where the hands and feet should be.
- Each player is told apart by `kits.ts`: skin tone, hair, beard, height and number. No face is taken from a photograph.
- The clips had their travel over the ground taken out and written down, with the moment and place of each kick, so the site can stand a player where his boot will meet the ball.
- The goals are re-timed to speeds a person can run. The two guest goals are scored past a goalkeeper. Number 66's Easter egg moved from a locker to a shirt on the bench, and he now comes on to hit the pass himself.
- Mixamo's own files are not in the repo.

### Numbers, not names (2026-11-20)

- Ryan's decision: only number 8 has a name on his shirt (SAINI). Every other player is a number and nothing more (6, 10, 66 and the goalkeeper's 1): on the shirt, in the goal banner, on the ring of screens, in the code and in these notes. The Interests line on the About page was reworded to match.
- Number 8 is drawn to Ryan's own description: 1.85 m, brown skin, a full goatee joined to the moustache, an athletic build (`KITS.saini` in `players/kits.ts`).
- The build changed for it: broader shoulders, a deeper chest, a narrower waist, fuller arms, calves and thighs (`SHAPE` and `THIGH` in `blender/players/params.py`). The base model's red blotches are evened out and its pores smoothed, so a brown tint comes out clean, not rusty (`SKIN_EVEN`, `SKIN_SMOOTH`). The goatee is one oval round the mouth with the lips left bare (`_circle` in `blender/players/head.py`).
- The goalkeeper's number is printed in white: navy was lost on his green shirt. His dive was recorded one way only, so in one of the two goals he is shown as in a mirror, and his number came out back to front; a mirrored player's shirt is now printed the other way round (`Player.tsx`, `keeperMirrored` in `Cast.tsx`).
- Looked at and left alone: the fingers in the hands-on-hips pose. The breathing clip already curls them about as much as a hand resting on a hip would.

### The start of a visit

- A first visit opens in the players' tunnel: my name, "Start the tour", and the pitch lit at the far end. Pressing it plays the walk-out and opens About. The top bar is there throughout, and visitors who prefer less motion never see it.
- The tunnel is lit from its mouth: dark at the back, brighter toward the pitch.

### The résumé

- The PDF is set to match the LaTeX original: Computer Modern, the same margins, sizes and spacing, so its lines turn where the original's do. Two differences only: the email address where the phone number was, and "Plater" spelt correctly.

### Found on the way

- The lettering on the ring of screens was upside down (a model counts a picture's rows from the top, a painted canvas from the bottom).
- The goal banner sat over the scorer's face in his close-up; it is now in the lower third.
- The shirt on the bench could be clicked from the start screen, through the tunnel wall.

### Not done

- The stadium is still empty: no crowd.
- The players share one face. Hair, beard, skin tone, height and build do the work of telling them apart.
- The on-page résumé (the web version of the sheet) is still set in Times, not Computer Modern.
