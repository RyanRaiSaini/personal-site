"use client";

import { useEffect, useRef } from "react";
import { StadiumSound } from "../../lib/audio";
import { useWorld } from "../../lib/store";
import { GOALS, KICK_CONTACT, KICK_TIME } from "../world3d/players/shows";
import { sceneOf } from "../world3d/spots";

// Connects the sound (app/lib/audio.ts) to what is happening: the
// crowd roars when the store says so, the ball thumps when a shot is
// struck, and everything goes muffled when you step into a room.
// It draws nothing, and makes no sound until the header's sound
// button is pressed.

export default function SoundEngine() {
  const sound = useWorld((s) => s.sound);
  const cheerAt = useWorld((s) => s.cheerAt);
  const show = useWorld((s) => s.show);
  const section = useWorld((s) => s.section);
  const mode = useWorld((s) => s.mode);
  const engine = useRef<StadiumSound | null>(null);

  // On and off. Turning it on is itself the click browsers require.
  useEffect(() => {
    if (sound && mode === "tour") {
      engine.current ??= new StadiumSound();
      engine.current.start();
      engine.current.setIndoors(sceneOf(useWorld.getState().section) !== "bowl");
      engine.current.whistle(0.45);
    } else engine.current?.stop();
  }, [sound, mode]);

  useEffect(() => {
    if (cheerAt > 0) engine.current?.cheer();
  }, [cheerAt]);

  useEffect(() => {
    engine.current?.setIndoors(sceneOf(section) !== "bowl");
  }, [section]);

  // The thump of the shot, timed to the kick
  useEffect(() => {
    if (!show || show.kind !== "goal") return;
    const script = GOALS[show.scorer];
    const id = window.setTimeout(() => engine.current?.thump(), (script.runUp + KICK_TIME * KICK_CONTACT) * 1000);
    return () => window.clearTimeout(id);
  }, [show]);

  // Leaving the page silences it
  useEffect(() => {
    return () => engine.current?.stop();
  }, []);

  return null;
}
