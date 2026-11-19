# The two Sketchfab stadium models

Checked on 2026-11-19. Both files were downloaded from Sketchfab's own download window while signed in, then opened in Blender 5.3 and measured. Nothing here is taken from a description alone.

## Side by side

| | Model A | Model B |
|---|---|---|
| Title | Estadio Santiago Bernabéu, Madrid | santiago bernabeu |
| Author | DALGO | Michael Persi (mikmikoni) |
| Page | [sketchfab.com/3d-models/…0bd4abff](https://sketchfab.com/3d-models/estadio-santiago-bernabeu-madrid-0bd4abffd58146f7bb9c895aecf6462d) | [sketchfab.com/3d-models/…efb96fe1](https://sketchfab.com/3d-models/santiago-bernabeu-efb96fe1eb004570b5bde1cad0e3272f) |
| Published | 20 February 2025 | 28 August 2021 |
| Free download | Yes, with a free Sketchfab account | Yes, with a free Sketchfab account |
| Licence | CC BY 4.0 | CC BY 4.0 |
| Formats offered | .las 74 MB (original), glTF 32 MB, GLB 80 MB | .blend 25 MB (original), USDZ 2 MB, glTF 9 MB, GLB 8 to 10 MB |
| Format downloaded | glTF, 33.8 MB zip | glTF, 10.2 MB zip |
| Made of | 2,999,904 coloured points in 300 chunks. No surfaces. | 31 meshes, 18,601 faces, 29,784 vertices |
| Textures | None (a colour per point) | 14 colour images, 512 to 2048 pixels. No roughness or normal maps. |
| Stadium version | The renovated stadium, scanned from the air while still a building site | The old stadium: square bowl, open roof, four corner towers |
| Scale | True to life. Its units are feet; at 0.3048 it measures 252.6 m by 205.3 m and 58.8 m tall. | Not to scale (about 1.6 units to a metre) |
| Exterior | The real outer shape, as points. Cranes and site clutter included. | Simple boxes with painted windows |
| Roof | The real roof outline, as points | A thin open ring |
| Interior and seating | Unreliable: the middle is a mix of roof and excavation points | Flat sloping bands with a seat texture. No steps or rows. |
| Branding | None | "Realmadrid" lettered across the roof edge |
| Suits a browser | No: three million loose points cannot take materials or light | Yes for size, but it is the wrong building and low in detail |

## What the licence allows

Both models are under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/).

- **Changing them is allowed.**
- **Publishing them, or work based on them, on a public website is allowed,** including commercially.
- **The author must be credited,** with the title, the author's name, a link to the source and to the licence, and a note if it was changed.
- **The licence covers the author's copyright only.** It gives no right to club names, crests or sponsor marks that a model happens to show.

## Decision

Neither model is used as the stadium on the site.

- **Model A is the right building but the wrong kind of file.** It has no surfaces, and its interior is not usable.
- **Model B is the right kind of file but the wrong building,** and it is too plain to look believable.
- **They cannot be combined:** they show two different versions of the stadium.

The stadium is therefore **built new in Blender**, with free tools only:

- **Outer proportions come from Model A.** The scan gives the true footprint (252.6 m by 205.3 m) and height (58.8 m).
- **The interior follows the reference photographs** of the renovated stadium: stacked tiers of navy seats, dark structure, a steel roof with a ring of screens under its inner edge.
- **The pitch and its surroundings keep the site's existing measurements,** so every camera stop and clickable object stays where it was.

I also searched Sketchfab for other free, downloadable Bernabéu models. There were four in all; the other two date from 2019 and 2020, before the renovation was finished.

## Credit

Model A is used as a measuring reference, so its author is credited on the site:

> Stadium proportions measured from "Estadio Santiago Bernabéu, Madrid" by DALGO, licensed under CC BY 4.0.

Model B is not used on the site and needs no credit there.

## Where the files are

- Downloaded and unpacked: `C:\Users\ryanr\stadium-work\downloads\model-a` and `model-b`
- Both loaded for comparison: `C:\Users\ryanr\stadium-work\bernabeu-evaluation.blend`

These are kept outside this repository because of their size.
