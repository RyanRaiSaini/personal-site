# Why the stadium looked cartoonish

Written on 2026-11-19, before the realism redesign. The pictures in [before/](before/) show the site as it was; they were taken with `npm run shots` from fixed camera positions, so the same pictures can be taken again afterwards.

The stadium was drawn entirely from simple shapes in code. Five things made it read as a cartoon.

## 1. Geometry and proportions

- **The stands were ramps, not steps.** Each tier was one smooth sloping band with a picture of a seat repeated across it. There were no rows, aisles, stairs or entrances.
- **Nothing overhung anything.** The four tiers were stacked like a staircase, each starting where the one below stopped. Real upper tiers hang out over the lower ones and throw them into shadow.
- **The crowd was 35,000 pill shapes.** Each fan was two rounded blobs in a bright shirt colour. Seen from the dugout they look like bowling pins.
- **The roof was a flat disc** with white lines painted on it. The real roof is a deep steel structure.
- **Pitch-side objects were boxes:** the dugout, the advertising boards and the tunnel.

## 2. Materials and texture scale

- **Flat colour everywhere.** Surfaces had one colour and a little painted grain. Nothing had the fine surface detail that tells the eye "concrete", "steel" or "plastic".
- **Saturated colours.** The seats were a bright royal blue and the pitch a vivid green. The real seats are a deep navy and the structure is dark grey.
- **The pitch was two flat greens in hard-edged bands,** with no blades, no colour variation and no sheen.
- **Text was oversized.** The big screen and the pitch-side boards carried lettering far larger than anything in a real ground.

## 3. Lighting, shadows and exposure

- **Light came from everywhere equally.** A soft overall light did most of the work, so undersides, corners and the space under the roof were as bright as the open pitch.
- **Shadows barely registered.** The sun cast a shadow, but with nothing overhanging there was little for it to fall across.
- **No real sky lit the scene.** Reflections came from a few painted rectangles of light.
- **A glow effect was added on top,** which softened the picture without making it more believable.

## 4. Camera

- **Wide lenses.** Most views used a field of view of 52 to 56 degrees (70 on phones). Wide lenses stretch the edges of the frame and make large buildings look like models.
- **The overview sat low and close,** so the far stand filled the frame as a flat wall of seats.

## 5. Rendering settings

- **The crowd and the scrolling text never stopped moving,** so the page redrew 60 times a second even when nothing was happening.
- **Quality stepped down on slower machines by thinning the crowd,** which changed the look of the stadium from one laptop to the next.

## What the redesign does about it

- Builds a real model of the renovated stadium in Blender: stepped terraces, overhanging tiers, entrances, a steel roof and the screen ring.
- Takes its outer proportions from a scan of the real building (see [MODELS.md](MODELS.md)).
- Uses photographed materials and a photographed sky from Poly Haven.
- Shows the stadium empty, as in the reference photographs, with every seat modelled.
- Uses longer lenses and a higher, further overview.
