import type { Kit } from "./Player";

// Who wears what. All three play in the plain white kit; the name and
// number go on the back. Skin and hair colours are chosen to match
// each player.

export const KITS: Record<"saini" | "jude" | "mbappe", Kit> = {
  // Me: number 8
  saini: { name: "SAINI", number: 8, skin: "#b9855a", hair: "#14100e", hairStyle: "medium", beard: true },
  // Jude Bellingham: number 5
  jude: { name: "BELLINGHAM", number: 5, skin: "#a7774f", hair: "#17110d", hairStyle: "fade" },
  // Kylian Mbappé: number 10
  mbappe: { name: "MBAPPÉ", number: 10, skin: "#7c4c30", hair: "#120d0a", hairStyle: "short" },
};
