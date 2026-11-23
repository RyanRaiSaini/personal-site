import { CanvasTexture, Color, SRGBColorSpace, type Texture } from "three";

// ------------------------------------------------------------------
// People for the rooms: the crowd's rendered people (blender/build_crowd.py),
// seated, recoloured as whoever they need to be: a clerk at a ticket
// window, a reporter in the press room. The second picture of each sheet
// marks the shirt, skin, trousers and hair, so those can be any colour.
//
// Three sheets: "crowd" sees them seated from the front, "crowd-back"
// from behind; "queue" has them standing (build_crowd.py --stand), each
// seen from four sides (VIEW). Each has eight cells: the two men, four
// each.
// ------------------------------------------------------------------

export const PERSON = { width: 1.097, height: 1.8 }; // metres, as rendered
const CELLS = 8;
// [man, pose] -> cell: poses are sit, arms up, arm up, arms high
export const POSE = { sit: 0, armUp: 2 } as const;
// on the "queue" sheet the four cells are the sides he is seen from
export const VIEW = { back: 0, backQuarter: 1, frontQuarter: 2, front: 3 } as const;

type Sheet = "crowd" | "crowd-back" | "queue";
const sheets = new Map<Sheet, Promise<[HTMLImageElement, HTMLImageElement]>>();
function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}
function load(sheet: Sheet) {
  let pair = sheets.get(sheet);
  if (!pair) {
    pair = Promise.all([loadImage(`/stadium/crowd/${sheet}-colour.webp`), loadImage(`/stadium/crowd/${sheet}-mask.webp`)]);
    sheets.set(sheet, pair);
  }
  return pair;
}

export type PersonLook = {
  sheet?: Sheet;
  man: 0 | 1;
  pose?: number; // POSE.sit or POSE.armUp; on the "queue" sheet, a VIEW
  shirt: string;
  skin?: number; // 0 fair to 1 dark
  hair?: string;
};

export async function personPicture({ sheet = "crowd", man, pose = POSE.sit, shirt, skin = 0.25, hair }: PersonLook): Promise<Texture> {
  const [picture, parts] = await load(sheet);
  const cellW = picture.width / CELLS;
  const cellH = picture.height;
  const cell = man * 4 + pose;

  const canvas = document.createElement("canvas");
  canvas.width = cellW;
  canvas.height = cellH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(parts, cell * cellW, 0, cellW, cellH, 0, 0, cellW, cellH);
  const where = ctx.getImageData(0, 0, cellW, cellH).data;
  ctx.clearRect(0, 0, cellW, cellH);
  ctx.drawImage(picture, cell * cellW, 0, cellW, cellH, 0, 0, cellW, cellH);
  const image = ctx.getImageData(0, 0, cellW, cellH);
  const px = image.data;

  const tint = new Color(shirt).convertSRGBToLinear();
  const shirtRGB = [tint.r, tint.g, tint.b].map((v) => Math.min(1.6, v * 1.45));
  // the pictured men are fair: darken toward the chosen tone, as the crowd does
  const skinRGB = [1 - skin * 0.66, 1 - skin * 0.76, 1 - skin * 0.81];
  const hairColour = hair ? new Color(hair).convertSRGBToLinear() : null;
  const toLinear = (v: number) => Math.pow(v / 255, 2.2);
  const toByte = (v: number) => Math.round(255 * Math.pow(Math.min(1, v), 1 / 2.2));
  for (let i = 0; i < px.length; i += 4) {
    const r = where[i] / 255;
    const g = where[i + 1] / 255;
    const b = where[i + 2] / 255;
    // blue: full for trousers, half for hair
    const isHair = hairColour && b > 0.55 && b < 0.85 ? 1 : 0;
    const shade = 0.3 * toLinear(px[i]) + 0.59 * toLinear(px[i + 1]) + 0.11 * toLinear(px[i + 2]);
    for (let c = 0; c < 3; c++) {
      let lin = toLinear(px[i + c]) * (1 + (shirtRGB[c] - 1) * r) * (1 + (skinRGB[c] - 1) * g);
      if (isHair && hairColour) lin = [hairColour.r, hairColour.g, hairColour.b][c] * (0.6 + 2.2 * shade);
      px[i + c] = toByte(lin);
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
