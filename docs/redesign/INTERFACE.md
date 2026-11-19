# The interface: what changed and why

Written on 2026-11-19. The stadium is the memorable thing on this site, so the page's own text has one job: get a visitor to my name, projects, experience, résumé and contact without covering the picture.

## The idea

A football broadcast puts its words on small, solid captions at the edges of the picture: the scorebug in a top corner, a name caption in a bottom corner. Stadium signs work the same way: short words on dark plates. The interface now uses that vocabulary instead of frosted-glass pills.

## Tokens

**Colour**

| Name | Value | Used for |
|---|---|---|
| Floodlit night | `#070b14` at 90% | The plates that sit on the stadium picture (top bar, name caption, name tags), in both themes |
| Chalk | `#f4f6f8` | Text on the plates and in the dark theme |
| Trophy gold | `#e6c56c` (dark), `#8a6508` (light) | The one accent: the current page, focus rings, key numbers, the rule on a caption |
| Seat navy | `#22398a` | Links in the light theme; it is the colour of the seats |
| Programme white | `#fafbfc` on `#eef0f3` | Panels in the light (roof open) theme. It replaced a warm cream. |
| Ink | `#0e1424` | Text in the light theme |

**Type.** One family in two widths: **Barlow Condensed** for names, headings, buttons, clocks and numbers, **Barlow** for reading text. Barlow was drawn from road signs and number plates, which is the same world as stadium wayfinding and shirt lettering. It replaced three families (a condensed face, Geist and a monospace). Capitals are kept for display headings, the way a name is set on a shirt; small labels and buttons are in sentence case.

**Shape.** Rectangles with small corners (6 to 16 px), like plates and signs. No pills, no blur.

## Layout

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [RYAN SAINI]            [Projects Experience Résumé Contact] [Places] [◐][♪][Flat view] │
│                                                                           │
│                    the stadium, with a small sign                         │
│                    over each place (About, Projects…)                     │
│                                                                           │
│ ▌Brampton, Ontario                                                        │
│ ▌RYAN RAI SAINI                                Drag to look around. …     │
│ ▌Mathematics at the University of Waterloo…             [+ Credits]       │
│ ▌[View projects] [Start the tour] [Résumé] [Contact]                      │
└───────────────────────────────────────────────────────────────────────────┘
```

- **Home.** The name is a caption in the bottom-left corner. Everything is left-aligned. The middle of the picture is left clear.
- **Top bar.** Small plates, not a solid strip. Projects, Experience, Résumé and Contact are one click from any page; the Places menu lists all ten sections.
- **Name tags.** One short line each ("Projects"), on a stem. A tag hides while it would cover the caption or the top bar, and steps up on a longer stem when it would cover another tag.
- **Section panel.** A solid page on the right (a sheet from the bottom on a phone), with a gold rule on top. Above the title, where you are in the stadium is set like a sign: place, a rule, what happens there.
- **Phone.** No name tags; a row of places sits under the caption instead.

## Getting to the content without the camera

- The four direct links and the Places menu work from the first paint, before the 3D has loaded.
- The walk out of the tunnel plays once per visit and has a Skip button; visitors who ask for less motion never get it, and their camera cuts between sections instead of flying.
- The flat match view has every section on one page, with no 3D at all.

## Checked

| Check | Result |
|---|---|
| Tab order on the home screen | Skip link, top bar (name, four links, Places, roof, sound, view), then the name tags, then the caption's buttons |
| Focus | Every control shows a 2 px gold ring; a name tag shows it round its label |
| Places menu by keyboard | Opens with Enter, closes with Escape and returns focus to its button |
| Less motion requested | No walk-out, the camera cuts, and the stadium stops redrawing 4 seconds after the last input |
| Narrow screen (390 × 844) | Caption, two buttons, a scrolling row of places; the stadium fills the top half |
| Dark and light themes | Both photographed, with panels open |

## Not changed

The wording of the sections themselves, apart from three small corrections: "Number 8" now appears only on the shirt, the small print no longer says the stadium is generated from code, and it credits the scan the stadium was measured from.
