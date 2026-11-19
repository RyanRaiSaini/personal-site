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
- Seven eggs: Jude's penalty, Mbappé's corner-flag goal, the "hala" fireworks (also the classic cheat code), the VAR 404 page, the fifteenth click on the trophy cabinet, the basketball, and locker 66.
- Opening a project replays a goal by number 8.
- All seven were triggered with real clicks or key presses during testing.

### Phase 8: match view, 404, extras

- `/match`: the whole site on one page, with a match clock that follows the scroll.
- Red-card 404, error page, sitemap, robots rules, number 8 icon, link-preview image.

### Phase 9: sound and polish

- Crowd, roar, thump and whistle synthesised in the browser (`lib/audio.ts`); off until the visitor turns it on.
- The home text no longer swallows clicks meant for the pitch.
- Stars redrawn as points, the trophy room brightened, several camera framings widened.

### Known gaps and things to look at next

- The résumé PDF was checked for length (one page) but not viewed as an image on this machine; open it once and check the layout.
- The notes under two awards ("Leader of Tomorrow…", "John Plater…") are general wording; replace with the exact criteria if wanted.
- No bloom or glow post-processing yet. It would make the floodlights and LED boards shine more, at some cost on laptops.
- The 3D tour on a phone works (lighter crowd, bottom sheet) but has had only a quick look.
- A friendlier address (for example `ryansaini.vercel.app`) can be added in Vercel's project settings; then update `profile.siteUrl`.
