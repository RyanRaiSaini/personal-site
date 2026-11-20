import type { Metadata, Viewport } from "next";
import SiteHeader from "./components/ui/SiteHeader";
import WorldShell from "./components/world/WorldShell";
import { profile } from "./data/portfolio";
import { display, sans } from "./fonts";
import { section } from "./sections/registry";
import "./globals.css";

const home = section("home");

export const metadata: Metadata = {
  metadataBase: new URL(profile.siteUrl),
  title: { default: home.metadata.title, template: `%s | ${profile.name}` },
  description: home.metadata.description,
  authors: [{ name: profile.name, url: profile.githubUrl }],
  openGraph: {
    type: "website",
    siteName: profile.name,
    title: home.metadata.title,
    description: home.metadata.description,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#05070d" },
    { media: "(prefers-color-scheme: light)", color: "#eef0f3" },
  ],
};

// Runs before the first paint, so nothing flashes:
//  1. Theme. The roof is the theme switch: "closed" is dark, "open" is
//     light. With no saved choice it follows Brampton: dark between
//     sunset and sunrise (rough monthly times; the exact sun position
//     takes over once the page is running).
//  2. Intro. On the home page, once per visit, on screens big enough
//     for the 3D tour, the visitor starts in the players' tunnel with a
//     "Start the tour" button (app/lib/intro.ts has the steps).
const bootScript = `(function(){try{var d=document.documentElement,q=new URLSearchParams(location.search);
var r=q.get("roof")||localStorage.getItem("roof"),dark;
if(r==="open")dark=false;else if(r==="closed")dark=true;else{
var p=new Intl.DateTimeFormat("en-CA",{timeZone:"America/Toronto",hourCycle:"h23",hour:"2-digit",minute:"2-digit",month:"2-digit"}).formatToParts(new Date()),g=function(t){for(var i=0;i<p.length;i++)if(p[i].type===t)return Number(p[i].value);return 0};
var t=q.get("time"),h=g("hour")%24+g("minute")/60,m=g("month")-1;
if(t){var c=/^(\d{1,2}):?(\d{2})$/.exec(t);if(c)h=Number(c[1])+Number(c[2])/60}
var up=[7.8,7.3,7.4,6.6,5.9,5.6,5.8,6.3,6.9,7.5,7.1,7.7],down=[17.1,17.8,19.4,20,20.6,21,20.9,20.3,19.4,18.5,16.9,16.7];
dark=h<up[m]||h>=down[m]}
d.setAttribute("data-theme",dark?"dark":"light");
var v=q.get("view")||localStorage.getItem("view"),phone=matchMedia("(pointer: coarse)").matches&&Math.min(screen.width,screen.height)<820;
var tour=v==="tour"||(v!=="match"&&!phone);
var play=location.pathname==="/"&&tour&&!sessionStorage.getItem("intro")&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&!q.get("nointro");
d.setAttribute("data-intro",play?"start":"done")}catch(e){document.documentElement.setAttribute("data-intro","done")}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-theme="dark" data-intro="done" suppressHydrationWarning className={`${sans.variable} ${display.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
      </head>
      <body className="min-h-full">
        <a href="#content" className="btn btn-primary fixed left-4 top-4 z-50 -translate-y-24 focus:translate-y-0">
          Skip to content
        </a>
        {/* The top bar comes first so that Tab reaches it before the
            name tags floating over the stadium */}
        <SiteHeader />
        <WorldShell />
        <div id="content" className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
