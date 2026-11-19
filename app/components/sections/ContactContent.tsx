"use client";

import { useState } from "react";
import { profile } from "../../data/portfolio";
import { Arrow, ExternalLink } from "./parts";

// Contact: the mixed zone. Email and LinkedIn, and no form.
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
    <div className="space-y-6">
      <p className="leading-relaxed text-ink-soft">
        <span className="text-ink">The fastest way to reach me is email.</span> {profile.seeking} If you have a role, a project or a question, I would like to hear about it.
      </p>

      <div className="grid gap-3">
        <a href={`mailto:${profile.email}`} className="group flex items-center justify-between gap-4 rounded-2xl border border-gold bg-gold px-5 py-4 text-gold-ink transition-transform hover:-translate-y-0.5">
          <span>
            <span className="block font-display text-2xl font-bold uppercase leading-none tracking-wide">Email me</span>
            <span className="mt-1 block break-all text-sm opacity-80">{profile.email}</span>
          </span>
          <Arrow />
        </a>
        <ExternalLink href={profile.linkedinUrl} className="group flex items-center justify-between gap-4 rounded-2xl border border-line-strong bg-bg-raised/40 px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-gold">
          <span>
            <span className="block font-display text-2xl font-bold uppercase leading-none tracking-wide">LinkedIn</span>
            <span className="mt-1 block text-sm text-ink-soft">{profile.linkedinHandle}</span>
          </span>
          <Arrow />
        </ExternalLink>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button type="button" onClick={copy} className="btn !min-h-10 !px-4 !text-sm">
          {copied ? "Copied" : "Copy email address"}
        </button>
        <span aria-live="polite" className="sr-only">
          {copied ? "Email address copied" : ""}
        </span>
        <ExternalLink href={profile.githubUrl}>github.com/{profile.githubUser}</ExternalLink>
      </div>

      <p className="text-sm text-ink-faint">Based in {profile.location}.</p>
    </div>
  );
}
