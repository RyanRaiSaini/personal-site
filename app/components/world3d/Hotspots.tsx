"use client";

import { Html } from "@react-three/drei";
import { useWorld } from "../../lib/store";
import { places } from "../../sections/registry";
import PlaceIcon from "../ui/PlaceIcon";
import { SPOTS } from "./spots";

// The name tags floating over each place when you look at the whole
// stadium. Each one is a real link, so it works with a keyboard and a
// screen reader as well as a click. Their positions are the `anchor`
// values in spots.ts; their looks are the `.tag` rules in globals.css.

export default function Hotspots() {
  const section = useWorld((s) => s.section);
  const introDone = useWorld((s) => s.introDone);
  const show = useWorld((s) => s.show);
  const navigate = useWorld((s) => s.navigate);
  const visible = section === "home" && introDone && !show;

  return (
    <>
      {places.map((place) => (
        <Html key={place.id} position={SPOTS[place.id as keyof typeof SPOTS].anchor} center zIndexRange={[40, 10]} wrapperClass="tag-wrap">
          <a
            href={place.href}
            className="tag"
            data-visible={visible}
            tabIndex={visible ? 0 : -1}
            aria-hidden={!visible}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey) return;
              event.preventDefault();
              navigate(place.href);
            }}
          >
            <span className="tag-label">
              <PlaceIcon id={place.id} className="tag-icon" />
              <span className="tag-text">
                <span className="tag-place">{place.place}</span>
                <span className="tag-title">{place.title}</span>
              </span>
            </span>
            <span className="tag-stem" />
            <span className="tag-pin" />
          </a>
        </Html>
      ))}
    </>
  );
}
