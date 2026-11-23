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
- The arms-wide celebration is the exception. At the end of an outstretched arm the same half-curled fingers read as limp, so that pose now holds the hands open (`arms_wide` in `blender/players/stances.py`). The model file did not change: only the list of bones the pose fixes, in `player.json`.

### The shorts on a raised leg (2026-11-20)

- With his foot on the ball, number 8's raised leg looked like a thin stick inside a white bell. The cause was in the base model. It has no legs, so each leg of its shorts is closed off inside by a level sheet a little above the hem. The thigh built for it stood through that sheet, and from in front the sheet showed as a white ceiling round the leg.
- The same sheet had been taken for the crotch, so the cloth was only ever fitted to the thigh in its last two centimetres. To stop the thigh showing through higher up, its hidden part had been drawn in thin: the stick.
- `fit_shorts` (`blender/players/kit.py`) now takes the sheet out, finds the real crotch (0.795 m up, not 0.689) and hangs the cloth 14 mm clear of the thigh's own outline all the way up. The thigh stays full under the cloth and sits forward of the shin's line, where a thigh's bulk is (`THIGH` in `params.py`). The hem hangs straight and level.
- `blender/check_players.py` proves it: it plays the ten clips and four poses and measures 360 places on the thighs against the cloth. Nothing shows through, and the cloth comes no nearer than 12 mm. Run on the model from before, the same check fails.
- The inside of the shirt's hem was gold (its turned-in edge shares the collar's part of the picture) and showed as a fleck at the hip. It is white now.

### The goalkeeper in number 8's goal (2026-11-20)

- Number 1 had been built for the two hidden goals only, so the goal visitors see most, number 8's replay when a project is opened, went into an empty net. Ryan pointed this out. He is now in goal for it too, and dives the right way a moment too late (`keeper: "late"` in `GOALS.saini`, `players/shows.ts`). At first he came on only while the replay played, so the Projects view still showed an empty net; he now waits on his line the whole time Projects is open (`Cast.tsx`).

### Four rooms made cleaner (2026-11-22)

- **GitHub:** the picture in the seats is gone. With only a few active days it was a handful of white seats that showed as torn chunks in the rows. An LED scoreboard now hangs under the main stand's second tier (`stadium/GithubBoard.tsx`), and the panel shows the last 16 weeks instead of a mostly empty year.
- **Trophy room:** the four cases stand closer, so all show beside the panel; matt glass and softer lamps take away the glare; larger plaques; a plain stone floor; a navy runner, velvet ropes and a warm-lit cabinet.
- **Ticket office:** the programme's frame no longer covers the TICKETS sign and its glare is gone; a matchday board and two pendant lamps fill the dark ceiling.
- **Dressing room:** boots under every locker, the match ball on the edge of the crest in a pool of light, a bag of training balls in the corner; the plank bench that hid the crest is gone and the ceiling ring is dimmed.
- **Mixed zone:** four broadcasters' microphones (plain coloured cubes, no names) clamped to the barrier, and a TV camera on the player; the pole microphones and the glaring ceiling strips are gone.
- **Press room:** a lighting rig over the stage, a softbox, two broadcast cameras with red lights, a centre aisle, a navy carpet and PRESS on the chair backs; the ceiling panels are dimmed so the light falls on the desk.

### Overnight polish (2026-11-22 to 23)

- **The ticket office** (Ryan: "hideous"). The lit booths behind the windows sat behind the back wall, so the windows were grey; they glow now, with a clerk inside. Club-blue walls with a navy band, ceiling panels of light, carpeted queues with gold GATE A markings, a club banner, a framed player profile with my photo, and a scarf wall. Number 8 stands in the queue.
- **The trophy room** is the HALL OF HONOURS, with SALA DE TROFEOS beneath.
- **The flat view's name** is centred and much larger.
- **The near crowd** reads as different people: rounded figures, five hair colours, beanies, club scarves, each fan turned his own way.
- **The players' beards** have a fine hair grain instead of a flat black shape; eyes a touch softer.
- **The panels and the home card** are match-broadcast graphics: deep royal in either theme, a header bar with a slanted title and a gold sash, angled corners, tinted blocks and slanted tabs instead of grey-outlined boxes.
- **Fixed:** Projects opened with the first project already open, so opening it did not play the goal; the boxed tags are gone (lists read as one line of text, and Experience drops its tag rows).

### A full ground (2026-11-22)

