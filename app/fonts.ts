import { Saira, Saira_Condensed } from "next/font/google";

// The whole site is set in one family, Saira, in two widths: a
// geometric sports face with squared-off curves, the lettering of match
// graphics and shirt numbers. Free, under the SIL Open Font License.

// Body text: the regular width
export const sans = Saira({
  variable: "--font-text",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Headings, buttons, shirt names, clocks and scoreboard text: the
// condensed width
export const display = Saira_Condensed({
  variable: "--font-head",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

// The same family name, for drawing text onto 3D textures (canvas needs
// the real font-family string, not the CSS variable)
export const displayFamily = display.style.fontFamily;
