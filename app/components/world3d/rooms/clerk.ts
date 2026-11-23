import { CanvasTexture, Color, SRGBColorSpace, type Texture } from "three";
import { CELLS, loadSheets } from "../stadium/Crowd";

// ------------------------------------------------------------------
// A person to sit behind a counter: one of the crowd's rendered people
// (blender/build_crowd.py), sitting, recoloured as staff. The crowd's
// second picture marks the shirt, skin, trousers and hair, so the shirt
// can be any colour.
// ------------------------------------------------------------------

const SITTING = [0, 4]; // the two men, hands on knees (crowd.json)

export async function clerkPicture(which: 0 | 1, shirt: string, skin = 0.25): Promise<Texture> {
  const { colour, mask } = await loadSheets();
  const picture = colour.image as HTMLImageElement;
  const parts = mask.image as HTMLImageElement;
  const cellW = picture.width / CELLS;
  const cellH = picture.height;
  const cell = SITTING[which];

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
  const toLinear = (v: number) => Math.pow(v / 255, 2.2);
  const toByte = (v: number) => Math.round(255 * Math.pow(Math.min(1, v), 1 / 2.2));
  for (let i = 0; i < px.length; i += 4) {
    const r = where[i] / 255;
    const g = where[i + 1] / 255;
    for (let c = 0; c < 3; c++) {
      const lin = toLinear(px[i + c]);
      const mixed = lin * (1 + (shirtRGB[c] - 1) * r) * (1 + (skinRGB[c] - 1) * g);
      px[i + c] = toByte(mixed);
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}
