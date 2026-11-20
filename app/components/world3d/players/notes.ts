// ------------------------------------------------------------------
// The notes that come with the player model.
//
// Blender (blender/build_players.py) writes public/players/player.json
// beside the model: how long each movement is, when and where the kick
// in it lands, how far the player travels during it, and which bones
// each standing pose fixes. The site needs those numbers to put a
// player's boot on the ball at the right moment.
//
// Plain data with no 3D code in it, so it is safe to import anywhere.
// ------------------------------------------------------------------

export type ClipNote = {
  // seconds
  length: number;
  // it repeats, and this is how fast the ground goes by under it (metres a second)
  loop?: boolean;
  speed?: number;
  // how far the player has travelled at each thirtieth of a second: [sideways, forward] in metres
  travel?: [number, number][];
  // the kick: when (seconds), with which foot, and where that foot is then,
  // measured from where the player started: [sideways, up, forward]
  kick?: { at: number; foot: "left" | "right"; where: [number, number, number]; speed: number };
};

export type PlayerNotes = {
  // the height the model was built at, in metres
  height: number;
  // the average colour of the model's plain skin, as a screen stores it (0 to 1)
  skin: [number, number, number];
  // where the back of the shirt is on the shirt's picture: u = a + b * x + c * z, and the same for v
  print: { u: [number, number, number]; v: [number, number, number] };
  clips: Record<string, ClipNote>;
  // for each standing pose, the bones it fixes
  stances: Record<string, string[]>;
};

export const NOTES_URL = "/players/player.json";
export const MODEL_URL = "/players/player.glb";

// How often the travel in a clip was written down
const STEPS_A_SECOND = 30;

let pending: Promise<PlayerNotes> | null = null;

// Starts the download once and hands every caller the same result
export function loadPlayerNotes(): Promise<PlayerNotes> {
  pending ??= fetch(NOTES_URL).then((response) => {
    if (!response.ok) throw new Error(`Could not load ${NOTES_URL} (${response.status})`);
    return response.json() as Promise<PlayerNotes>;
  });
  return pending;
}

// How far a player has travelled `time` seconds into a clip: [sideways, forward]
export function travelAt(clip: ClipNote, time: number): [number, number] {
  const steps = clip.travel;
  if (!steps || steps.length === 0) return [0, 0];
  const at = Math.min(steps.length - 1, Math.max(0, time * STEPS_A_SECOND));
  const before = Math.floor(at);
  const after = Math.min(steps.length - 1, before + 1);
  const part = at - before;
  return [steps[before][0] + (steps[after][0] - steps[before][0]) * part, steps[before][1] + (steps[after][1] - steps[before][1]) * part];
}