- About 54,000 fans now sit in 86% of the seats (`stadium/Crowd.tsx`). Each is a flat cut-out facing the pitch, all drawn in one step: four poses (arms down, an arm up, arms folded, clapping), seven shirt colours led by the home white, a range of skin tones, a little variation in size. They take the same worked-out light as the seats, so they sit in the roof's shade by day and under the floodlights at night.
- Seen from far off, the blue of the seats showed round every fan and the stands still looked empty, so a taken seat is now darkened to the colour of legs and coats (`TAKEN` in `Seats.tsx`); which seats are taken is shared in `stadium/crowdPlan.ts`.
- When a goal goes in, the crowd jumps for a few seconds, each fan in his own time.
- Close to the stands the cut-outs looked flat, so any block of seats within 30 metres of the camera and in view now has fans in the round instead (`stadium/fanFigure.ts`): a seated figure of about 170 triangles with head, hair, arms and legs, his own shirt and skin, and one in eight with an arm raised. Blocks behind or beside the camera keep their cut-outs. The closest view of the stands draws about 2,700 of them, some 460,000 triangles, and still runs at 60 pictures a second. At first the overview camera, which sits above the east stand, put figures in the blocks just below it, seen only from behind; a block now swaps only when the camera is on the pitch side, facing the fans.
- A second pass made them less like copies of one figure: rounded bodies and heads, hair in five colours, a beanie on one in five and a club scarf on about a third, and each fan turned a little in his seat with his head turned his own way (`aLook` in `Crowd.tsx`, read by `fanFigure.ts`).
- Found on the way: the random numbers behind each seat were related to one another, so whether a seat was taken decided part of the fan's pose and shirt. No taken seat could ever get the raised-arm pose, and the shirts were not in their intended shares. They are now properly mixed (`seatHash` in `crowdPlan.ts`).
- Cost, on the overview by day (1280 x 720, development server): about 40 pictures a second against 48 before; About is unchanged at 60; nothing at rest. The "low" quality level goes without the crowd.

### Floodlight beams at night (2026-11-22)

- At night, shafts of light now fall from the ring of lamps under the roof, brightest at the lamps and fading toward the pitch, with a halo along the lamp bar (`stadium/FloodBeams.tsx`). It is one see-through surface swept round the bowl and painted in its shader, so it never hides anything. By day it fades away.
- Cost, measured on the overview at night (1280 x 720, development server): about 43 pictures a second with the beams against about 50 without, and nothing at rest. The "low" quality level goes without them.

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

- ~~The stadium is still empty: no crowd.~~ Done on 2026-11-22: see "A full ground" below.
- The players share one face. Hair, beard, skin tone, height and build do the work of telling them apart.
- The on-page résumé (the web version of the sheet) is still set in Times, not Computer Modern.

## 2026-11-23, the realism night

### A crowd of real people

- The fans are no longer painted cut-outs. Two of Mixamo's stock characters are sat down by motion capture and rendered in Blender in four poses each (hands on knees, an arm up, both arms up, both arms high): `blender/build_crowd.py`, `npm run crowd:build`, then `npm run crowd:pack`.
- A second picture marks each person's shirt, skin, trousers and hair, so every fan gets his own shirt colour, skin tone, trousers and hair colour. Half are drawn as in a mirror, so the two men make many more faces.
- The fans in the round near the camera (`fanFigure.ts`) are gone: the rendered people look better up close than they did, and cost less.
- Each fan's card is cut to the outline of the person on it (`boxes` in `crowd.json`). Only about a quarter of each cell is person, and the empty part costs as much to draw.
- Cost, overview, 1280 x 720, development server, on mains: about 52 pictures a second with the crowd against 59 without it.

### A broadcast picture

- The picture is now finished as a television match picture is graded (`atmosphere/grade.ts`): the same ACES curve as before, then a little more contrast, richer colour, shadows a touch cool and highlights a touch warm. It costs nothing: it fills in three.js's "custom" tone mapping, the renderer's own last step, and at "high" it replaces the tone-mapping step of the glow pass.
- The mowing stripes were scaled by how far the camera looked along the pitch, so from the stands (looking across it) they all but vanished. They now keep most of their strength from every side, and are stronger (`STRIPE` 0.15). The grass is a deeper, cleaner green.
- The floodlight beams at night are fainter (`STRENGTH` 0.22): they had been washing out the stands.

### Smoother camera, and goals shot like television

- Every camera move now runs through a soft spring (`FOLLOW`, 0.16 s): the camera follows its plan as a camera on a crane does, so a flight cut short, a change of section mid-flight, or a show handing back control never jerks. Shows that want a hard cut still get one (`rig.snapOverride`).
- Flights turn the view along the arc between the first and last directions instead of sliding the look-at point in a straight line, which had swung the view round when the two pointed different ways. The easing is gentler at both ends (no jolt in speed or acceleration).
- **Fixed:** flights between the pitch and somewhere high went through the stands (after a guest goal, the camera flew back to the overview through the seats). Such flights now climb above the lower end first and travel at height.
- The guest goals are directed like a match broadcast: the strike on the main camera high in the main stand, panning with the taker and then the ball on a long lens; a cut to a hand-held camera at the scorer's shoulder as he wheels away; then the slow turn round him.
- Speed readings tonight were lower across the board because OneDrive was syncing hard in the background. With the crowd shown and hidden in turn, its cost was unchanged at about 8 pictures a second.

### The players: cloth, skin, and getting about

