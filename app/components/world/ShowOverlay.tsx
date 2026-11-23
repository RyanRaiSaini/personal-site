"use client";

import { useEffect, useState } from "react";
import { eggs } from "../../data/portfolio";
import { useWorld, type EggId, type Show } from "../../lib/store";
import { BALL_FLIGHT, GOALS } from "../world3d/players/shows";
import { sceneOf } from "../world3d/spots";

// ------------------------------------------------------------------
// What appears over the page while a show is playing: the big
// "GOOOOOL!" banner, and a small note whenever an Easter egg is found.
// It also listens for the two secret codes typed on the keyboard:
// the word "hala", and up up down down left right left right B A.
// ------------------------------------------------------------------

const KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

function bannerFor(show: Show): { title: string; line: string; delay: number; small?: boolean } | null {
  if (show.kind === "goal") {
    const script = GOALS[show.scorer];
    const delay = script.contact + BALL_FLIGHT;
    if (show.scorer === "saini") return { title: "Goal", line: show.label, delay, small: true };
    return { title: "Gooooool!", line: show.label, delay };
  }
  if (show.kind === "fireworks") return { title: "What a night!", line: "Thank you for visiting", delay: 0.4 };
  if (show.kind === "fifteen") return { title: "15", line: "Fifteen European Cups. Kings of Europe.", delay: 0.8 };
  return { title: "66", line: "Still the best pass in the building.", delay: 1.1, small: true };
}

// Coloured paper for the flat pages, where there is no 3D sky to light up
function Confetti() {
  const colors = ["#f2cf6b", "#ffffff", "#7aa2ff", "#c9a2ff"];
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[70] overflow-hidden">
      {Array.from({ length: 70 }, (_, i) => {
        const left = (i * 37) % 100;
        const delay = ((i * 53) % 100) / 100;
        const duration = 2.2 + ((i * 29) % 100) / 60;
        return <span key={i} className="confetti" style={{ left: `${left}%`, background: colors[i % colors.length], animationDelay: `${delay}s`, animationDuration: `${duration}s`, transform: `rotate(${(i * 47) % 360}deg)` }} />;
      })}
    </div>
  );
}

export default function ShowOverlay() {
  const show = useWorld((s) => s.show);
  const lastEgg = useWorld((s) => s.lastEgg);
  const found = useWorld((s) => s.eggsFound.length);
  // With a section's panel open, the banner keeps to the free side of the screen
  const panelOpen = useWorld((s) => s.section !== "home" && s.mode === "tour");
  const [banner, setBanner] = useState<ReturnType<typeof bannerFor>>(null);
  const [toast, setToast] = useState<EggId | null>(null);
  const [confetti, setConfetti] = useState(false);

  // The banner appears a moment into the show (when the ball hits the net)
  useEffect(() => {
    document.documentElement.dataset.show = show ? show.kind : "";
    if (!show) {
      const id = window.setTimeout(() => setBanner(null), 0);
      return () => window.clearTimeout(id);
    }
    const next = bannerFor(show);
    const id = window.setTimeout(() => setBanner(next), (next?.delay ?? 0) * 1000);
    return () => window.clearTimeout(id);
  }, [show]);

  // A note for each egg as it is found
  useEffect(() => {
    if (!lastEgg) return;
    const show = window.setTimeout(() => setToast(lastEgg.id), 0);
    const hide = window.setTimeout(() => setToast(null), 5200);
    return () => {
      window.clearTimeout(show);
      window.clearTimeout(hide);
    };
  }, [lastEgg]);

  // The secret codes
  useEffect(() => {
    let typed = "";
    let step = 0;
    const celebrate = () => {
      const world = useWorld.getState();
      world.findEgg("hala");
      const in3d = world.mode === "tour" && world.worldReady && world.introDone && sceneOf(world.section) === "bowl";
      if (in3d && !world.reducedMotion) {
        if (!world.show) world.startShow({ kind: "fireworks", label: "FULL TIME" });
      } else {
        setConfetti(true);
        window.setTimeout(() => setConfetti(false), 5200);
      }
    };
    const key = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const wanted = KONAMI[step];
      if (event.key === wanted || event.key.toLowerCase() === wanted) {
        step += 1;
        if (step === KONAMI.length) {
          step = 0;
          celebrate();
        }
      } else step = event.key === KONAMI[0] ? 1 : 0;

      if (event.key.length === 1) {
        typed = (typed + event.key.toLowerCase()).slice(-4);
        if (typed === "hala") {
          typed = "";
          celebrate();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  const egg = toast ? eggs.find((e) => e.id === toast) : null;

  return (
    <>
      {/* The banner sits in the lower part of the picture, like a
          broadcast caption, so it never covers the scorer's face in his
          close-up. With a panel open it keeps to the free side, up top. */}
      {banner && show && (
        <div aria-live="polite" className={`pointer-events-none fixed inset-x-0 z-[45] flex justify-center px-4 ${panelOpen ? "top-24 lg:pr-[min(36rem,46vw)]" : "bottom-[8vh]"}`}>
          <div className="show-banner max-w-full text-center text-white">
            <p className={`font-display font-extrabold uppercase leading-none tracking-tight [text-shadow:0_4px_40px_rgba(0,0,0,0.75)] ${banner.small || panelOpen ? "text-6xl" : "text-7xl sm:text-8xl"}`} style={{ color: "#f2cf6b" }}>
              {banner.title}
            </p>
            <p className={`mt-1 font-display font-bold uppercase tracking-[0.14em] [text-shadow:0_2px_18px_rgba(0,0,0,0.85)] ${banner.small || panelOpen ? "text-xl" : "text-2xl sm:text-3xl"}`}>{banner.line}</p>
          </div>
        </div>
      )}

      {egg && (
        <div role="status" className="pointer-events-none fixed inset-x-0 top-[4.75rem] z-[65] flex justify-center px-4">
          <p className="plate panel-in flex items-center gap-3 px-4 py-2 text-sm">
            <span className="kicker !text-[#e6c56c]">Easter egg found</span>
            <span className="font-display text-lg font-bold uppercase tracking-wide">{egg.name}</span>
            <span className="font-display text-sm text-white/60">
              {found} of {eggs.length}
            </span>
          </p>
        </div>
      )}

      {confetti && <Confetti />}
    </>
  );
}
