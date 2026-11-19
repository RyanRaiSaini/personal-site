import type { SectionId } from "../../sections/registry";

// A small line drawing for each place in the stadium. Used on the name
// tags in the 3D world, in the menu and in the flat match view.

const paths: Record<SectionId, React.ReactNode> = {
  // the stadium bowl
  home: (
    <>
      <ellipse cx="12" cy="12" rx="9" ry="5.5" />
      <ellipse cx="12" cy="12" rx="4.5" ry="2.5" />
      <path d="M3 12v3c0 3 4 5.5 9 5.5s9-2.5 9-5.5v-3" />
    </>
  ),
  // the centre circle and the halfway line
  about: (
    <>
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="0.9" fill="currentColor" stroke="none" />
      <path d="M12 3v18" />
    </>
  ),
  // a goal and its net
  projects: (
    <>
      <path d="M3 19V6h18v13" />
      <path d="M3 10h18M3 14h18M8 6v13M12 6v13M16 6v13" strokeWidth="0.9" />
    </>
  ),
  // a dugout bench under its roof
  experience: (
    <>
      <path d="M3 10c3-4 15-4 18 0" />
      <path d="M4 10v9M20 10v9M6 15h12M7 15v4M17 15v4" />
    </>
  ),
  // a shirt
  skills: (
    <>
      <path d="M8 4 3 7l2 4 2-1v10h10V10l2 1 2-4-5-3c-.5 1.5-1.8 2.5-4 2.5S8.5 5.5 8 4Z" />
    </>
  ),
  // a trophy
  awards: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M7 6H4c0 3 1.5 4.5 3.5 4.5M17 6h3c0 3-1.5 4.5-3.5 4.5M12 14v3M8.5 20h7M9.5 17h5" />
    </>
  ),
  // a microphone
  news: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
    </>
  ),
  // a ticket
  resume: (
    <>
      <path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 0 0-4V6H3v2Z" transform="translate(0 1)" />
      <path d="M14 7v10" strokeDasharray="1.5 1.8" />
    </>
  ),
  // an envelope
  contact: (
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="m3.5 7 8.5 6.5L20.5 7" />
    </>
  ),
  // a screen
  live: (
    <>
      <rect x="2.5" y="6" width="19" height="9" rx="1.5" />
      <path d="M7 10.5h2M11 10.5h6M12 15v3M8 20h8" />
    </>
  ),
  // a grid of cards
  github: (
    <>
      <rect x="3" y="5" width="4" height="4" rx="0.8" />
      <rect x="10" y="5" width="4" height="4" rx="0.8" fill="currentColor" />
      <rect x="17" y="5" width="4" height="4" rx="0.8" />
      <rect x="3" y="12" width="4" height="4" rx="0.8" fill="currentColor" />
      <rect x="10" y="12" width="4" height="4" rx="0.8" />
      <rect x="17" y="12" width="4" height="4" rx="0.8" fill="currentColor" />
    </>
  ),
};

export default function PlaceIcon({ id, className }: { id: SectionId; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {paths[id]}
    </svg>
  );
}
