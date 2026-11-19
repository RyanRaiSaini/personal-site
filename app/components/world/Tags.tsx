"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useWorld } from "../../lib/store";
import { places } from "../../sections/registry";
import PlaceIcon from "../ui/PlaceIcon";
import { tagFrame, tagScreen } from "../world3d/tagScreen";

// The name tags floating over each place when you look at the whole
// stadium: small signs, one per section. Each is a real link, so it
// works with a keyboard and a screen reader as well as a click. The 3D
// world says where on the screen each tag belongs
// (world3d/Hotspots.tsx); their looks are the `.tag` rules in
// globals.css.
//
// A tag never sits on top of the page's own text. Anything marked
// `data-tag-avoid` (the name caption on the home screen, the top bar)
// is measured, and a tag that would land on it is hidden until the
// camera has moved on. The Places menu lists every section all the time.

// Roughly how much room a tag takes around its pin, in pixels, and how
// far one is raised to clear another
const TAG = { halfWidth: 62, above: 62, below: 10, labelHeight: 32, lift: 34 };

type Box = { left: number; right: number; top: number; bottom: number };

export default function Tags() {
  const section = useWorld((s) => s.section);
  const introDone = useWorld((s) => s.introDone);
  const show = useWorld((s) => s.show);
  const worldReady = useWorld((s) => s.worldReady);
  const narrow = useWorld((s) => s.narrow);
  const holders = useRef<Record<string, HTMLDivElement | null>>({});
  // On a narrow screen the tags would sit on top of the home text, and
  // the row of places below it does the same job
  const visible = worldReady && section === "home" && introDone && !show && !narrow;

  // The tags are only moved while they can be seen (and for the moment
  // it takes them to fade out)
  const movingUntil = useRef(0);
  useEffect(() => {
    movingUntil.current = visible ? Infinity : performance.now() + 700;
  }, [visible]);

  // Follow the 3D world: it calls this after each frame it draws
  useEffect(() => {
    const last: Record<string, string> = {};
    let avoid: Box[] = [];
    let measuredAt = -Infinity;

    const measure = (now: number) => {
      measuredAt = now;
      avoid = Array.from(document.querySelectorAll("[data-tag-avoid]"), (el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
      }).filter((box) => box.right > box.left && box.bottom > box.top);
    };

    tagFrame.drawn = () => {
      const now = performance.now();
      if (now > movingUntil.current) return;
      // the page's text does not move often: look again twice a second
      if (now - measuredAt > 500) measure(now);
      // where the labels already placed this frame are, so the next can step clear
      const placed: Box[] = [];
      for (const place of places) {
        const el = holders.current[place.id];
        const slot = tagScreen[place.id];
        if (!el || !slot) continue;
        const x = Math.round(slot.x);
        const y = Math.round(slot.y);
        const covered = avoid.some((box) => x + TAG.halfWidth > box.left && x - TAG.halfWidth < box.right && y + TAG.below > box.top && y - TAG.above < box.bottom);
        const shown = slot.visible && !covered;
        let lift = 0;
        if (shown) {
          // raise the label, up to two steps, until it clears the others
          const label = (step: number): Box => ({ left: x - TAG.halfWidth, right: x + TAG.halfWidth, bottom: y - 26 - step * TAG.lift, top: y - 26 - step * TAG.lift - TAG.labelHeight });
          const clashes = (box: Box) => placed.some((other) => box.left < other.right && box.right > other.left && box.top < other.bottom && box.bottom > other.top);
          while (lift < 2 && clashes(label(lift))) lift += 1;
          placed.push(label(lift));
        }
        // Whole pixels: a tag drifting slowly then changes a dozen times a
        // second, not sixty, and its words stay sharp. Each change makes
        // the browser restyle the tag, which measured as the dearest
        // thing on the overview.
        const next = shown ? `translate3d(${x}px, ${y}px, 0)|${lift}` : "hidden";
        // the page is only touched when a tag has actually moved
        if (last[place.id] === next) continue;
        last[place.id] = next;
        if (shown) {
          el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          el.style.setProperty("--lift", String(lift));
        }
        el.style.display = shown ? "block" : "none";
      }
    };
    return () => {
      tagFrame.drawn = null;
    };
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
          <Link href={place.href} className="tag" data-visible={visible} tabIndex={visible ? 0 : -1} aria-hidden={!visible} aria-label={`${place.title}: ${place.place}`} title={place.place}>
            <span className="tag-label">
              <PlaceIcon id={place.id} className="tag-icon" />
              <span className="tag-title">{place.title}</span>
            </span>
            <span className="tag-stem" />
            <span className="tag-pin" />
          </Link>
        </div>
      ))}
    </nav>
  );
}
