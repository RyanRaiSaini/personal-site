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
- No official Real Madrid assets: no crest, no official kit design, no sponsor logos, no anthem audio, no photos of players. The kit is plain white with a name and number.
- Players other than number 8 (Ryan) appear only in Easter eggs. Skin tones in `players/kits.ts` are chosen to match each player; keep them accurate.
- Photo captions stay general ("All-Star Media Day"). Do not name people in individual photos.
- Ryan does not know SQL. Do not list it as a skill.

## Technical notes

- Next.js 16 with Cache Components. Read the bundled docs in `node_modules/next/dist/docs/` before using a Next API.
- The 3D world (`app/components/world3d/`) is loaded only in the browser, after the page's text. Nothing outside that folder may import from `three`, or the main bundle grows by half a megabyte. The pure data files there (`spots.ts`, `players/shows.ts`, `players/poses.ts`, `stadium/dims.ts`, `tagScreen.ts`) are safe to import anywhere.
- Per-frame values live in plain shared objects (`atmosphere/state.ts`, `camera/CameraRig.tsx`'s `rig`), not React state. The lint rule `react-hooks/immutability` is switched off for the 3D folder for that reason.
- `useFrame` priorities: the atmosphere runs at -10, the camera at -5, everything else at 0. Never use a positive priority; it turns off automatic rendering.
- Positions are in metres. North is +X; the main stand is at -Z. Rooms are built far from the bowl, at the origins in `spots.ts`.
- The dev server sometimes misses an edit to `app/globals.css` made by a script. If a new style does not show up, add a blank line to the file and save again.
- Test switches (`?time=`, `?weather=`, `?roof=`, `?quality=`, `?nointro=1`, `?view=`) and the console helpers `__world` and `__look` are listed at the end of WHERE-TO-EDIT.md.

## Before pushing

```bash
npm run lint && npm run typecheck
```

Run `npm run build` as well after anything that touches routing, data fetching or `next.config.ts`.
