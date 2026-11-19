"use client";

import { create } from "zustand";
import type { Egg } from "../data/portfolio";
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
  | { kind: "goal"; scorer: "jude" | "mbappe" | "saini"; label: string; startedAt: number }
  | { kind: "fireworks"; label: string; startedAt: number }
  | { kind: "fifteen"; startedAt: number }
  | { kind: "trent"; startedAt: number };

type State = {
  // The 3D world has loaded and drawn its first frame
  worldReady: boolean;
  // The walk out of the tunnel has finished (or was skipped)
  introDone: boolean;
  quality: Quality;

  // The roof. "auto" follows Brampton: shut at night and in rain or snow.
  roofMode: RoofMode;
  roofClosed: boolean;

  sound: boolean;
  weather: Weather | null;

  // Test overrides from the address bar (?time=22:30&weather=snow)
  timeOverride: string | null;
  weatherOverride: string | null;

  eggsFound: EggId[];
  show: Show | null;
  // Rises to 1 when the crowd should roar, then falls away by itself
  cheerAt: number;

  // Which project, shirt, trophy or photo is picked in the open section
  selection: Record<string, string | number | null>;

  setWorldReady: (ready: boolean) => void;
  setIntroDone: (done: boolean) => void;
  setQuality: (quality: Quality) => void;
  setRoofMode: (mode: RoofMode) => void;
  setRoofClosed: (closed: boolean) => void;
  setSound: (on: boolean) => void;
  setWeather: (weather: Weather | null) => void;
  setOverrides: (time: string | null, weather: string | null) => void;
  findEgg: (id: EggId) => void;
  loadEggs: (ids: EggId[]) => void;
  startShow: (show: Show | null) => void;
  cheer: () => void;
  select: (key: string, value: string | number | null) => void;
};

export const useWorld = create<State>((set, get) => ({
  worldReady: false,
  introDone: false,
  quality: "medium",
  roofMode: "auto",
  roofClosed: true,
  sound: false,
  weather: null,
  timeOverride: null,
  weatherOverride: null,
  eggsFound: [],
  show: null,
  cheerAt: 0,
  selection: {},

  setWorldReady: (worldReady) => set({ worldReady }),
  setIntroDone: (introDone) => set({ introDone }),
  setQuality: (quality) => set({ quality }),
  setRoofMode: (roofMode) => set({ roofMode }),
  setRoofClosed: (roofClosed) => {
    if (get().roofClosed !== roofClosed) set({ roofClosed });
  },
  setSound: (sound) => set({ sound }),
  setWeather: (weather) => set({ weather }),
  setOverrides: (timeOverride, weatherOverride) => set({ timeOverride, weatherOverride }),
  findEgg: (id) => {
    const found = get().eggsFound;
    if (found.includes(id)) return;
    const next = [...found, id];
    set({ eggsFound: next });
    try {
      localStorage.setItem("eggs", JSON.stringify(next));
    } catch {
      // Private browsing: the count just won't be remembered
    }
  },
  loadEggs: (eggsFound) => set({ eggsFound }),
  startShow: (show) => set({ show }),
  cheer: () => set({ cheerAt: performance.now() }),
  select: (key, value) => set({ selection: { ...get().selection, [key]: value } }),
}));

// For testing from the browser console: __world.setState({ roofClosed: false })
if (typeof window !== "undefined") {
  (window as unknown as { __world: typeof useWorld }).__world = useWorld;
}
