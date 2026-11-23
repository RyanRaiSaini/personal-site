# Assets, sources and licences

Everything the redesigned stadium is made from, where it came from and what its licence asks for. Checked on 2026-11-19; the players and the résumé's typeface added on 2026-11-20. No paid asset or service is used.

## The stadium model

| | |
|---|---|
| What | The stands, tiers, aisles, entrances, roof, trusses, ring of screens, floodlights and seats |
| Made by | Built for this site in Blender 5.3, by the scripts in [`blender/`](../../blender) |
| Editable source | `C:\Users\ryanr\stadium-work\bernabeu-stadium.blend` (written by the build; kept outside the repo because it is large and can be rebuilt at any time) |
| Web version | [`public/stadium/stadium.glb`](../../public/stadium/stadium.glb), 1.67 MB, about 134,000 triangles |
| Licence | Original work, part of this repo |

The model is original geometry. Its overall proportions (252.6 m by 205.3 m, 58.8 m tall) were measured from one reference scan:

| | |
|---|---|
| Reference | "Estadio Santiago Bernabéu, Madrid" by **DALGO** |
| Source | <https://sketchfab.com/3d-models/estadio-santiago-bernabeu-madrid-0bd4abffd58146f7bb9c895aecf6462d> |
| Licence | [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/) |
| How it was used | Measured for outside dimensions only. None of its points or files are in this repo or on the site. |
| Credit shown on the site | In the small print on the home screen and the match view (`colophon.credits` in `app/data/portfolio.ts`) |

A second model, "santiago bernabeu" by Michael Persi (mikmikoni), CC BY 4.0, was examined and not used. See [MODELS.md](MODELS.md).

## The players (Mixamo)

