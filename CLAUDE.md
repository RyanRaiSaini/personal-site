# Working on this repo

@AGENTS.md

This is Ryan Rai Saini's personal site: a portfolio set inside a 3D football stadium. Read [WHERE-TO-EDIT.md](WHERE-TO-EDIT.md) first; it maps every piece of the site to its file.

## How Ryan wants work done here

- **Commit after every single change, and push.** Small, real, well-named commits, each one doing one thing. Never make empty or filler commits.
- **Commit to `main`.** Contributions only count on the default branch, and Vercel deploys from it.
- Push in small batches (a few commits per push). Each push triggers a Vercel deployment, and the Hobby plan caps deployments per day.
- Ask your questions before starting a big piece of work, and wait for a clear "go".
- When work is finished, give a complete rundown: what changed and exactly which file each thing lives in.

## Ground rules for the content

- All text lives in `app/data/portfolio.ts`, the résumé in `app/data/resume.ts`. Do not hard-code copy in components.
- The public résumé must never include a phone number.
- No official Real Madrid assets: no crest, no official kit design, no sponsor logos, no anthem audio, no photos of players. The kit is plain white with a name and number. The boards round the pitch and the ring of screens stay blank (Ryan asked for no sponsors on 2026-11-19).
- "Number 8" appears on Ryan's shirt and nowhere else: not in headings, badges, the tab icon or the rooms.
- The credit for the scan the stadium was measured from (`colophon.credits`) is required by its licence. Do not remove it. Sources and licences are in `docs/redesign/ASSETS.md`.
- Players other than number 8 (Ryan) appear only in Easter eggs, with one exception: the goalkeeper (number 1) also stands in the north goal while Projects is open and faces number 8's project replay (Ryan asked for it on 2026-11-20). Their skin tones in `players/kits.ts` were chosen with care; do not change them without Ryan's say-so. The goalkeeper is nobody in particular.
- **Only number 8 has a name on his shirt (SAINI).** Every other player is a number and nothing more: 6, 10, 66 and 1. No other player is named anywhere: not on a shirt, a banner or a screen, and not in the code, the comments or these notes (Ryan's decision on 2026-11-20, to keep clear of any dispute over a real player's name).
- No player's face comes from a photograph. Players are told apart by number, skin tone, hair, beard, height and celebration.
- Photo captions stay general ("All-Star Media Day"). Do not name people in individual photos.
- Ryan does not know SQL. Do not list it as a skill.

## Technical notes

- Next.js 16 with Cache Components. Read the bundled docs in `node_modules/next/dist/docs/` before using a Next API.
- The 3D world (`app/components/world3d/`) is loaded only in the browser, after the page's text. Nothing outside that folder may import from `three`, or the main bundle grows by half a megabyte. The pure data files there (`spots.ts`, `players/shows.ts`, `players/moves.ts`, `players/notes.ts`, `players/kits.ts`, `stadium/dims.ts`, `tagScreen.ts`, `activity.ts`) are safe to import anywhere.
- The stands, roof and seats are a model built by the Python scripts in `blender/` and loaded from `public/stadium/`. To change the stadium's shape, change `blender/stadium/params.py` and rebuild (WHERE-TO-EDIT.md, section 10); do not edit `stadium.glb` by hand. The sun's direction is set in two places that must match: `daylight.ts` and `SUN` in `params.py`.
- The players are one model (`public/players/player.glb`) built by `blender/build_players.py` from a Mixamo base and Mixamo motion capture. To change the body, kit, hair, poses or clips, change the scripts in `blender/players/` and rebuild (WHERE-TO-EDIT.md, section 11); do not edit `player.glb` by hand. The Mixamo downloads are not in the repo and must not be added to it.
- The base model has no legs: its shorts were closed off inside, and the thighs are built by the scripts. After any change to the thighs, the shorts or the clips, run `blender/check_players.py` on the saved `.blend` (section 11); it plays every movement and fails if a thigh shows through the cloth.
- A player is moved by passing `play()` a list of clips to mix each frame (`players/moves.ts`); every clip's time is set by hand, so nothing runs on by itself. The player moves over the ground in code: the clips have had their own travel taken out, and `player.json` says how far each would have gone.
- The stadium's shadows and shade are worked out in Blender and travel with the model (`stadium/bakedLight.ts` reads them). The stadium casts and receives no live shadows; the one shadow map is for the players, the ball and the goals.
- The picture is drawn on demand (`frameloop="demand"`, driven by `FrameGovernor.tsx`): full rate while something moves or the visitor is active, 30 a second for a while, then nothing. Anything new that animates on its own must call `stir()` from `activity.ts` each frame while it moves, or it will freeze when the governor rests. Changes that go through the store wake it by themselves.
- A see-through material that is also double-sided needs `forceSinglePass`, or three.js rebuilds its shader lookup twice a frame.
- Per-frame changes to the page itself (styles on ordinary elements) are expensive here: one restyle of a name tag measured about half a millisecond. Move things in whole pixels and only when they have changed.
- Per-frame values live in plain shared objects (`atmosphere/state.ts`, `camera/CameraRig.tsx`'s `rig`), not React state. The lint rule `react-hooks/immutability` is switched off for the 3D folder for that reason.
- `useFrame` priorities: the atmosphere runs at -10, the camera at -5, everything else at 0. Never use a positive priority; it turns off automatic rendering.
- Positions are in metres. North is +X; the main stand is at -Z. Rooms are built far from the bowl, at the origins in `spots.ts`.
- The dev server sometimes misses an edit to `app/globals.css` made by a script. If a new style does not show up, add a blank line to the file and save again.
- A first visit opens on a start screen in the tunnel (`data-intro` on `<html>`: "start", then "play", then "done"; `app/lib/intro.ts`). While it shows, the camera holds still (`rig.holdStill`) and the picture rests like anywhere else.
- Test switches (`?time=`, `?weather=`, `?roof=`, `?quality=`, `?nointro=1`, `?view=`) and the console helpers `__world`, `__look`, `__tune`, `__bake` and `__activity` are listed in WHERE-TO-EDIT.md, section 8.
- To judge a visual change, take the fixed set of pictures (`npm run shots -- http://localhost:3000 <folder>`) and look at them; to judge a speed change, use `npm run measure`. Both drive the Chrome already installed, with no window, and use the laptop's own graphics chip.

## Before pushing

```bash
npm run lint && npm run typecheck
```

Run `npm run build` as well after anything that touches routing, data fetching or `next.config.ts`.
