"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import { type CanvasTexture, type MeshBasicMaterial } from "three";
import { now as nowData, profile } from "../../../data/portfolio";
import { useWorld, type Show } from "../../../lib/store";
import { clockText, currentInstant } from "../../../lib/time";
import { atmo } from "../atmosphere/state";
import { ledStrip, useDisplayFont, type StripSegment } from "../textures/text";
import { HALO } from "./dims";
import { perimeter, sweepBand, sweepBands } from "./path";

// The big screen: a band of LED hanging all the way round the roof
// opening. It scrolls the time and weather in Brampton, the time in
// Madrid and what I'm building now. During a goal or the fireworks it
// switches to a celebration.

const GOLD = "#f2cf6b";
const WHITE = "#f4f6fb";
const BLUE = "#8fb4ff";
const PIXELS_PER_METRE = 30;
const SCREEN_HEIGHT = HALO.top - HALO.bottom;

function showSegments(show: Show): StripSegment[] {
  if (show.kind === "goal") {
    return [
      { text: "GOOOOOL!", color: GOLD },
      { text: show.label, color: WHITE },
      { text: "GOOOOOL!", color: GOLD },
      { text: show.label, color: WHITE },
    ];
  }
  if (show.kind === "fireworks") {
    return [
      { text: "¡HALA MADRID!", color: GOLD },
      { text: show.label, color: WHITE },
      { text: "¡HALA MADRID!", color: GOLD },
      { text: "Y NADA MÁS", color: WHITE },
    ];
  }
  if (show.kind === "fifteen") {
    return [
      { text: "15", color: GOLD },
      { text: "KINGS OF EUROPE", color: WHITE },
      { text: "15", color: GOLD },
      { text: "LA DECIMOQUINTA", color: WHITE },
    ];
  }
  return [
    { text: "66", color: GOLD },
    { text: "WHAT A PASS", color: WHITE },
  ];
}

export default function Halo() {
  const family = useDisplayFont();
  const weather = useWorld((s) => s.weather);
  const timeOverride = useWorld((s) => s.timeOverride);
  const roofClosed = useWorld((s) => s.roofClosed);
  const show = useWorld((s) => s.show);
  const material = useRef<MeshBasicMaterial>(null);
  const textureRef = useRef<CanvasTexture | null>(null);
  // Ticks once a minute so the clocks stay right
  const [minute, setMinute] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setMinute((m) => m + 1), 20_000);
    return () => window.clearInterval(id);
  }, []);

  const geometry = useMemo(() => {
    const screen = sweepBand({ d: HALO.d, y: HALO.bottom }, { d: HALO.d, y: HALO.top }, { uSize: 1, vSize: SCREEN_HEIGHT, cornerSegments: 20, continuousU: true });
    // The dark casing behind and under the screen
    const casing = sweepBands(
      [
        { a: { d: HALO.d + 0.9, y: HALO.top + 0.9 }, b: { d: HALO.d + 0.9, y: HALO.bottom - 0.3 } },
        { a: { d: HALO.d + 0.9, y: HALO.bottom - 0.3 }, b: { d: HALO.d - 0.05, y: HALO.bottom - 0.3 } },
        { a: { d: HALO.d - 0.05, y: HALO.bottom - 0.3 }, b: { d: HALO.d - 0.05, y: HALO.bottom } },
      ],
      { cornerSegments: 20 },
    );
    return { screen, casing };
  }, []);

  useEffect(() => {
    return () => {
      geometry.screen.dispose();
      geometry.casing.dispose();
    };
  }, [geometry]);

  // Repaint the strip whenever what it says changes
  const strip = useMemo(() => {
    if (!family) return null;
    void minute;
    let segments: StripSegment[];
    if (show) segments = showSegments(show);
    else {
      const home = nowData.homeCity;
      const instant = currentInstant(timeOverride, home.timeZone);
      const away = nowData.awayCity;
      const conditions = weather ? `${Math.round(weather.temperature)}°C  ${weather.label.toUpperCase()}` : "LIVE";
      segments = [
        { text: profile.name.toUpperCase(), color: WHITE },
        { text: `#${profile.shirtNumber}`, color: GOLD },
        { text: `${home.name.toUpperCase()}  ${clockText(instant, home.timeZone)}`, color: WHITE },
        { text: conditions, color: BLUE },
        { text: `${away.name.toUpperCase()}  ${clockText(instant, away.timeZone)}`, color: WHITE },
        { text: roofClosed ? "ROOF CLOSED" : "ROOF OPEN", color: GOLD },
        { text: `${nowData.building.label.toUpperCase()}: ${nowData.building.value.toUpperCase()}`, color: WHITE },
        { text: `${nowData.seeking.label.toUpperCase()} ${nowData.seeking.value.toUpperCase()}`, color: BLUE },
      ];
    }
    const made = ledStrip(family, segments, { height: Math.round(SCREEN_HEIGHT * PIXELS_PER_METRE), pixelsPerUnit: PIXELS_PER_METRE, weight: 800 });
    // Fit a whole number of repeats round the ring so there is no seam
    const total = perimeter(HALO.d);
    const repeats = Math.max(1, Math.round(total / made.worldLength));
    // Seen from inside the bowl the band runs right to left, so the
    // texture is flipped to read the right way round
    made.texture.repeat.set(-repeats / total, 1);
    return made.texture;
  }, [family, weather, timeOverride, roofClosed, show, minute]);

  useEffect(() => {
    const previous = textureRef.current;
    textureRef.current = strip;
    if (material.current) {
      material.current.map = strip;
      material.current.needsUpdate = true;
    }
    return () => {
      previous?.dispose();
    };
  }, [strip]);

  useFrame((_, delta) => {
    const texture = textureRef.current;
    if (texture) texture.offset.x = (texture.offset.x + delta * (show ? 0.05 : 0.012)) % 1;
    if (material.current) {
      // Brighter than white under floodlights, so it glows; toned down in daylight
      const power = 0.95 + 0.75 * atmo.floodlights - 0.2 * atmo.outdoor;
      material.current.color.setScalar(power);
    }
  });

  return (
    <group>
      <mesh geometry={geometry.screen}>
        <meshBasicMaterial ref={material} map={strip} toneMapped={false} color="#111111" />
      </mesh>
      <mesh geometry={geometry.casing}>
        <meshStandardMaterial color="#14171e" roughness={0.6} metalness={0.5} />
      </mesh>
    </group>
  );
}
