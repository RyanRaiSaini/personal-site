"use client";

import { create } from "zustand";
import type { Egg } from "../data/portfolio";
import type { SectionId } from "../sections/registry";
import type { Contributions } from "./github";
import type { Weather } from "./weather";

// ------------------------------------------------------------------
// The one shared state for the whole site: the roof (which is also the
// colour theme), the sound, the weather, the 3D quality level, which
// Easter eggs have been found, and what the 3D world is doing.
//
// Both the ordinary page UI and the 3D world read and write this.
// ------------------------------------------------------------------

export type RoofMode = "auto" | "open" | "closed";
export type Quality = "low" | "medium" | "high";
export type EggId = Egg["id"];

// A one-off thing the 3D world should act out
export type Show =
  | { kind: "goal"; scorer: "six" | "ten" | "saini"; label: string; startedAt: number }
  | { kind: "fireworks"; label: string; startedAt: number }
  | { kind: "fifteen"; startedAt: number }
  | { kind: "pass"; startedAt: number };

// How the site is being viewed: the 3D tour or the flat match view.
// "pending" is the moment before the page has looked at the device.
export type Mode = "pending" | "tour" | "flat";

// A show as it is asked for; the store stamps the start time itself
export type ShowRequest =
  | { kind: "goal"; scorer: "six" | "ten" | "saini"; label: string }
  | { kind: "fireworks"; label: string }
  | { kind: "fifteen" }
  | { kind: "pass" };

type State = {
  mode: Mode;
  // The section the 3D world is showing. It trails the address bar by
  // a moment when the view has to cut to a room.
  section: SectionId;
  // Goes up by one each time the camera should jump instead of fly
  cuts: number;
  // The black curtain drawn across the screen during a cut
  curtain: boolean;
  // Narrow (phone-sized) screen: closer camera framings, bottom sheets
  narrow: boolean;
  // How far the view is pushed aside to make room for the open panel, in pixels
  viewOffset: { x: number; y: number };
  // Moves to another page; set by the page shell so the 3D world can use it
  navigate: (href: string) => void;
  // The visitor prefers less motion
  reducedMotion: boolean;

  // The 3D world has loaded and drawn its first frame
  worldReady: boolean;
  // How much of the stadium has downloaded so far, from 0 to 1
  loadProgress: number;
  // The visitor has pressed "Start the tour" on the start screen
  introStarted: boolean;
  // The walk out of the tunnel has finished (or was skipped, or never offered)
  introDone: boolean;
  quality: Quality;
  // Even the lightest quality level was too slow (a laptop on battery,
  // say): draw the picture at three-quarter size. Softer, but it moves.
  lean: boolean;

  // The roof. "auto" follows Brampton: shut at night and in rain or snow.
  roofMode: RoofMode;
  roofClosed: boolean;

  sound: boolean;
  weather: Weather | null;
  contributions: Contributions | null;

  // Test overrides from the address bar (?time=22:30&weather=snow)
  timeOverride: string | null;
  weatherOverride: string | null;

  eggsFound: EggId[];
  // The egg found most recently in this visit (for the on-screen note)
  lastEgg: { id: EggId; at: number } | null;
  show: Show | null;
  // Rises to 1 when the crowd should roar, then falls away by itself
  cheerAt: number;

  // Which project, shirt, trophy or photo is picked in the open section
  selection: Record<string, string | number | null>;

  setMode: (mode: Mode) => void;
  setSection: (section: SectionId, cut?: boolean) => void;
  setCurtain: (curtain: boolean) => void;
  setNarrow: (narrow: boolean) => void;
  setViewOffset: (x: number, y: number) => void;
  setNavigate: (navigate: (href: string) => void) => void;
  setReducedMotion: (reduced: boolean) => void;
  setWorldReady: (ready: boolean) => void;
  setLoadProgress: (progress: number) => void;
  setIntroStarted: (started: boolean) => void;
  setIntroDone: (done: boolean) => void;
  setQuality: (quality: Quality) => void;
  setLean: (lean: boolean) => void;
  setRoofMode: (mode: RoofMode) => void;
  setRoofClosed: (closed: boolean) => void;
  setSound: (on: boolean) => void;
  setWeather: (weather: Weather | null) => void;
  setContributions: (contributions: Contributions | null) => void;
  setOverrides: (time: string | null, weather: string | null) => void;
  findEgg: (id: EggId) => void;
  loadEggs: (ids: EggId[]) => void;
  startShow: (show: ShowRequest | null) => void;
  cheer: () => void;
  select: (key: string, value: string | number | null) => void;
};

export const useWorld = create<State>((set, get) => ({
  mode: "pending",
  section: "home",
  cuts: 0,
  curtain: false,
  narrow: false,
  viewOffset: { x: 0, y: 0 },
  navigate: (href) => {
    window.location.href = href;
  },
  reducedMotion: false,
  worldReady: false,
  loadProgress: 0,
  introStarted: false,
  introDone: false,
  quality: "medium",
  lean: false,
  roofMode: "auto",
  roofClosed: true,
  sound: false,
  weather: null,
  contributions: null,
  timeOverride: null,
  weatherOverride: null,
  eggsFound: [],
  lastEgg: null,
  show: null,
  cheerAt: 0,
  selection: {},

  setMode: (mode) => {
    if (get().mode !== mode) set({ mode });
  },
  setSection: (section, cut = false) => set({ section, cuts: get().cuts + (cut ? 1 : 0) }),
  setCurtain: (curtain) => set({ curtain }),
  setNarrow: (narrow) => {
    if (get().narrow !== narrow) set({ narrow });
  },
  setViewOffset: (x, y) => {
    const current = get().viewOffset;
    if (current.x !== x || current.y !== y) set({ viewOffset: { x, y } });
  },
  setNavigate: (navigate) => set({ navigate }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  setWorldReady: (worldReady) => set({ worldReady }),
  setLoadProgress: (loadProgress) => {
    if (get().loadProgress !== loadProgress) set({ loadProgress });
  },
  setIntroStarted: (introStarted) => set({ introStarted }),
  setIntroDone: (introDone) => set({ introDone }),
  setQuality: (quality) => set({ quality }),
  setLean: (lean) => set({ lean }),
  setRoofMode: (roofMode) => set({ roofMode }),
  setRoofClosed: (roofClosed) => {
    if (get().roofClosed !== roofClosed) set({ roofClosed });
  },
  setSound: (sound) => set({ sound }),
  setWeather: (weather) => set({ weather }),
  setContributions: (contributions) => set({ contributions }),
  setOverrides: (timeOverride, weatherOverride) => set({ timeOverride, weatherOverride }),
  findEgg: (id) => {
    const found = get().eggsFound;
    if (found.includes(id)) return;
    const next = [...found, id];
    set({ eggsFound: next, lastEgg: { id, at: performance.now() } });
    try {
      localStorage.setItem("eggs", JSON.stringify(next));
    } catch {
      // Private browsing: the count just won't be remembered
    }
  },
  loadEggs: (eggsFound) => set({ eggsFound }),
  startShow: (show) => set({ show: show ? ({ ...show, startedAt: performance.now() } as Show) : null }),
  cheer: () => set({ cheerAt: performance.now() }),
  select: (key, value) => set({ selection: { ...get().selection, [key]: value } }),
}));

// For testing from the browser console: __world.setState({ roofClosed: false })
if (typeof window !== "undefined") {
  (window as unknown as { __world: typeof useWorld }).__world = useWorld;
}
