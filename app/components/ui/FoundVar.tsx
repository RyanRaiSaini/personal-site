"use client";

import { useEffect } from "react";
import { useWorld } from "../../lib/store";

// Marks the "VAR check" Easter egg as found when the 404 page is seen
export default function FoundVar() {
  useEffect(() => {
    // a moment's delay, so saved eggs have loaded before the count is shown
    const id = window.setTimeout(() => useWorld.getState().findEgg("var"), 700);
    return () => window.clearTimeout(id);
  }, []);
  return null;
}
