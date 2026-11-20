// ------------------------------------------------------------------
// Who is who on the pitch.
//
// Every player is the same model (public/players/player.glb) with his
// own skin tone, hair, beard, height and shirt print. The outfield
// players wear the plain white kit; the name and number go on the back.
//
// Skin and hair colours are chosen to match each player. Hair and
// beard pick from the pieces the model comes with:
//
//   hairStyle  "medium"  a full, loose fringe
//              "curls"   short tight curls on top, cut close at the sides
//              "crop"    cut close all over
//   beard      "goatee"  a full chin beard and a thin moustache
//              "strap"   a light beard along the jaw, with a moustache
//              "chin"    light growth on the chin and upper lip
//              (leave it out for clean-shaven)
// ------------------------------------------------------------------

export type Kit = {
  // as printed on the shirt; leave empty for no print
  name: string;
  number: number | null;
  skin: string;
  hair: string;
  hairStyle: "medium" | "curls" | "crop";
  beard?: "goatee" | "strap" | "chin";
  // in metres; the model is 1.80 if this is left out
  height?: number;
  // the colour of the shirt, shorts and socks, for anyone not in white
  colour?: string;
};

export const KITS: Record<"saini" | "jude" | "mbappe" | "trent" | "keeper", Kit> = {
  // Me: number 8
  saini: { name: "SAINI", number: 8, skin: "#b9855a", hair: "#14100e", hairStyle: "medium", beard: "goatee" },
  // Jude Bellingham: number 5
  jude: { name: "BELLINGHAM", number: 5, skin: "#a7774f", hair: "#17110d", hairStyle: "curls", beard: "chin", height: 1.86 },
  // Kylian Mbappé: number 10
  mbappe: { name: "MBAPPÉ", number: 10, skin: "#7c4c30", hair: "#120d0a", hairStyle: "crop", height: 1.78 },
  // Trent Alexander-Arnold: number 66
  trent: { name: "ALEXANDER-ARNOLD", number: 66, skin: "#b08058", hair: "#15100d", hairStyle: "curls", beard: "strap", height: 1.8 },
  // The goalkeeper the two guests score past: nobody in particular
  keeper: { name: "", number: null, skin: "#c08e68", hair: "#1a1410", hairStyle: "crop", colour: "#2c6a55", height: 1.9 },
};
