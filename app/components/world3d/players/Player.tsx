"use client";

import { useGLTF } from "@react-three/drei";
import { Component, forwardRef, Suspense, use, useEffect, useImperativeHandle, useMemo, useRef, type ReactNode } from "react";
import { AnimationClip, AnimationMixer, Color, DoubleSide, LoopRepeat, MeshBasicMaterial, MeshStandardMaterial, SRGBColorSpace, type AnimationAction, type Group, type Material, type Object3D, type SkinnedMesh, type Texture } from "three";
import { clone as cloneFigure } from "three/examples/jsm/utils/SkeletonUtils.js";
import { canvasTexture } from "../textures/canvas";
import { useDisplayFont } from "../textures/text";
import type { Kit } from "./kits";
import type { Layer, Stance } from "./moves";
import { loadPlayerNotes, MODEL_URL, type PlayerNotes } from "./notes";

// ------------------------------------------------------------------
// A footballer.
//
// The body, kit and movements are one model (public/players/player.glb),
// built in Blender from a Mixamo base (blender/build_players.py; where
// it comes from is in docs/redesign/ASSETS.md). Each player on the pitch
// is a copy of that model with his own skin tone, hair, beard, height
// and shirt print. Who is who is in kits.ts.
//
// He faces +Z. The kit is plain white with a gold collar, cuffs and
// sock bands; the back carries a name and number, and there is no crest.
//
// What he does is decided elsewhere (Cast.tsx on the pitch,
// RoomSaini.tsx indoors) and passed to `play` every frame as a short
// list of movements to mix (moves.ts).
// ------------------------------------------------------------------

export type PlayerHandle = {
  group: Group;
  play: (layers: Layer[]) => void;
};

const WHITE = "#f6f6f4";
// the print: navy on the white kit, white on any other
const INK = "#10224a";
const PALE = "#f4f4f1";

// The print on the back, in metres up the player's back
const PRINT = {
  numberAt: 1.215,
  numberHeight: 0.215,
  nameAt: 1.392,
  nameHeight: 0.05,
  nameWidth: 0.285,
};

// ---- what every player shares ----

type Shared = {
  clips: Map<string, AnimationClip>;
  fixes: Record<string, Set<string>>;
  maps: { skin: Texture | null; shirt: Texture | null; folds: Texture | null; boots: Texture | null; hair: Texture | null; curls: Texture | null };
};

const shared = new WeakMap<object, Shared>();

function boneOf(track: string) {
  return track.slice(0, track.lastIndexOf("."));
}

function share(model: { animations: AnimationClip[]; materials: Record<string, Material> }, notes: PlayerNotes): Shared {
  const before = shared.get(model);
  if (before) return before;
  const fixes: Record<string, Set<string>> = {};
  // the model's bones are named "mixamorig:Hips"; three.js drops the colon
  for (const [stance, bones] of Object.entries(notes.stances)) fixes[stance] = new Set(bones.map((bone) => bone.replace(/[:.\[\]\/]/g, "")));
  const clips = new Map<string, AnimationClip>();
  for (const clip of model.animations) {
    const fixed = fixes[clip.name];
    // a pose keeps only the bones it is there to fix
    clips.set(clip.name, fixed ? new AnimationClip(clip.name, clip.duration, clip.tracks.filter((track) => fixed.has(boneOf(track.name)) && track.name.endsWith(".quaternion"))) : clip);
  }
  const material = (name: string) => model.materials[name] as MeshStandardMaterial | undefined;
  const made: Shared = {
    clips,
    fixes,
    maps: {
      skin: material("Skin")?.map ?? null,
      shirt: material("Shirt")?.map ?? null,
      folds: material("Shirt")?.normalMap ?? null,
      boots: material("Boots")?.map ?? null,
      hair: material("Hair")?.map ?? null,
      curls: material("Curls")?.normalMap ?? null,
    },
  };
  shared.set(model, made);
  return made;
}

// A clip with the bones of some poses left out, made once and kept
function clipFor(library: Shared, name: string, without: Stance[] | undefined): AnimationClip | null {
  const key = without && without.length ? `${name}|${[...without].sort().join("+")}` : name;
  const ready = library.clips.get(key);
  if (ready) return ready;
  const base = library.clips.get(name);
  if (!base || !without) return base ?? null;
  const drop = new Set<string>();
  for (const stance of without) for (const bone of library.fixes[`stance-${stance}`] ?? []) drop.add(bone);
  const clip = new AnimationClip(key, base.duration, base.tracks.filter((track) => !drop.has(boneOf(track.name))));
  library.clips.set(key, clip);
  return clip;
}

