"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { makeAWish, news, pressRoom } from "../../data/portfolio";
import { album } from "../../data/photos";
import { useWorld } from "../../lib/store";
import { Arrow, ExternalLink, SubHeading } from "./parts";

// In the News: the press room. The links come from `news` and the
// photos from `album` (app/data/portfolio.ts and app/data/photos.ts).
// Clicking a photo opens it large; the basketball in the 3D press
// room opens the album too.

const KIND_LABEL = { video: "Video", article: "Article", profile: "Profile", social: "Post" } as const;

function KindIcon({ kind }: { kind: keyof typeof KIND_LABEL }) {
  const common = { viewBox: "0 0 24 24", width: 22, height: 22, fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (kind === "video")
    return (
      <svg {...common}>
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="m10 9 5 3-5 3V9Z" fill="currentColor" />
      </svg>
    );
  if (kind === "article")
    return (
      <svg {...common}>
        <path d="M5 4h11l3 3v13H5V4Z" />
        <path d="M8.5 9h7M8.5 12.5h7M8.5 16h4.5" />
      </svg>
    );
  if (kind === "profile")
    return (
      <svg {...common}>
        <path d="m12 3 2.6 5.6 6 .7-4.5 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6L3.4 9.3l6-.7L12 3Z" />
      </svg>
    );
  return (
    <svg {...common}>
      <rect x="4" y="4" width="16" height="16" rx="4.5" />
      <circle cx="12" cy="12" r="3.6" />
      <circle cx="16.7" cy="7.3" r="0.8" fill="currentColor" />
    </svg>
  );
}

export default function NewsContent() {
  const [viewing, setViewing] = useState<number | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setViewing(null);
    opener.current?.focus();
  }, []);

  const step = useCallback((by: number) => setViewing((i) => (i === null ? i : (i + by + album.length) % album.length)), []);

  // The basketball in the press room asks for the album
  useEffect(() => {
    return useWorld.subscribe((state, previous) => {
      if (state.selection.story && !previous.selection.story) {
        setViewing(0);
        state.select("story", null);
      }
    });
  }, []);

  useEffect(() => {
    if (viewing === null) return;
    dialog.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [viewing, close, step]);

  const photo = viewing === null ? null : album[viewing];

  return (
    <div className="space-y-8">
      <p className="leading-relaxed text-ink-soft">{pressRoom.intro}</p>

      <section aria-labelledby="news-links" className="space-y-3">
        <SubHeading id="news-links">Clippings</SubHeading>
        <ul role="list" className="space-y-2.5">
          {news.map((item) => (
            <li key={item.id}>
              <ExternalLink href={item.href} className="group flex gap-3.5 rounded-2xl border border-line bg-bg-raised/40 px-4 py-3.5 transition-colors hover:border-gold">
                <span className="mt-0.5 flex-none text-gold">
                  <KindIcon kind={item.kind} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs uppercase tracking-[0.14em] text-ink-faint">
                    {item.outlet} · {KIND_LABEL[item.kind]} · {item.date}
                  </span>
                  <span className="mt-0.5 block font-display text-2xl font-bold uppercase leading-tight tracking-wide">{item.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{item.summary}</span>
                  <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-royal group-hover:text-gold">
                    {item.cta} <Arrow />
                  </span>
                </span>
              </ExternalLink>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="news-album" className="space-y-3">
        <SubHeading id="news-album">{pressRoom.albumTitle}</SubHeading>
        <p className="text-sm text-ink-soft">{pressRoom.albumNote}</p>
        <ul role="list" className="grid grid-cols-3 gap-1.5 sm:gap-2">
          {album.map((item, i) => (
            <li key={item.slug} className={i === 0 ? "col-span-3" : ""}>
              <button
                type="button"
                onClick={(e) => {
                  opener.current = e.currentTarget;
                  setViewing(i);
                }}
                className="group relative block w-full overflow-hidden rounded-xl border border-line"
                aria-label={`Open photo: ${item.alt}`}
              >
                <Image
                  src={i === 0 ? item.src : item.thumb}
                  alt=""
                  width={item.width}
                  height={item.height}
                  sizes={i === 0 ? "(min-width: 1024px) 32rem, 100vw" : "(min-width: 1024px) 11rem, 33vw"}
                  placeholder="blur"
                  blurDataURL={item.blur}
                  className={`w-full object-cover transition-transform duration-500 group-hover:scale-[1.04] ${i === 0 ? "aspect-[3/2]" : "aspect-square"}`}
                />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2.5 pb-1.5 pt-6 text-left font-display text-sm font-semibold uppercase tracking-wide text-white">{item.caption}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      <figure className="rounded-2xl border border-gold/50 bg-bg-raised/40 px-5 py-4">
        <blockquote className="font-display text-2xl font-bold uppercase leading-tight tracking-wide">“{makeAWish.quote.text}”</blockquote>
        <figcaption className="mt-2 text-sm text-ink-faint">{makeAWish.quote.source}</figcaption>
      </figure>

      {/* The large photo is attached to the page itself, not to the
          panel, so it can fill the whole screen */}
      {photo &&
        viewing !== null &&
        createPortal(
        <div ref={dialog} role="dialog" aria-modal="true" aria-label={`Photo ${viewing + 1} of ${album.length}: ${photo.alt}`} tabIndex={-1} data-overlay-open className="fixed inset-0 z-[60] flex flex-col bg-black/92 outline-none backdrop-blur-sm" onClick={close}>
          <div className="flex items-center justify-between gap-4 px-4 py-3 text-white sm:px-6">
            <p className="font-display text-lg font-semibold uppercase tracking-wide">
              {photo.caption}
              <span className="ml-3 font-mono text-xs text-white/50">
                {viewing + 1} / {album.length}
              </span>
            </p>
            <button type="button" onClick={close} className="grid h-11 w-11 place-items-center rounded-full border border-white/25 text-white hover:border-[#f2cf6b] hover:text-[#f2cf6b]" aria-label="Close photo">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-3 pb-4 sm:px-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} className="max-h-full max-w-full rounded-lg object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                step(-1);
              }}
              className="absolute left-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/50 text-xl text-white hover:border-[#f2cf6b] sm:left-4"
              aria-label="Previous photo"
            >
              ←
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                step(1);
              }}
              className="absolute right-2 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/50 text-xl text-white hover:border-[#f2cf6b] sm:right-4"
              aria-label="Next photo"
            >
              →
            </button>
          </div>
        </div>,
          document.body,
        )}
    </div>
  );
}
