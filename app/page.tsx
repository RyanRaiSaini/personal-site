import Link from "next/link";
import Colophon from "./components/ui/Colophon";
import PlaceIcon from "./components/ui/PlaceIcon";
import { profile } from "./data/portfolio";
import { places, sectionMetadata } from "./sections/registry";

export const metadata = sectionMetadata("home");

const newTab = <span className="sr-only"> (opens in a new tab)</span>;

// The home screen: the whole stadium, with my name, what I do and the
// two things a visitor most likely came for. Everything here waits for
// the walk out of the tunnel to finish (the "after-intro" class).
export default function Home() {
  return (
    <main className="pointer-events-none fixed inset-0 flex flex-col justify-end">
      <div className="after-intro bg-gradient-to-t from-black/70 via-black/25 to-transparent px-5 pb-6 pt-24 sm:px-10 sm:pb-9">
        {/* Only the links and buttons take clicks; everywhere else a
            click or drag goes through to the stadium behind */}
        <section aria-labelledby="home-name" className="max-w-2xl text-white [&_a]:pointer-events-auto">
          <p className="kicker !text-[#f2cf6b]">
            Number {profile.shirtNumber} · {profile.location}
          </p>
          <h1 id="home-name" className="mt-1 font-display text-6xl font-extrabold uppercase leading-[0.9] tracking-tight [text-shadow:0_2px_30px_rgba(0,0,0,0.6)] sm:text-8xl">
            {profile.name}
          </h1>
          <p className="mt-3 max-w-xl text-lg text-white/85 [text-shadow:0_1px_12px_rgba(0,0,0,0.7)]">{profile.headline}</p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link href="/projects" className="btn btn-primary">
              View projects
            </Link>
            <Link href="/about" className="btn !border-white/30 !bg-black/40 !text-white">
              Start the tour
            </Link>
            <Link href="/contact" className="btn !border-white/30 !bg-black/40 !text-white">
              Contact
            </Link>
          </div>
          <ul aria-label="Links" className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-white/75">
            <li>
              <a href={profile.githubUrl} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-[#f2cf6b] hover:underline">
                GitHub{newTab}
              </a>
            </li>
            <li>
              <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-[#f2cf6b] hover:underline">
                LinkedIn{newTab}
              </a>
            </li>
            <li>
              <Link href="/resume" className="underline-offset-4 hover:text-[#f2cf6b] hover:underline">
                Résumé
              </Link>
            </li>
            <li className="hidden text-white/50 lg:block">Drag to look around. Click a name tag to go there.</li>
          </ul>
        </section>

        {/* Every place as a plain row of links, for keyboards and for
            anyone who would rather not hunt for name tags */}
        <nav aria-label="Places in the stadium" className="mt-6">
          <ul role="list" className="scroll-area pointer-events-auto -mx-1 flex w-fit max-w-full gap-2 overflow-x-auto px-1 pb-1">
            {places.map((place) => (
              <li key={place.id} className="flex-none">
                <Link href={place.href} className="flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-3.5 py-2 text-white backdrop-blur-md transition-colors hover:border-[#f2cf6b]">
                  <PlaceIcon id={place.id} className="h-5 w-5 text-[#f2cf6b]" />
                  <span className="font-display text-base font-semibold uppercase tracking-wide">{place.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Colophon className="mt-3 text-white/45" />
      </div>
    </main>
  );
}