- The kit, skin, hair and boots use three.js's physical material: the kit has a soft sheen where the cloth turns from the light, the skin a warm glow round its edges (standing in for light scattered under it), the hair a sheen, and the boots a lacquered shine (`FABRIC` and the materials in `players/Player.tsx`).
- Number 8 no longer jumps between spots. A long way off, he is put a few metres short of his mark and runs in, slowing as he arrives, while the camera comes in; a short way, he jogs or turns on the spot. Changing from one way of standing to another is a fade, and after his own replay he jogs back from where he celebrated, out of the celebration's last pose rather than snapped out of it (`RUN_IN`, `BRAKE`, `RESTANCE` in `players/Cast.tsx`).

## 2026-11-23, Ryan's notes, the same night

- **The font** is now Saira (headings in Saira Condensed): a geometric sports face, closer to match graphics than Barlow was (`app/fonts.ts`). The panel headers, section titles, highlighted numbers and the coursework line are centred, like a presentation slide.
- **Fixed: the crowd disappeared during a goal.** When the picture runs slow for a few seconds the site steps down a quality level by itself, and "low" hid the crowd for the rest of the visit. A goal's camera work is the busiest moment, so that is when it happened. At "low" the crowd is now thinned to 40%, spread evenly (`LOW_SHARE` in `stadium/Crowd.tsx`), never hidden.
- **The last section leads out:** "next" from Contact goes to the whole stadium, not round to About (`panelText` in the data file).
- **No more Spanish** on the signs, ring screens or Easter eggs.
- **GitHub** shows the last 4 weeks, as a calendar with each day's count in its square, in the panel and on the scoreboard.
- **The ticket office** has the résumé itself in the frame between the windows (a picture of its first page, `npm run resume:image`), a board of four numbers from the résumé where the banner was, "Ticket office" over the windows, and "Open" signs in the windows instead of the two shapes that stood for clerks.
- Found on the way: a material that is given its picture only after it first draws keeps the shader it was built without, so the résumé frame showed blank. It is keyed now, so a new material is made when the picture arrives.
- **Someone at each ticket window:** a clerk in a navy staff polo sits behind each counter, one of the crowd's rendered people recoloured (`rooms/clerk.ts`).
- **The trophy plaques are readable:** each award has a short plaque name in the data file (`plaque`), set large on a plaque that fills the pedestal's front, with its value or giver beneath.
- **Make-A-Wish and the NBA** now opens with STARboard (a large portrait card and a link to the board), then the three numbers, three photos from All-Star weekend, the quote, and the story in full at the bottom.
- **Real materials in the rooms.** Nine more Poly Haven surfaces (CC0): walnut, white leather, marble, rubber tiles, polished concrete, laminate, plaster, a carpet weave and metal plate (`npm run stadium:assets`; about 540 KB on the site). `rooms/surfaces.ts` makes a material from any of them. Every room's walls and ceiling are now real plaster in the room's colour; the dressing room has rubber tiles, the trophy room marble, the ticket office polished concrete, the press room laminate.
- **The dressing room, rebuilt as a top club's:** white walls and ceiling, walnut lockers with quilted white leather backs and padded seats, a lit plate with number and name over every locker, a folded towel and a bottle at each seat, boots in a different colour for every player, a tactics board showing the eleven in their 4-3-3, and a white carpet with navy and gold rings.
- **Reporters in the press room:** eight of the twelve seats are taken, one with his hand up, and two more cameras stand at the side and the back. The crowd's two people were rendered again from behind for them (`npm run crowd:build:back`).
- **Contact is out on the pitch:** a flash-interview backdrop on the grass between the tunnel and the home dugout, with three microphones on stands, a camera and a light, and boards with my email and LinkedIn either side. Number 8 stands in front of it, facing the camera, with the crowd behind. The dark mixed-zone room is gone (`stadium/FlashZone.tsx`; `FLASH` in `dims.ts`).
- **Logos:** the Make-A-Wish and NBA logos head the "Make-A-Wish and the NBA" tab, on a white strip (`public/logos/`, sources in `docs/redesign/ASSETS.md`).
- **The bowl, up close:** the pitch takes the grain of the photographed lawn near the camera, fading out in the distance (its colour still comes from the shader), and the dugout seats are padded leather.

## 2026-11-24, more realism

- **The glass on the front walls no longer reads as a grey band.** It was a pale tint lit by the sky, which washed out the first rows; it is now a faint dark tint with the sky's reflection, nearly invisible head-on, as stadium glass is (`Glass` in `stadium/materials.ts`).
- **The boards round the pitch are switched-on LED screens** showing plain club blue, darker at the foot, with the grid of lamps visible up close. Still no words and no sponsors (`LED` in `stadium/AdBoards.tsx`).
- **The crowd is never quite still:** each fan shifts slowly from side to side and settles, at his own pace (`stadium/Crowd.tsx`). It moves only while the picture is drawn, so the page still rests.
- **The tunnel** has rubber tiles underfoot and wear in the wall paint (Poly Haven photos laid over its painted light).
- **Photographers behind each goal line:** eight a side on low stools, in hi-vis bibs, long lenses on the pitch, as at every televised match (`stadium/Photographers.tsx`).
- **Stewards along both touchlines,** on chairs on a step at the foot of the stand, facing the crowd in hi-vis vests (seen from behind; `stadium/Stewards.tsx`).
