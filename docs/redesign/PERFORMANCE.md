# What the stadium costs to run

Measured on 2026-11-19 with `npm run measure` (`scripts/measure.mjs`). No frame rate is promised here: these are readings from one laptop, and they moved by a factor of two to three with the laptop's power state. What did not move is the important part: **when the page is left alone, nothing is drawn and the processor is idle.**

## The machine and the conditions

| | |
|---|---|
| Computer | Laptop, 12th Gen Intel Core i5-1235U (12 threads), 16 GB memory, Windows 11 |
| Graphics | Intel Iris Xe, built in (through Chrome's Direct3D 11 layer) |
| Browser | The installed Chrome, run with no window. It uses the real graphics chip, not a software stand-in. |
| Windows power plan | Balanced |
| Also running | The development server, Blender, the Claude app, and OneDrive syncing this folder |
| Afternoon readings | Development server. Power state not recorded. |
| Evening readings | Production build (`npm run build`, `npm run start`). **On battery**, at 90%. |

Window sizes: 1280 × 720 at 1×, and 1536 × 864 at 1.25× (which is 1920 × 1080 dots, a typical laptop screen). Each reading is 5 or 6 seconds.

What the columns mean: **drawn** is pictures of the stadium drawn per second (a screen shows 60 at most). **Busy** is the share of time the page's main thread was working; **script** and **style** are parts of it.

## 1. Before the performance work

The new stadium, the same afternoon, before anything below was done. 1280 × 720 at 1×, development server.

| Situation | Drawn / s | Busy | Script | Style |
|---|---|---|---|---|
| Overview | 37 to 39 | 77% | 37% | 30% |
| About open | not counted | 53% | 43% | 2% |
| Overview, left alone for 40 s | still drawing | 52% | 30% | 14% |
| About, left alone for 40 s | still drawing | 47% | 38% | 2% |

It never stopped drawing, and a third of the overview's time went on restyling the page, not on 3D.

## 2. After, in the afternoon

Development server, 1536 × 864 at 1.25× (1920 × 1080 dots), "medium" quality.

| Situation | Drawn / s | Busy | Script | Style |
|---|---|---|---|---|
| Overview, pointer moving | 39.1 | 45% | 28% | 5% |
| Overview at night, pointer moving | 36.2 | 47% | 28% | 6% |
| Overview, hands off (capped at 30) | 30.1 | 35% | 19% | 5% |
| About, pointer moving | 53.0 | 34% | 28% | 0% |
| Either page, left alone | **0** | **0%** | 0% | 0% |

For comparison, the same window before the work gave 24 to 36 on these views.

## 3. After, in the evening, on battery

Production build. On battery the graphics chip is throttled, and it shows: the main thread has plenty of time left (15 to 40% busy), so the limit is the chip.

| Situation | 1280 × 720 at 1× | | 1920 × 1080 dots | |
|---|---|---|---|---|
| | Drawn / s | Busy | Drawn / s | Busy |
| Overview, pointer moving | 23.4 | 31% | 14.4 | 17% |
| Overview at night, pointer moving | 28.7 | 29% | 23.0 | 19% |
| Overview, hands off | 23.9 | 16% | 14.0 | 15% |
| Overview, left alone 60 s | **0** | **0%** | **0** | **0%** |
| About, pointer moving | 27.9 | 25% | 30.4 | 40% |
| About, left alone 25 s | **0** | **0%** | **0** | **0%** |
| Flat match view (no 3D) | none | 0% | none | 1% |

Because of these readings one more automatic step was added afterwards: if even the "low" level stays under 24 pictures a second, the stadium is drawn at three-quarter size (`lean` in the store). It was checked to switch on correctly; its effect on battery was not measured.

Each picture of the overview is about 244 drawing steps and 770,000 triangles; About is about 156 and 308,000.

## What each change was worth

These were measured on one page, seconds apart, by switching one thing off at a time, so they can be compared with each other.

| Change | Measured | Kept? |
|---|---|---|
| Name tags hidden altogether (to find out what they cost) | 35 → 54 pictures a second; 8 ms of restyling a frame → 0 | They now move in whole pixels and only when a frame is drawn, and their pins no longer pulse |
| The glow pass (bloom) off, at 1920 × 1080 | 39 → 60 | "High" quality only |
| Drawn at 1× in place of 1.25× | 47 → 60 or more | "Medium" stays at 1.25×; "low" is 1× |
| No live shadows | 2.5 ms a frame saved | Kept on "medium" and "high": they hold the player to the pitch |
| Floodlight lamps off by day | 1.8 ms a frame saved | Not done: switching lamps on and off makes the picture stall while it recompiles |
| Seats drawn with a simpler material | 25.8 → 20.6 ms a frame at best | Tried and removed: the seats looked like toys |
| See-through double-sided materials in one pass | about 8% of one processor core | Yes |

## What is downloaded

| File | Size |
|---|---|
| `stadium.glb`, the model | 1.67 MB |
| Seat positions and details (two files) | 1.45 MB |
| Ten surface textures | 1.07 MB |
| Sky photo and sky light | 0.58 MB |
| Ground light picture and measurements | 0.02 MB |
| **Total for the stadium** | **about 4.8 MB**, before the network's own compression |

The page's text, links and the flat view do not wait for any of it. A bar shows the progress.

## How it behaves

- **Full rate** while the visitor moves the pointer, drags, types or scrolls, and while anything is in motion (a camera flight, the roof, the walk-out, a goal).
- **30 a second** after that, for 45 seconds on the overview and 15 on a section.
- **Nothing** from then until the next input, and never while the tab is hidden.
- With "reduce motion" switched on in the device's settings, it rests after 4 seconds and the camera cuts instead of flying.

## Not measured

- A phone, a desktop with its own graphics card, Safari or Firefox.
- Loading time over a real connection.
- The live site: all readings are from this laptop serving itself.

## About the laptop itself

Two things on this machine affect any reading, and affect how it feels to work on the project:

- **Battery or mains.** The evening figures above are battery figures.
- **OneDrive.** The project folder is inside OneDrive. By the evening OneDrive had used about 33 hours of processor time, much of it uploading the thousands of files a build writes. That is a likely cause of the high processor use noticed while working, and it has nothing to do with visitors to the site. Keeping the repo outside OneDrive, or pausing syncing while developing, would stop it.