// ---- pictures ----

// The shirt with its print: the model's own shirt picture, tinted if
// the kit is not white, with the name and number drawn on the back
function printedShirt(base: Texture, notes: PlayerNotes, kit: Kit, family: string | null) {
  const size = 1024;
  const texture = canvasTexture(
    size,
    size,
    (ctx) => {
      ctx.drawImage(base.image as CanvasImageSource, 0, 0, size, size);
      if (kit.colour) {
        ctx.globalCompositeOperation = "multiply";
        ctx.fillStyle = kit.colour;
        ctx.fillRect(0, 0, size, size);
        ctx.globalCompositeOperation = "source-over";
      }
      if (!family || kit.number === null) return;
      // from a place on his back (x across, z up, in metres) to a place on the picture
      const { u, v } = notes.print;
      const across = (x: number, z: number) => (u[0] + u[1] * x + u[2] * z) * size;
      const down = (x: number, z: number) => (1 - (v[0] + v[1] * x + v[2] * z)) * size;
      const perMetre = Math.abs(v[2]) * size;
      ctx.fillStyle = kit.colour ? PALE : INK;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      // the heading font's capitals are about 0.7 of its size
      ctx.font = `800 ${Math.round((PRINT.numberHeight * perMetre) / 0.7)}px ${family}`;
      ctx.fillText(String(kit.number), across(0, PRINT.numberAt), down(0, PRINT.numberAt));
      if (kit.name) {
        let fontSize = (PRINT.nameHeight * perMetre) / 0.7;
        ctx.font = `700 ${fontSize}px ${family}`;
        const widest = PRINT.nameWidth * Math.abs(u[1]) * size;
        const wide = ctx.measureText(kit.name).width;
        if (wide > widest) {
          fontSize *= widest / wide;
          ctx.font = `700 ${fontSize}px ${family}`;
        }
        ctx.fillText(kit.name, across(0, PRINT.nameAt), down(0, PRINT.nameAt));
      }
    },
    { repeat: false, anisotropy: 8 },
  );
  // a model counts a picture's rows from the top
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}

