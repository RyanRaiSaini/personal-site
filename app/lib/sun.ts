// Where the sun is in the sky for a place and a moment, from standard
// astronomy formulas. The stadium uses this to light itself the way
// Brampton is lit right now: daylight by day, floodlights after dark.

const RAD = Math.PI / 180;
const DAY_MS = 86_400_000;
const J1970 = 2_440_588;
const J2000 = 2_451_545;

export type SunPosition = {
  elevation: number; // degrees above the horizon (negative = below)
  azimuth: number; // degrees clockwise from north
};

export function sunPosition(date: Date, latitude: number, longitude: number): SunPosition {
  const days = date.getTime() / DAY_MS - 0.5 + J1970 - J2000;

  const meanAnomaly = RAD * (357.5291 + 0.98560028 * days);
  const centre = RAD * (1.9148 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly) + 0.0003 * Math.sin(3 * meanAnomaly));
  const eclipticLongitude = meanAnomaly + centre + RAD * 102.9372 + Math.PI;
  const obliquity = RAD * 23.4397;

  const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLongitude));
  const rightAscension = Math.atan2(Math.sin(eclipticLongitude) * Math.cos(obliquity), Math.cos(eclipticLongitude));

  const phi = RAD * latitude;
  const siderealTime = RAD * (280.16 + 360.9856235 * days) + RAD * longitude;
  const hourAngle = siderealTime - rightAscension;

  const elevation = Math.asin(Math.sin(phi) * Math.sin(declination) + Math.cos(phi) * Math.cos(declination) * Math.cos(hourAngle));
  // Measured from south, turning west; shifted to "clockwise from north"
  const fromSouth = Math.atan2(Math.sin(hourAngle), Math.cos(hourAngle) * Math.sin(phi) - Math.tan(declination) * Math.cos(phi));

  return {
    elevation: elevation / RAD,
    azimuth: ((fromSouth / RAD + 180) % 360 + 360) % 360,
  };
}

// 0 at night, 1 in full daylight, with a smooth dawn and dusk between
// six degrees below and eight degrees above the horizon
export function daylight(elevation: number): number {
  const t = Math.min(1, Math.max(0, (elevation + 6) / 14));
  return t * t * (3 - 2 * t);
}

// How strong the warm sunrise / sunset colour is: strongest with the
// sun on the horizon, gone once it is well up or well down
export function twilight(elevation: number): number {
  const distance = Math.abs(elevation - 1) / 10;
  return Math.max(0, 1 - distance * distance);
}