| | |
|---|---|
| What | The footballers: number 8, the two guest scorers, number 66 and the goalkeeper. All are copies of one model. |
| Base character | "Remy", from Adobe's [Mixamo](https://www.mixamo.com) library, used for his body and skeleton only |
| Movement | Mixamo motion capture: its "Soccer Game Pack" (penalty kick, strike, jog, goalkeeper stance and dive, the long pass) and the single clips Breathing Idle, Running, Sitting Idle and Victory |
| Made by | Rebuilt for this site in Blender 5.3 by [`blender/build_players.py`](../../blender/build_players.py): an athlete's build, the thighs the base comes without, the plain white kit, dark hair and eyes, a second hairstyle, three beards and four standing poses |
| Web version | [`public/players/player.glb`](../../public/players/player.glb), 1.6 MB, with its timings in `player.json` |
| Licence | Adobe's [Mixamo FAQ](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html) allows characters and animations to be used "royalty free for personal, commercial, and non-profit projects". A free Adobe account is needed to download them. |
| What is not in this repo | The files as downloaded from Mixamo. They are kept in `C:\Users\ryanr\stadium-work\mixamo\` and can be downloaded again from Mixamo at any time. Only the rebuilt model is here; it is part of this site and is not offered for reuse on its own. |

## The crowd (Mixamo)

| | |
|---|---|
| What | The fans in the stands: pictures of two people sitting down, in four poses each; and, for the ticket office's queues (`queue-*`), the same two standing, seen from four sides, with two women (Mixamo's "Kate" and "Megan") |
| Characters | "Remy" and "Bryce", from Adobe's [Mixamo](https://www.mixamo.com) library; "Kate" and "Megan" for the queues only |
| Movement | Mixamo motion capture: Sitting Idle and Victory (the raised arms); Breathing Idle for the standing people |
| Made by | Seated and rendered in Blender 5.3 by [`blender/build_crowd.py`](../../blender/build_crowd.py), packed by [`scripts/pack-crowd.mjs`](../../scripts/pack-crowd.mjs). A second picture marks the shirt, skin, trousers and hair, so the site gives every fan his own colours. |
| Web version | [`public/stadium/crowd/`](../../public/stadium/crowd/), about 180 KB |
| Licence | As for the players above |
| What is not in this repo | The Mixamo downloads, as above |

No player's face is taken from a photograph. Each is told apart by his number, skin tone, hair, beard, height and celebration (`app/components/world3d/players/kits.ts`). The goalkeeper is nobody in particular.

## Surfaces and sky (Poly Haven)

All from [Poly Haven](https://polyhaven.com), all [CC0](https://polyhaven.com/license): free to use, change and publish, with no credit required. They are credited anyway.

| Asset | Page | Used for | Files in `public/stadium/` | Size as used |
|---|---|---|---|---|
| Brushed Concrete | <https://polyhaven.com/a/brushed_concrete> | Steps, walkways, risers | `textures/brushed_concrete_{diff,nor,arm}.webp` | 1024 × 1024 |
| Painted Concrete 02 | <https://polyhaven.com/a/painted_concrete_02> | Walls, tier fronts, undersides, the wall round the pitch | `textures/painted_concrete_02_{diff,nor,arm}.webp` | 1024 × 1024 |
| Corrugated Iron 02 | <https://polyhaven.com/a/corrugated_iron_02> | The roof deck (bumps and roughness only) | `textures/corrugated_iron_02_{nor,arm}.webp` | 1024 × 1024 |
| Sparse Grass | <https://polyhaven.com/a/sparse_grass> | Blade detail on the pitch: bumps, roughness, and the photo's light and dark close to the camera (not its colour) | `textures/sparse_grass_{diff,nor,arm}.webp` | 512 × 512 (diff), 1024 × 1024 |
| American Walnut Veneer | <https://polyhaven.com/a/american_walnut_veneer> | The dressing room's lockers | `textures/american_walnut_veneer_{diff,nor,arm}.webp` | 512 × 512 |
| Leather White | <https://polyhaven.com/a/leather_white> | Padded locker backs and seats | `textures/leather_white_{diff,nor,arm}.webp` | 512 × 512 |
| Marble 01 | <https://polyhaven.com/a/marble_01> | The trophy room's floor | `textures/marble_01_{diff,nor,arm}.webp` | 512 × 512 |
| Rubber Tiles | <https://polyhaven.com/a/rubber_tiles> | The dressing room's floor | `textures/rubber_tiles_{diff,nor,arm}.webp` | 512 × 512 |
| Smooth Concrete Floor | <https://polyhaven.com/a/smooth_concrete_floor> | The ticket office's floor (its colour taken out and set in code) | `textures/smooth_concrete_floor_{diff,nor,arm}.webp` | 512 × 512 |
| Laminate Floor 02 | <https://polyhaven.com/a/laminate_floor_02> | The press room's floor | `textures/laminate_floor_02_{diff,nor,arm}.webp` | 512 × 512 |
| Painted Plaster Wall | <https://polyhaven.com/a/painted_plaster_wall> | Every room's walls and ceiling, tinted in code (bumps and roughness only) | `textures/painted_plaster_wall_{nor,arm}.webp` | 512 × 512 |
| Fabric Pattern 07 | <https://polyhaven.com/a/fabric_pattern_07> | The dressing room's carpet weave (bumps and roughness only) | `textures/fabric_pattern_07_{nor,arm}.webp` | 512 × 512 |
| Metal Plate | <https://polyhaven.com/a/metal_plate> | Rails and fittings (bumps and roughness only) | `textures/metal_plate_{nor,arm}.webp` | 512 × 512 |
| Kloofendal 48d Partly Cloudy (Pure Sky) | <https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky> | The daytime sky and the light it gives | `sky.jpg` (4096 × 1024, the picture), `sky-light.hdr` (512 × 256, the light) | as listed |

How they are handled:

- Downloaded at 1K by `npm run stadium:assets` (`scripts/fetch-polyhaven.mjs`) through Poly Haven's public API, and saved as WebP.
- `diff` is colour (sRGB). `nor` is the bump direction and `arm` packs creases, roughness and metal into one picture; both are read as plain numbers, not colour.
- The rooms' surfaces (added 2026-11-23) are made by `app/components/world3d/rooms/surfaces.ts`, which repeats each one to the size of what it covers.
- Each texture is told how many metres of real surface it covers (`SURFACES` in `app/components/world3d/stadium/materials.ts`), and the model carries its surfaces' positions in metres, so the concrete's grain is life-size.
- The sky photo fixes the sun's height (48 degrees). `blender/sky.py` cuts the light map from the full photo and clamps the sun's disc so reflections do not sparkle.

## Logos

Shown at the top of the Awards section's "Make-A-Wish and the NBA" tab, beside Ryan's own involvement with both, at Ryan's request (2026-11-23). Both files are marked public domain on Wikimedia Commons; the marks themselves are the organisations' trademarks.

| Logo | Source | File |
|---|---|---|
| Make-A-Wish (International) | <https://commons.wikimedia.org/wiki/File:Make-A-Wish_International_logo_RGB.png> | `public/logos/make-a-wish.png` |
| NBA | <https://commons.wikimedia.org/wiki/File:National_Basketball_Association_logo_2017-present.svg> | `public/logos/nba.svg` |

## Fonts

| Font | Source | Licence |
|---|---|---|
| Saira and Saira Condensed, by Omnibus-Type | Google Fonts, loaded through `next/font` (`app/fonts.ts`) | SIL Open Font License 1.1 |
| CMU Serif (Computer Modern Unicode), by Andrey V. Panov after Donald Knuth | The `computer-modern` package on npm; three files kept in [`scripts/fonts/`](../../scripts/fonts) | SIL Open Font License 1.1 (`scripts/fonts/OFL.txt`) |

CMU Serif is used only to set the résumé PDF (`scripts/build-resume-pdf.mjs`), so that it matches the LaTeX original. It is not loaded by the site's pages.

## Tools

| Tool | Used for | Cost |
|---|---|---|
| Blender 5.3 | Building the stadium and working out its light; rebuilding the player | Free |
| glTF-Transform, meshoptimizer, sharp | Packing the models for the web (`scripts/pack-stadium.mjs`, `scripts/pack-players.mjs`) | Free, open source |
| pdfkit | Setting the résumé PDF | Free, open source |
| Three.js, React Three Fiber, drei | Drawing it in the browser | Free, open source |
| puppeteer-core with the Chrome already installed | Screenshots and measurements (`scripts/shots.mjs`, `scripts/measure.mjs`) | Free |

## Not used, on purpose

- No club crest, kit design, sponsor mark or anthem. The boards round the pitch and the ring of screens are blank.
- No photographs of players, and no player's likeness taken from one.
- No photographs of the real stadium. The three reference pictures looked at during the work were for proportion only and are not in the repo or on the site.
