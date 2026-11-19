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
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, meshopt, prune, weld } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";

const input = process.argv[2] ?? "public/stadium/stadium.raw.glb";
const output = process.argv[3] ?? "public/stadium/stadium.glb";

await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const document = await io.read(input);

await document.transform(
  dedup(),
  // corners are merged only when position, direction, texture position and light all match
  weld(),
  prune(),
  meshopt({ encoder: MeshoptEncoder, level: "medium", quantizePosition: 16, quantizeTexcoord: 14, quantizeColor: 8, quantizeNormal: 8 }),
);

await io.write(output, document);

const root = document.getRoot();
let triangles = 0;
for (const mesh of root.listMeshes()) {
  for (const primitive of mesh.listPrimitives()) {
    const indices = primitive.getIndices();
    triangles += (indices ? indices.getCount() : primitive.getAttribute("POSITION").getCount()) / 3;
  }
}
const mb = (path) => (statSync(path).size / 1048576).toFixed(2);
console.log(`${input} ${mb(input)} MB  ->  ${output} ${mb(output)} MB`);
console.log(`${root.listNodes().length} parts, ${root.listMaterials().length} materials, ${Math.round(triangles).toLocaleString()} triangles`);
console.log(`parts: ${root.listNodes().map((n) => n.getName()).join(", ")}`);
