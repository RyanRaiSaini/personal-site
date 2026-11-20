"use client";

import { home, profile } from "../../data/portfolio";
import { finishIntro, startIntro } from "../../lib/intro";
import { useWorld } from "../../lib/store";

// The start screen: my name over the view down the players' tunnel,
// and the button that begins the walk out onto the pitch.
//
// It is in the page from the first paint and shown only on a first
// visit to the home page (while <html data-intro="start">; see
// app/lib/intro.ts). The top bar stays, so anyone who would sooner go
// straight to a section can.
export default function StartScreen() {
  const started = useWorld((s) => s.introStarted);
  return (
    <div className="start" aria-hidden={started}>
      <div>
        <p className="start-where">{profile.location}</p>
        {/* the page's heading while this is showing (the home screen's own is hidden then) */}
        <p className="start-name" role="heading" aria-level={1}>
          {profile.name}
        </p>
        <p className="start-line">{profile.headline}</p>
      </div>
      <div className="start-actions">
        <button type="button" className="btn start-go" onClick={startIntro}>
          {home.tour}
        </button>
        <p className="start-note">{home.startNote}</p>
        <button type="button" className="start-skip" onClick={finishIntro}>
          {home.skipStart}
        </button>
      </div>
    </div>
  );
}
