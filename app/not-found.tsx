import type { Metadata } from "next";
import Link from "next/link";
import FoundVar from "./components/ui/FoundVar";

export const metadata: Metadata = {
  title: "Red card: page not found",
  description: "VAR has reviewed this page. It does not exist.",
};

// The 404 page: a red card from the video referee. Landing here also
// counts as finding an Easter egg ("VAR check").
export default function NotFound() {
  return (
    <main className="pointer-events-auto relative grid min-h-dvh place-items-center overflow-hidden px-6 py-28">
      <FoundVar />
      <div className="relative flex max-w-xl flex-col items-center text-center">
        <div aria-hidden="true" className="red-card mb-10" />
        <p className="kicker">VAR check complete</p>
        <h1 className="mt-2 font-display text-7xl font-extrabold uppercase leading-[0.9] tracking-tight sm:text-9xl">
          <span className="sr-only">Error </span>404
        </h1>
        <p className="mt-4 font-display text-3xl font-bold uppercase tracking-wide">VAR has reviewed this page.</p>
        <p className="mt-1 font-display text-3xl font-bold uppercase tracking-wide text-danger">It doesn&apos;t exist.</p>
        <p className="mt-4 text-ink-soft">The address may be mistyped, or the page has been sent off. Decision stands.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">
            Back to the stadium
          </Link>
          <Link href="/match" className="btn">
            Match view
          </Link>
        </div>
      </div>
    </main>
  );
}
