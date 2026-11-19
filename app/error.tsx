"use client";

import Link from "next/link";
import { useEffect } from "react";

// Shown if a page crashes while it is being drawn
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="pointer-events-auto grid min-h-dvh place-items-center px-6 py-28">
      <div className="max-w-lg text-center">
        <p className="kicker">Match abandoned</p>
        <h1 className="mt-2 font-display text-6xl font-extrabold uppercase leading-none tracking-tight">Something went wrong.</h1>
        <p className="mt-4 text-ink-soft">This page hit an error. Trying again usually fixes it; the flat match view is always there as a fallback.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button type="button" className="btn btn-primary" onClick={reset}>
            Try again
          </button>
          <Link href="/match" className="btn">
            Match view
          </Link>
        </div>
      </div>
    </main>
  );
}
