import { Barlow_Condensed, Geist, Geist_Mono } from "next/font/google";

// Body text
export const sans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

// Numbers, clocks and small technical labels
export const mono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Headings, shirt names and scoreboard text: a condensed athletic face
export const display = Barlow_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

// The same family name, for drawing text onto 3D textures (canvas needs
// the real font-family string, not the CSS variable)
export const displayFamily = display.style.fontFamily;
