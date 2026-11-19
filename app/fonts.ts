import { Barlow, Barlow_Condensed } from "next/font/google";

// The whole site is set in one family, Barlow, in two widths. It was
// drawn from road and number-plate lettering, which is the same world
// as stadium signs and shirt names.

// Body text: the regular width
export const sans = Barlow({
  variable: "--font-barlow-text",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Headings, buttons, shirt names, clocks and scoreboard text: the
// condensed width
export const display = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

// The same family name, for drawing text onto 3D textures (canvas needs
// the real font-family string, not the CSS variable)
export const displayFamily = display.style.fontFamily;
