"use client";

import { useState } from "react";
import { contactText, profile } from "../../data/portfolio";
import { Arrow, ExternalLink } from "./parts";

// Contact: the flash interview by the tunnel. Email and LinkedIn, and no form.
export default function ContactContent() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      // Clipboard blocked: the address is on the button anyway
    }
  };

  return (
    <div className="sec">
      <p className="text-ink-soft">
        <span className="text-ink">{profile.seeking}</span> {contactText.lead}
      </p>

      <div className="grid gap-3">
        <a href={`mailto:${profile.email}`} className="group flex items-center justify-between gap-4 rounded-[10px] border border-gold bg-gold px-5 py-4 text-gold-ink transition-transform hover:-translate-y-0.5">
          <span>
            <span className="block font-display text-2xl font-bold uppercase leading-none tracking-wide">{contactText.email}</span>
            <span className="mt-1 block break-all text-sm opacity-80">{profile.email}</span>
          </span>
          <Arrow />
        </a>
        <ExternalLink href={profile.linkedinUrl} className="group flex items-center justify-between gap-4 rounded-[10px] border border-line-strong bg-bg-raised/40 px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-gold">
          <span>
            <span className="block font-display text-2xl font-bold uppercase leading-none tracking-wide">{contactText.linkedin}</span>
            <span className="mt-1 block text-sm text-ink-soft">{profile.linkedinHandle}</span>
          </span>
          <Arrow />
        </ExternalLink>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-[0.9375rem]">
        <button type="button" onClick={copy} className="btn !min-h-10 !px-3.5 !text-base">
          {copied ? contactText.copied : contactText.copy}
        </button>
        <span aria-live="polite" className="sr-only">
          {copied ? "Email address copied" : ""}
        </span>
        <ExternalLink href={profile.githubUrl}>github.com/{profile.githubUser}</ExternalLink>
      </div>

      <p className="meta">{contactText.basedIn.replace("{location}", profile.location)}</p>
    </div>
  );
}
