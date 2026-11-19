import type { Metadata } from "next";
import WorldShell from "./components/world3d/WorldShell";
import { display, mono, sans } from "./fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ryan Rai Saini",
  description: "Portfolio of Ryan Rai Saini, a Mathematics student at the University of Waterloo.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${sans.variable} ${mono.variable} ${display.variable} h-full antialiased`}>
      <body className="min-h-full">
        <WorldShell />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
