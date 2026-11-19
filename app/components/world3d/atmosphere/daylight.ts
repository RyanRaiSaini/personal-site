import { Vector3 } from "three";

// ------------------------------------------------------------------
// The stadium's daylight.
//
// By day the stadium is lit by one photographed sky from Poly Haven
// ("Kloofendal 48d Partly Cloudy", CC0). The photo fixes how high the
// sun is (48 degrees). Which side it shines from is chosen here, so
// that it comes over the east stand and lands on the main stand and
// the near half of the pitch.
//
// To move the sun round the stadium, change SUN_COMPASS. The sky photo
// and the light from it turn with it.
// ------------------------------------------------------------------

const RAD = Math.PI / 180;

// Where the sun is in the photo (from public/stadium/sky.json)
export const PHOTO_SUN_ELEVATION = 47.88;
const PHOTO_SUN_ANGLE = 34.26;

// Where the sun should be in the stadium: degrees from north (+X)
// toward east (+Z). 114 is east-south-east.
export const SUN_COMPASS = 114;

// How far the photo has to turn for its sun to sit there
export const SKY_TURN = (SUN_COMPASS - PHOTO_SUN_ANGLE) * RAD;

// A direction that points at the sun
export const SUN_DIRECTION = new Vector3(
  Math.cos(PHOTO_SUN_ELEVATION * RAD) * Math.cos(SUN_COMPASS * RAD),
  Math.sin(PHOTO_SUN_ELEVATION * RAD),
  Math.cos(PHOTO_SUN_ELEVATION * RAD) * Math.sin(SUN_COMPASS * RAD),
);

export const SKY_FILES = {
  light: "/stadium/sky-light.hdr",
  picture: "/stadium/sky.jpg",
};

// Numbers worth trying live. In the browser console:
//   __tune.sun = 5        brighter sun
//   __tune.sky = 1.3      more light from the sky
//   __tune.exposure = 0.9 a darker picture overall
export const tune = {
  sun: 1,
  sky: 1,
  fill: 1,
  floods: 1,
  exposure: 1,
};

if (typeof window !== "undefined") (window as unknown as { __tune: typeof tune }).__tune = tune;
