# Before and after

Each pair was taken from the same camera position, at the same window size (1280 × 720, or 390 × 844 for the phone shots), by `npm run shots`. "Before" is the live site on the morning of 2026-11-19 (tag `checkpoint-before-realism`). "After" is the local site at the end of the same day.

The day shots use `?roof=open&time=14:00&weather=clear`, the night shots `?roof=closed&time=22:00&weather=clear`.

| View | Before | After |
|---|---|---|
| Home screen | ![](before/first-view.jpg) | ![](after/first-view.jpg) |
| Whole stadium | ![](before/overview.jpg) | ![](after/overview.jpg) |
| From a corner | ![](before/overview-corner.jpg) | ![](after/overview-corner.jpg) |
| Pitch level | ![](before/pitch-level.jpg) | ![](after/pitch-level.jpg) |
| Centre circle | ![](before/centre-circle.jpg) | ![](after/centre-circle.jpg) |
| The goal | ![](before/goal.jpg) | ![](after/goal.jpg) |
| The dugout | ![](before/dugout.jpg) | ![](after/dugout.jpg) |
| Main stand | ![](before/main-stand.jpg) | ![](after/main-stand.jpg) |
| Roof and screens | ![](before/roof-and-screen.jpg) | ![](after/roof-and-screen.jpg) |
| Night, whole stadium | ![](before/night-overview.jpg) | ![](after/night-overview.jpg) |
| Night, pitch level | ![](before/night-pitch-level.jpg) | ![](after/night-pitch-level.jpg) |
| About, panel open | ![](before/about-panel.jpg) | ![](after/about-panel.jpg) |
| Phone, 3D tour | ![](before/phone-tour.jpg) | ![](after/phone-tour.jpg) |
| Phone, match view | ![](before/phone-match.jpg) | ![](after/phone-match.jpg) |

## After only

These views are new, or were not photographed before.

| View | After |
|---|---|
| Day, roof closed | ![](after/day-roof-closed.jpg) |
| Projects, panel open | ![](after/projects-panel.jpg) |
| Experience, panel open | ![](after/experience-panel.jpg) |
| GitHub, panel open | ![](after/github-panel.jpg) |
| Now, panel open | ![](after/live-panel.jpg) |

## What the pairs do not show

- The section cameras themselves moved (longer lenses, see `SPOTS` in `app/components/world3d/spots.ts`). The centre-circle, goal, dugout and main-stand pairs use the old camera positions so that they line up; the panel shots show the new framing.
- The player figure and the five rooms are unchanged in this pass.
