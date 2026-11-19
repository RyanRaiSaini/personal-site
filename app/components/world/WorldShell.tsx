"use client";

import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { Component, useEffect, useState, type ReactNode } from "react";
import { shell } from "../../data/portfolio";
import type { EggId, RoofMode } from "../../lib/store";
import { useWorld } from "../../lib/store";
import { detectQuality, hasWebGL, isNarrowScreen, isPhone } from "../../lib/quality";
import { sectionForPath } from "../../sections/registry";
import { sceneOf } from "../world3d/spots";
import LiveData from "./LiveData";
import ShowOverlay from "./ShowOverlay";
import SoundEngine from "./SoundEngine";
import Tags from "./Tags";

// ------------------------------------------------------------------
// The page shell around the 3D world. It decides whether this visitor
// gets the 3D tour or the flat match view, loads the 3D world after
// the page's text, keeps the 3D world in step with the address bar,
// and draws the curtain when the view cuts to a room.
// ------------------------------------------------------------------

// The 3D world is browser-only and heavy, so it loads after the text
const World3D = dynamic(() => import("../world3d/World3D"), { ssr: false });

// How long the curtain takes to close before the view cuts, in ms
const CURTAIN_MS = 330;
// How long to wait for the stadium before offering the flat view, in ms
const SLOW_MS = 12_000;

// If the 3D world breaks (no graphics memory, a file that will not
// load), the visitor gets the flat match view instead of a blank page
class WorldBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    useWorld.getState().setMode("flat");
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function finishIntro() {
  try {
    sessionStorage.setItem("intro", "1");
  } catch {
    // Private browsing: it will just play again next time
  }
  document.documentElement.dataset.intro = "done";
  useWorld.getState().setIntroDone(true);
}

