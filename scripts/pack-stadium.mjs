// ------------------------------------------------------------------
// Squeezes the stadium model for the web.
//
//   npm run stadium:pack
//
// Blender writes public/stadium/stadium.raw.glb (see blender/build.py).
// This merges identical corners, stores positions as small whole
// numbers and compresses the result with Meshopt, which the site can
// unpack without downloading anything extra. The output is
// public/stadium/stadium.glb.
// ------------------------------------------------------------------

import { statSync } from "node:fs";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression } from "@gltf-transform/extensions";
import { dedup, prune, quantize, reorder, weld } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";

const input = process.argv[2] ?? "public/stadium/stadium.raw.glb";
const output = process.argv[3] ?? "public/stadium/stadium.glb";

// The surfaces that carry a picture on the site (a photographed
// material, the ring of screens, the lamps). Only these need to know
// where on the picture each corner sits; the rest drop that to save
// space. Keep in step with app/components/world3d/stadium/materials.ts.
const PICTURED = new Set(["Concrete", "Aisle", "Riser", "WallDark", "Fascia", "Soffit", "Hoarding", "RoofDeck", "Screen", "FloodLens"]);

await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const document = await io.read(input);
const root = document.getRoot();

for (const mesh of root.listMeshes()) {
  for (const primitive of mesh.listPrimitives()) {
    const name = primitive.getMaterial()?.getName() ?? "";
    if (!PICTURED.has(name)) primitive.setAttribute("TEXCOORD_0", null);
  }
}

await document.transform(
  dedup(),
  // corners are merged only when position, direction, picture position and light all match
  weld(),
  // The model's own materials have no pictures (the site supplies them),
  // so the picture positions must be kept on purpose
  prune({ keepAttributes: true }),
  reorder({ encoder: MeshoptEncoder, target: "size" }),
  // Picture positions are in metres and run to several hundred, so they
  // stay as they are; everything else becomes small whole numbers
  quantize({ pattern: /^(POSITION|NORMAL|COLOR)(_\d+)?$/, quantizePosition: 16, quantizeNormal: 8, quantizeColor: 8 }),
);
document.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });

await io.write(output, document);

let triangles = 0;
let pictured = 0;
for (const mesh of root.listMeshes()) {
  for (const primitive of mesh.listPrimitives()) {
    const indices = primitive.getIndices();
    triangles += (indices ? indices.getCount() : primitive.getAttribute("POSITION").getCount()) / 3;
    if (primitive.getAttribute("TEXCOORD_0")) pictured += 1;
  }
}
const mb = (path) => (statSync(path).size / 1048576).toFixed(2);
console.log(`${input} ${mb(input)} MB  ->  ${output} ${mb(output)} MB`);
console.log(`${root.listNodes().length} parts, ${root.listMaterials().length} materials, ${Math.round(triangles).toLocaleString()} triangles, ${pictured} surfaces with a picture`);
console.log(`parts: ${root.listNodes().map((n) => n.getName()).join(", ")}`);
