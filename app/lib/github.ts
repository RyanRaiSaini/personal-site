// A year of GitHub contributions, as the picture in the seats and the
// GitHub section use it. Fetched by app/api/contributions/route.ts.

export type Contributions = {
  user: string;
  // 53 weeks, oldest first; each week is 7 days, Sunday first.
  // 0 = none, 4 = a lot (GitHub's own shading levels). Days outside
  // the year (before the first day, after today) are -1.
  levels: number[][];
  // The same grid as contribution counts, where known (-1 = unknown)
  counts: number[][];
  dates: string[][]; // ISO dates for each cell ("" when outside the year)
  total: number;
  fetchedAt: string;
  // false when GitHub could not be reached and this is the saved copy
  live: boolean;
};

export const LEVEL_HEX = ["#1a2130", "#0e4429", "#006d32", "#26a641", "#39d353"] as const;
export const LEVEL_HEX_LIGHT = ["#e6e9ee", "#9be9a8", "#40c463", "#30a14e", "#216e39"] as const;
