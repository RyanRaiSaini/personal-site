import type { Contributions } from "./github";

// Reads the public contribution calendar that GitHub shows on a
// profile page and turns it into the 53 x 7 grid the site uses. No
// login or key is needed for this page.

const WEEKS = 53;
const DAY_MS = 86_400_000;

function attribute(tag: string, name: string): string | null {
  const match = new RegExp(`${name}="([^"]*)"`).exec(tag);
  return match ? match[1] : null;
}

export function parseContributions(html: string, user: string): Contributions | null {
  const levelByDate = new Map<string, number>();
  const idByDate = new Map<string, string>();
  for (const match of html.matchAll(/<td[^>]*data-date="[^"]*"[^>]*>/g)) {
    const tag = match[0];
    const date = attribute(tag, "data-date");
    const level = attribute(tag, "data-level");
    if (!date || level === null) continue;
    levelByDate.set(date, Number(level));
    const id = attribute(tag, "id");
    if (id) idByDate.set(date, id);
  }
  // A year of days should be there; anything much less means the page changed
  if (levelByDate.size < 300) return null;

  const countById = new Map<string, number>();
  for (const match of html.matchAll(/<tool-tip[^>]*for="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const text = match[2].trim();
    const number = /^([\d,]+)\s+contribution/.exec(text);
    countById.set(match[1], number ? Number(number[1].replace(/,/g, "")) : 0);
  }

  const dates = [...levelByDate.keys()].sort();
  const last = new Date(`${dates[dates.length - 1]}T00:00:00Z`);
  // The last column is the week that contains the newest day
  const lastSunday = new Date(last.getTime() - last.getUTCDay() * DAY_MS);
  const firstSunday = new Date(lastSunday.getTime() - (WEEKS - 1) * 7 * DAY_MS);

  const levels: number[][] = [];
  const counts: number[][] = [];
  const cellDates: string[][] = [];
  let summed = 0;
  for (let week = 0; week < WEEKS; week++) {
    const levelColumn: number[] = [];
    const countColumn: number[] = [];
    const dateColumn: string[] = [];
    for (let day = 0; day < 7; day++) {
      const iso = new Date(firstSunday.getTime() + (week * 7 + day) * DAY_MS).toISOString().slice(0, 10);
      const level = levelByDate.get(iso);
      if (level === undefined) {
        levelColumn.push(-1);
        countColumn.push(-1);
        dateColumn.push("");
        continue;
      }
      const id = idByDate.get(iso);
      const count = id !== undefined && countById.has(id) ? (countById.get(id) as number) : -1;
      if (count > 0) summed += count;
      levelColumn.push(level);
      countColumn.push(count);
      dateColumn.push(iso);
    }
    levels.push(levelColumn);
    counts.push(countColumn);
    cellDates.push(dateColumn);
  }

  const heading = /([\d,]+)\s+contributions?\s+in the last year/.exec(html.replace(/\s+/g, " "));
  const total = heading ? Number(heading[1].replace(/,/g, "")) : summed;

  return { user, levels, counts, dates: cellDates, total, fetchedAt: new Date().toISOString(), live: true };
}
