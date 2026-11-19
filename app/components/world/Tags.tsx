"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useWorld } from "../../lib/store";
import { places } from "../../sections/registry";
import PlaceIcon from "../ui/PlaceIcon";
import { tagScreen } from "../world3d/tagScreen";

// The name tags floating over each place when you look at the whole
// stadium. Each one is a real link, so it works with a keyboard and a
// screen reader as well as a click. The 3D world says where on the
// screen each tag belongs (world3d/Hotspots.tsx); their looks are the
// `.tag` rules in globals.css.

export default function Tags() {
  const section = useWorld((s) => s.section);
  const introDone = useWorld((s) => s.introDone);
  const show = useWorld((s) => s.show);
  const worldReady = useWorld((s) => s.worldReady);
  const holders = useRef<Record<string, HTMLDivElement | null>>({});
  const visible = worldReady && section === "home" && introDone && !show;

  // Follow the 3D world, frame by frame
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      for (const place of places) {
        const el = holders.current[place.id];
        const slot = tagScreen[place.id];
        if (!el || !slot) continue;
        el.style.transform = `translate3d(${slot.x.toFixed(1)}px, ${slot.y.toFixed(1)}px, 0)`;
        el.style.display = slot.visible ? "block" : "none";
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <nav aria-label="Places in the stadium, as name tags" className="pointer-events-none absolute inset-0 overflow-hidden">
      {places.map((place) => (
        <div
          key={place.id}
          ref={(el) => {
            holders.current[place.id] = el;
          }}
          className="absolute left-0 top-0 will-change-transform"
          style={{ display: "none" }}
        >
          <Link href={place.href} className="tag" data-visible={visible} tabIndex={visible ? 0 : -1} aria-hidden={!visible}>
            <span className="tag-label">
              <PlaceIcon id={place.id} className="tag-icon" />
              <span className="tag-text">
                <span className="tag-place">{place.place}</span>
                <span className="tag-title">{place.title}</span>
              </span>
            </span>
            <span className="tag-stem" />
            <span className="tag-pin" />
          </Link>
        </div>
      ))}
    </nav>
  );
}
