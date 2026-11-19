import generated from "./photos.generated.json";

// Captions and descriptions for every photo on the site. The image
// files are made by scripts/optimize-photos.mjs, which also writes the
// sizes in photos.generated.json.
//
// To change a caption, edit it here. To change which photos appear in
// the press-room album, edit `album` at the bottom.

export type Photo = {
  slug: string;
  src: string;
  thumb: string;
  width: number;
  height: number;
  blur: string;
  caption: string;
  alt: string;
  credit?: string;
};

type Sizes = Record<string, { width: number; height: number; blur: string }>;
const sizes = generated as Sizes;

function photo(slug: string, caption: string, alt: string, credit?: string): Photo {
  const size = sizes[slug];
  if (!size) throw new Error(`No generated size for photo "${slug}". Run scripts/optimize-photos.mjs.`);
  return {
    slug,
    src: `/photos/${slug}.webp`,
    thumb: `/photos/thumbs/${slug}.webp`,
    width: size.width,
    height: size.height,
    blur: size.blur,
    caption,
    alt,
    credit,
  };
}

export const headshot = photo("headshot", "Ryan Rai Saini", "Portrait of Ryan Rai Saini in a black polo shirt.");

export const starboardPortrait = photo("starboard-ryan", "My STARboard portrait", "Ryan's portrait from the Make-A-Wish Canada STARboard page.", "Make-A-Wish Canada");

const teamStars = photo("allstar-team-stars", "With the All-Stars", "Ryan and other Make-A-Wish guests in a team photo with NBA All-Stars in navy jerseys.");
const teamWorld = photo("allstar-team-world", "With the All-Stars", "Ryan and other Make-A-Wish guests in a team photo with NBA All-Stars in white jerseys.");
const teamStripes = photo("allstar-team-stripes", "With the All-Stars", "Ryan and other Make-A-Wish guests in a team photo with NBA All-Stars in red jerseys.");
const mediaDayAutograph = photo("media-day-autograph", "All-Star Media Day", "An All-Star signs Ryan's wristband at Media Day.");
const mediaDay1 = photo("media-day-1", "All-Star Media Day", "Ryan with an All-Star in a red jersey at Media Day.");
const mediaDay2 = photo("media-day-2", "All-Star Media Day", "Ryan with an All-Star in a white jersey at Media Day.");
const mediaDay3 = photo("media-day-3", "All-Star Media Day", "Ryan with an All-Star in a white jersey, both making peace signs.");
const arena = photo("arena", "Inside the arena", "Ryan in the arena seats on All-Star weekend.");
const risingStars1 = photo("rising-stars-1", "Meeting the Rising Stars", "Ryan holding a signed basketball next to a Rising Stars player.");
const risingStars2 = photo("rising-stars-2", "Meeting the Rising Stars", "Ryan with a Rising Stars player, a signed basketball in hand.");
const risingStars3 = photo("rising-stars-3", "Meeting the Rising Stars", "Ryan and a Rising Stars player making peace signs.");
const risingStars4 = photo("rising-stars-4", "Meeting the Rising Stars", "Ryan holding a signed basketball with two Rising Stars players.");
const lounge = photo("allstar-lounge", "All-Star weekend", "Ryan with two guests in a lounge on All-Star weekend.");

// The lead photo of the album, also framed on the press-room wall
export const albumLead = teamStars;

// The press-room album, in order
export const album: Photo[] = [teamStars, mediaDayAutograph, teamWorld, mediaDay1, risingStars1, arena, teamStripes, mediaDay2, risingStars2, lounge, mediaDay3, risingStars3, risingStars4];