// Four soft shadows in a star, the way floodlights throw them
function shadowTexture() {
  return canvasTexture(
    128,
    128,
    (ctx, w, h) => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.translate(w / 2, h / 2);
        ctx.rotate((i * Math.PI) / 2 + Math.PI / 4);
        const g = ctx.createRadialGradient(22, 0, 2, 22, 0, 34);
        g.addColorStop(0, "rgba(0,0,0,0.5)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.scale(1, 0.42);
        ctx.beginPath();
        ctx.arc(22, 0, 34, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    },
    { repeat: false },
  );
}

// The model's skin is pale. Multiplying it by this turns its plain skin
// into the player's own tone.
function skinTint(kit: Kit, notes: PlayerNotes) {
  const wanted = new Color(kit.skin);
  const plain = new Color().setRGB(notes.skin[0], notes.skin[1], notes.skin[2], SRGBColorSpace);
  return new Color().setRGB(Math.min(1.2, wanted.r / plain.r), Math.min(1.2, wanted.g / plain.g), Math.min(1.2, wanted.b / plain.b));
}

// ---- one player ----

type Playing = { action: AnimationAction; loop: boolean; length: number; used: boolean };

const Figure = forwardRef<PlayerHandle, { kit: Kit; shadow: boolean }>(function Figure({ kit, shadow }, ref) {
  const model = useGLTF(MODEL_URL, false, true);
  const notes = use(loadPlayerNotes());
  const family = useDisplayFont();
  const root = useRef<Group>(null);
  const library = useMemo(() => share(model as unknown as { animations: AnimationClip[]; materials: Record<string, Material> }, notes), [model, notes]);

  const figure = useMemo(() => cloneFigure(model.scene) as Object3D, [model]);
  const mixer = useMemo(() => new AnimationMixer(figure), [figure]);
  const playing = useRef(new Map<string, Playing>());

  const shirt = useMemo(() => (library.maps.shirt ? printedShirt(library.maps.shirt, notes, kit, family) : null), [library, notes, kit, family]);
  useEffect(() => () => shirt?.dispose(), [shirt]);

  const blob = useMemo(() => new MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.85 }), []);
  useEffect(
    () => () => {
      blob.map?.dispose();
      blob.dispose();
    },
    [blob],
  );

  // his own materials, hair and beard
  useEffect(() => {
    const cloth = kit.colour ?? WHITE;
    const maps = library.maps;
    const materials: Record<string, MeshStandardMaterial> = {
      Body: new MeshStandardMaterial({ map: maps.skin, color: skinTint(kit, notes), roughness: 0.62 }),
      Eyes: new MeshStandardMaterial({ map: maps.skin, roughness: 0.3 }),
      Shirt: new MeshStandardMaterial({ map: shirt ?? maps.shirt, normalMap: maps.folds, roughness: 0.8 }),
      Shorts: new MeshStandardMaterial({ color: cloth, roughness: 0.82, side: DoubleSide }),
      Socks: new MeshStandardMaterial({ color: kit.colour ?? "#ffffff", vertexColors: true, roughness: 0.86, side: DoubleSide }),
      Boots: new MeshStandardMaterial({ map: maps.boots, roughness: 0.42 }),
      HairMedium: new MeshStandardMaterial({ map: maps.hair, color: kit.hair, alphaTest: 0.42, side: DoubleSide, roughness: 0.55 }),
      HairCurls: new MeshStandardMaterial({ color: kit.hair, normalMap: maps.curls, roughness: 0.86 }),
      Beard: new MeshStandardMaterial({ color: kit.hair, vertexColors: true, transparent: true, depthWrite: false, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }),
    };
    const wears = new Set<string>(["Body", "Eyes", "Shirt", "Shorts", "Socks", "Boots"]);
    if (kit.hairStyle === "medium") wears.add("HairMedium");
    if (kit.hairStyle === "curls") wears.add("HairCurls");
    if (kit.beard) wears.add(`Beard${kit.beard[0].toUpperCase()}${kit.beard.slice(1)}`);

    figure.traverse((node) => {
      const mesh = node as SkinnedMesh;
      if (!mesh.isSkinnedMesh) return;
      mesh.visible = wears.has(mesh.name);
      mesh.material = materials[mesh.name] ?? materials.Beard;
      mesh.castShadow = !mesh.name.startsWith("Beard");
      // a moving player's outline is not where the model was measured
      mesh.frustumCulled = false;
    });
    return () => {
      for (const material of Object.values(materials)) material.dispose();
    };
  }, [figure, kit, library, notes, shirt]);

  useEffect(() => {
    const live = playing.current;
    return () => {
      mixer.stopAllAction();
      live.clear();
    };
  }, [mixer]);

  useImperativeHandle(
    ref,
    () => ({
      get group() {
        return root.current as Group;
      },
      play(layers: Layer[]) {
        const live = playing.current;
        for (const entry of live.values()) entry.used = false;
        for (const layer of layers) {
          if (layer.weight <= 0.0005) continue;
          const clip = clipFor(library, layer.clip, layer.without);
          if (!clip) continue;
          let entry = live.get(clip.name);
          if (!entry) {
            const action = mixer.clipAction(clip);
            action.setLoop(LoopRepeat, Infinity);
            action.play();
            entry = { action, loop: Boolean(notes.clips[layer.clip]?.loop), length: clip.duration, used: false };
            live.set(clip.name, entry);
          }
          const { action, length } = entry;
          action.enabled = true;
          // every clip is placed by hand each frame; nothing runs on by itself
          action.time = entry.loop ? ((layer.time % length) + length) % length : Math.min(Math.max(layer.time, 0), Math.max(0, length - 0.002));
          action.weight = entry.used ? action.weight + layer.weight : layer.weight;
          entry.used = true;
        }
        for (const entry of live.values()) {
          if (entry.used) continue;
          entry.action.weight = 0;
          entry.action.enabled = false;
        }
        mixer.update(0);
      },
    }),
    [library, mixer, notes],
  );

  const size = (kit.height ?? notes.height) / notes.height;

  return (
    <group ref={root}>
      {shadow && (
        <mesh material={blob} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} renderOrder={2}>
          <planeGeometry args={[2.6, 2.6]} />
        </mesh>
      )}
      <primitive object={figure} scale={size} />
    </group>
  );
});

// If the model cannot be had (a failed download), the pitch simply has
// no players on it; the rest of the stadium carries on
class Quiet extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

const Player = forwardRef<PlayerHandle, { kit: Kit; shadow?: boolean }>(function Player({ kit, shadow = true }, ref) {
  return (
    <Quiet>
      <Suspense fallback={null}>
        <Figure ref={ref} kit={kit} shadow={shadow} />
      </Suspense>
    </Quiet>
  );
});

export default Player;

useGLTF.preload(MODEL_URL, false, true);