export default function WorldShell() {
  const pathname = usePathname();
  const router = useRouter();
  const mode = useWorld((s) => s.mode);
  const worldReady = useWorld((s) => s.worldReady);
  const curtain = useWorld((s) => s.curtain);
  const introDone = useWorld((s) => s.introDone);
  const loadProgress = useWorld((s) => s.loadProgress);
  const [slow, setSlow] = useState(false);

  const target = sectionForPath(pathname);
  const onTourRoute = target !== null;

  // Start-up: read the device, the saved choices and any test switches
  useEffect(() => {
    const store = useWorld.getState();
    store.setNavigate((href) => router.push(href));

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const narrow = window.matchMedia("(max-width: 1023px)");
    const syncMotion = () => useWorld.getState().setReducedMotion(motion.matches);
    const syncNarrow = () => useWorld.getState().setNarrow(narrow.matches || isNarrowScreen());
    syncMotion();
    syncNarrow();
    motion.addEventListener("change", syncMotion);
    narrow.addEventListener("change", syncNarrow);

    store.setQuality(detectQuality());

    const params = new URLSearchParams(window.location.search);
    store.setOverrides(params.get("time"), params.get("weather"));

    try {
      const saved = params.get("roof") ?? localStorage.getItem("roof");
      if (saved === "open" || saved === "closed" || saved === "auto") store.setRoofMode(saved as RoofMode);
      const eggs = JSON.parse(localStorage.getItem("eggs") ?? "[]");
      if (Array.isArray(eggs)) store.loadEggs(eggs as EggId[]);
    } catch {
      // Private browsing: start fresh
    }

    // Phones, and browsers without WebGL, get the flat match view
    // unless the visitor has asked for the 3D tour
    let view: string | null = null;
    try {
      view = params.get("view") ?? localStorage.getItem("view");
    } catch {
      view = null;
    }
    const canTour = hasWebGL();
    const wantsTour = view === "tour" || (view !== "match" && !isPhone());
    store.setMode(canTour && wantsTour ? "tour" : "flat");

    return () => {
      motion.removeEventListener("change", syncMotion);
      narrow.removeEventListener("change", syncNarrow);
    };
  }, [router]);

  // In flat mode the tour's addresses lead to the same section of the match view
  useEffect(() => {
    if (mode !== "flat" || !target) return;
    finishIntro();
    router.replace(target.id === "home" ? "/match" : `/match#${target.id}`);
  }, [mode, target, router]);

  // The walk-out only plays on the home page, once per visit. The
  // inline script in layout.tsx has already decided; mirror it here.
  useEffect(() => {
    if (mode === "pending") return;
    const playing = document.documentElement.dataset.intro === "play";
    if (!playing || mode !== "tour" || !onTourRoute) {
      finishIntro();
      return;
    }
    // If the 3D world never arrives, show the page anyway
    const failsafe = window.setTimeout(finishIntro, 14_000);
    return () => window.clearTimeout(failsafe);
  }, [mode, onTourRoute]);

  // Keep the 3D world in step with the address bar
  const targetId = target?.id ?? null;
  useEffect(() => {
    if (!targetId) return;
    const store = useWorld.getState();
    if (store.section === targetId) return;
    // Leaving a place ends whatever show was playing there
    if (store.show) store.startShow(null);
    const needsCut = sceneOf(store.section) !== sceneOf(targetId);
    if (!store.worldReady || store.reducedMotion) {
      store.setSection(targetId, true);
      return;
    }
    if (!needsCut) {
      store.setSection(targetId);
      return;
    }
    // Into or out of a room: close the curtain, cut, open it again
    store.setCurtain(true);
    let opening = 0;
    const cutting = window.setTimeout(() => {
      useWorld.getState().setSection(targetId, true);
      opening = window.setTimeout(() => useWorld.getState().setCurtain(false), 90);
    }, CURTAIN_MS);
    return () => {
      window.clearTimeout(cutting);
      window.clearTimeout(opening);
      useWorld.getState().setCurtain(false);
    };
  }, [targetId]);

  const showWorld = mode === "tour" && onTourRoute;

  // A slow connection: after a while, offer the flat view
  const waiting = showWorld && !worldReady;
  useEffect(() => {
    if (!waiting) return;
    const id = window.setTimeout(() => setSlow(true), SLOW_MS);
    return () => {
      window.clearTimeout(id);
      setSlow(false);
    };
  }, [waiting]);

  const openFlat = () => {
    try {
      localStorage.setItem("view", "match");
    } catch {
      // Not remembered in private browsing
    }
    useWorld.getState().setMode("flat");
  };

  return (
    <>
      <LiveData />
      {/* Until the stadium has loaded there is a dark ground behind the
          page, in either theme, so the home screen's white text can
          always be read */}
      {onTourRoute && mode !== "flat" && <div aria-hidden="true" className="fixed inset-0 z-0 bg-[#05070d]" />}
      {showWorld && (
        <div className="world-canvas fixed inset-0 z-0" data-ready={worldReady}>
          <WorldBoundary>
            <World3D />
          </WorldBoundary>
          {/* darkened corners, like a camera lens */}
          <div aria-hidden="true" className="world-vignette" />
          <Tags />
        </div>
      )}
      {waiting && (
        <div className="pointer-events-none fixed inset-x-0 bottom-10 z-20 flex flex-col items-center gap-3 px-4">
          <div className="loading" role="status">
            <p className="kicker">
              {shell.loading}
              {loadProgress > 0 ? ` · ${Math.round(loadProgress * 100)}%` : "…"}
            </p>
            <div className="loading-bar" aria-hidden="true">
              <span style={{ transform: `scaleX(${Math.max(0.03, loadProgress)})` }} />
            </div>
          </div>
          {slow && (
            <p className="loading-slow pointer-events-auto">
              {shell.loadingSlow}{" "}
              <button type="button" className="link" onClick={openFlat}>
                {shell.openFlat}
              </button>
            </p>
          )}
        </div>
      )}
      {showWorld && worldReady && !introDone && (
        <div className="pointer-events-none fixed inset-x-0 bottom-8 z-20 flex justify-center">
          <button type="button" className="btn pointer-events-auto !border-white/30 !bg-black/40 !text-white" onClick={finishIntro}>
            {shell.skipIntro}
          </button>
        </div>
      )}
      <ShowOverlay />
      <SoundEngine />
      <div className="curtain" data-drawn={curtain} aria-hidden="true" />
    </>
  );
}
