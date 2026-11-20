// ------------------------------------------------------------------
// What a player is doing, written as a short list of movements to mix.
//
// The movements themselves are motion-capture clips that come with the
// player model (blender/build_players.py lists them). A "layer" names
// one clip, how far into it to be, and how strongly it counts. Several
// layers at once blend: half a run and half a celebration is a player
// slowing into his celebration.
//
// A standing pose (hands on hips, arms folded...) only fixes the bones
// it needs. Underneath it the breathing clip keeps the rest of him
// alive, with those same bones left out.
//
// Plain data with no 3D code in it, so it is safe to import anywhere.
// ------------------------------------------------------------------

export type ClipName = "idle" | "jog" | "run" | "penalty" | "strike" | "long-pass" | "victory" | "sit" | "keeper-ready" | "keeper-dive";

// hips: hands on hips. folded: arms folded. wide: arms flung wide. foot: right foot on the ball.
export type Stance = "hips" | "folded" | "wide" | "foot";

export type Layer = {
  clip: ClipName | `stance-${Stance}`;
  // seconds into the clip. Clips that repeat wrap round; the others stop at their end.
  time: number;
  // how strongly this layer counts, 0 to 1
  weight: number;
  // leave out the bones these poses fix
  without?: Stance[];
};

export function ease(t: number): number {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
}

// Standing and breathing, optionally in one or more poses
export function standing(time: number, stances: Stance[] = [], weight = 1): Layer[] {
  if (weight <= 0) return [];
  const layers: Layer[] = [{ clip: "idle", time, weight, without: stances }];
  for (const stance of stances) layers.push({ clip: `stance-${stance}`, time: 0, weight });
  return layers;
}

// One clip, on its own
export function playing(clip: ClipName, time: number, weight = 1): Layer[] {
  return weight <= 0 ? [] : [{ clip, time, weight }];
}

// Part-way from one thing to another. t = 0 gives `from`, t = 1 gives `to`.
export function blend(from: Layer[], to: Layer[], t: number): Layer[] {
  const k = Math.min(1, Math.max(0, t));
  return [...from.map((layer) => ({ ...layer, weight: layer.weight * (1 - k) })), ...to.map((layer) => ({ ...layer, weight: layer.weight * k }))];
}
