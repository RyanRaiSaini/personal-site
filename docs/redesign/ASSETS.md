# Assets, sources and licences

Everything the redesigned stadium is made from, where it came from and what its licence asks for. Checked on 2026-11-19. No paid asset or service is used.

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

## Surfaces and sky (Poly Haven)

All from [Poly Haven](https://polyhaven.com), all [CC0](https://polyhaven.com/license): free to use, change and publish, with no credit required. They are credited anyway.

| Asset | Page | Used for | Files in `public/stadium/` | Size as used |
|---|---|---|---|---|
| Brushed Concrete | <https://polyhaven.com/a/brushed_concrete> | Steps, walkways, risers | `textures/brushed_concrete_{diff,nor,arm}.webp` | 1024 × 1024 |
| Painted Concrete 02 | <https://polyhaven.com/a/painted_concrete_02> | Walls, tier fronts, undersides, the wall round the pitch | `textures/painted_concrete_02_{diff,nor,arm}.webp` | 1024 × 1024 |
| Corrugated Iron 02 | <https://polyhaven.com/a/corrugated_iron_02> | The roof deck (bumps and roughness only) | `textures/corrugated_iron_02_{nor,arm}.webp` | 1024 × 1024 |
| Sparse Grass | <https://polyhaven.com/a/sparse_grass> | Blade detail on the pitch (bumps and roughness only) | `textures/sparse_grass_{nor,arm}.webp` | 1024 × 1024 |
| Kloofendal 48d Partly Cloudy (Pure Sky) | <https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky> | The daytime sky and the light it gives | `sky.jpg` (4096 × 1024, the picture), `sky-light.hdr` (512 × 256, the light) | as listed |

How they are handled:

- Downloaded at 1K by `npm run stadium:assets` (`scripts/fetch-polyhaven.mjs`) through Poly Haven's public API, and saved as WebP.
- `diff` is colour (sRGB). `nor` is the bump direction and `arm` packs creases, roughness and metal into one picture; both are read as plain numbers, not colour.
- Each texture is told how many metres of real surface it covers (`SURFACES` in `app/components/world3d/stadium/materials.ts`), and the model carries its surfaces' positions in metres, so the concrete's grain is life-size.
- The sky photo fixes the sun's height (48 degrees). `blender/sky.py` cuts the light map from the full photo and clamps the sun's disc so reflections do not sparkle.

## Fonts

| Font | Source | Licence |
|---|---|---|
| Barlow and Barlow Condensed, by Jeremy Tribby | Google Fonts, loaded through `next/font` (`app/fonts.ts`) | SIL Open Font License 1.1 |

## Tools

| Tool | Used for | Cost |
|---|---|---|
| Blender 5.3 | Building the stadium and working out its light | Free |
| glTF-Transform, meshoptimizer | Packing the model for the web (`scripts/pack-stadium.mjs`) | Free, open source |
| Three.js, React Three Fiber, drei | Drawing it in the browser | Free, open source |
| puppeteer-core with the Chrome already installed | Screenshots and measurements (`scripts/shots.mjs`, `scripts/measure.mjs`) | Free |

## Not used, on purpose

- No club crest, kit design, sponsor mark or anthem. The boards round the pitch and the ring of screens are blank.
- No photographs of the real stadium. The three reference pictures looked at during the work were for proportion only and are not in the repo or on the site.
