import { cacheLife } from "next/cache";
import snapshot from "../../data/contributions.snapshot.json";
import { profile } from "../../data/portfolio";
import type { Contributions } from "../../lib/github";
import { parseContributions } from "../../lib/githubParse";

// A year of my GitHub contributions, for the crowd card display and
// the GitHub section. Read from GitHub's public profile calendar and
// kept for an hour. If GitHub can't be reached, the copy saved in
// app/data/contributions.snapshot.json is sent instead.

async function loadContributions(): Promise<Contributions | null> {
  "use cache";
  cacheLife("hours");

  const response = await fetch(`https://github.com/users/${profile.githubUser}/contributions`, {
    headers: { "User-Agent": "personal-site", Accept: "text/html" },
  });
  if (!response.ok) return null;
  return parseContributions(await response.text(), profile.githubUser);
}

export async function GET() {
  let live: Contributions | null = null;
  try {
    live = await loadContributions();
  } catch {
    live = null;
  }
  return Response.json(live ?? { ...(snapshot as Contributions), live: false });
}
