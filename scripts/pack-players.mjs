// ------------------------------------------------------------------
// Squeezes the footballer for the web.
//
//   npm run players:pack
//
// Blender writes public/players/player.raw.glb (see
// blender/build_players.py). This turns its pictures into WebP, drops
// the animation data nothing uses, stores what is left as small whole
// numbers and compresses it with Meshopt, which the site can unpack
// without downloading anything extra. The output is
// public/players/player.glb.
// ------------------------------------------------------------------

import { statSync } from "node:fs";
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS, EXTMeshoptCompression } from "@gltf-transform/extensions";
import { dedup, prune, quantize, reorder, resample, textureCompress, weld } from "@gltf-transform/functions";
import { MeshoptEncoder } from "meshoptimizer";
import sharp from "sharp";

const input = process.argv[2] ?? "public/players/player.raw.glb";
const output = process.argv[3] ?? "public/players/player.glb";

await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ "meshopt.encoder": MeshoptEncoder });
const document = await io.read(input);
const root = document.getRoot();

// ---- materials ----
// Hair is cut out by its picture; beards fade out at their edges. The
// extras Blender adds for shine would make the site use its dearest
// kind of material, so they go.
for (const material of root.listMaterials()) {
  const name = material.getName();
  for (const extension of material.listExtensions()) material.setExtension(extension.extensionName, null);
  material.setMetallicFactor(0);
  material.setMetallicRoughnessTexture(null);
  if (name === "Hair") material.setAlphaMode("MASK").setAlphaCutoff(0.42).setDoubleSided(true);
  else if (name === "Beard") material.setAlphaMode("BLEND").setDoubleSided(false);
  else material.setAlphaMode("OPAQUE");
}

// ---- movement ----
// Bones only turn. The one bone that also moves is the hips (up and
// down; the travel over the ground was taken out in Blender).
let dropped = 0;
for (const animation of root.listAnimations()) {
  for (const channel of animation.listChannels()) {
    const path = channel.getTargetPath();
    const bone = channel.getTargetNode()?.getName() ?? "";
    if (path === "scale" || (path === "translation" && !bone.endsWith("Hips"))) {
      channel.dispose();
      dropped += 1;
    }
  }
}

await document.transform(
  dedup(),
  // keyframes that a straight line between their neighbours already gives
  resample({ tolerance: 0.0004 }),
  weld(),
  prune({ keepAttributes: true }),
  // colour pictures and the pictures of folds want different care
  textureCompress({ encoder: sharp, targetFormat: "webp", slots: /^baseColor/, quality: 84 }),
  textureCompress({ encoder: sharp, targetFormat: "webp", slots: /^normal/, quality: 92 }),
  reorder({ encoder: MeshoptEncoder, target: "size" }),
  quantize({ quantizePosition: 14, quantizeNormal: 10, quantizeTexcoord: 12, quantizeColor: 8, quantizeWeight: 8 }),
);
document.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({ method: EXTMeshoptCompression.EncoderMethod.QUANTIZE });

await io.write(output, document);

let triangles = 0;
for (const mesh of root.listMeshes()) {
  for (const primitive of mesh.listPrimitives()) {
    const indices = primitive.getIndices();
    triangles += (indices ? indices.getCount() : primitive.getAttribute("POSITION").getCount()) / 3;
  }
}
const mb = (path) => (statSync(path).size / 1048576).toFixed(2);
console.log(`${input} ${mb(input)} MB  ->  ${output} ${mb(output)} MB`);
console.log(`${root.listMeshes().length} parts, ${root.listMaterials().length} materials, ${Math.round(triangles).toLocaleString()} triangles, ${root.listSkins()[0]?.listJoints().length ?? 0} bones`);
console.log(`parts: ${root.listMeshes().map((m) => `${m.getName()} [${m.listPrimitives().map((p) => p.listSemantics().join(" ")).join(" | ")}]`).join(", ")}`);
console.log(`pictures: ${root.listTextures().map((t) => `${t.getName()} ${t.getMimeType()} ${Math.round((t.getImage()?.byteLength ?? 0) / 1024)} KB`).join(", ")}`);
console.log(`movement: ${root.listAnimations().map((a) => `${a.getName()} (${a.listChannels().length})`).join(", ")}; ${dropped} unused channels dropped`);
