import Link from "next/link";
import Colophon from "./components/ui/Colophon";
import PlaceIcon from "./components/ui/PlaceIcon";
import { home, profile } from "./data/portfolio";
import { places, sectionMetadata } from "./sections/registry";

export const metadata = sectionMetadata("home");

const newTab = <span className="sr-only"> (opens in a new tab)</span>;

// The home screen: the whole stadium, with my name set in the corner
// of the picture the way a broadcast captions a player, and the four
// things a visitor most likely came for. Everything here waits for the
// walk out of the tunnel to finish (the "after-intro" class).
//
// Only the caption and the links take clicks; everywhere else a click
// or drag goes through to the stadium behind. `data-tag-avoid` marks
// what the floating name tags must not sit on top of (see
// components/world/Tags.tsx).
export default function Home() {
  return (
    <main className="pointer-events-none fixed inset-0 flex flex-col justify-end">
      <div className="after-intro flex flex-col gap-3 px-3 pb-3 sm:px-5 sm:pb-5 lg:flex-row lg:items-end lg:justify-between">
        <section aria-labelledby="home-name" data-tag-avoid className="home-plate pointer-events-auto">
          <p className="home-where">{profile.location}</p>
          <h1 id="home-name" className="home-name">
            {profile.name}
          </h1>
          <p className="home-line">{profile.headline}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <Link href="/projects" className="btn btn-primary">
              {home.projects}
            </Link>
            <Link href="/about" className="btn">
              {home.tour}
            </Link>
            {/* on a phone these two are in the row of places below */}
            <Link href="/resume" className="btn btn-wide">
              {home.resume}
            </Link>
            <Link href="/contact" className="btn btn-wide">
              {home.contact}
            </Link>
          </div>
          <ul aria-label="Links" className="home-links mt-3.5 flex flex-wrap gap-x-5 gap-y-1 text-[0.9375rem]">
            <li>
              <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer">
                GitHub{newTab}
              </a>
            </li>
            <li>
              <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer">
                LinkedIn{newTab}
              </a>
            </li>
          </ul>
        </section>

        {/* On a phone there are no name tags over the stadium, so every
            place is a row of links here instead */}
        <nav aria-label="Places in the stadium" className="lg:hidden">
          <ul role="list" className="home-places scroll-area pointer-events-auto flex max-w-full gap-2 overflow-x-auto pb-1">
            {places.map((place) => (
              <li key={place.id} className="flex-none">
                <Link href={place.href}>
                  <PlaceIcon id={place.id} className="h-5 w-5 text-[#e6c56c]" />
                  <span>{place.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <aside data-tag-avoid className="home-note pointer-events-auto">
          <p className="home-hint hidden lg:block">{home.hint}</p>
          <details className="plate home-credits">
            <summary>{home.credits}</summary>
            <Colophon />
          </details>
        </aside>
      </div>
    </main>
  );
}
