import Image from "next/image";
import Link from "next/link";
import { about, interests, profile } from "../../data/portfolio";
import { headshot } from "../../data/photos";
import { Block, Chips } from "./parts";

// About: the centre circle. The words come from `about` and
// `interests` in app/data/portfolio.ts.
export default function AboutContent() {
  return (
    <div className="sec">
      <div className="part">
        <div className="flex items-center gap-4">
          <Image src={headshot.src} alt={headshot.alt} width={headshot.width} height={headshot.height} placeholder="blur" blurDataURL={headshot.blur} className="h-[4.5rem] w-[4.5rem] flex-none rounded-full border border-line-strong object-cover" />
          <p className="text-[1.0625rem] font-medium leading-snug">{profile.seeking}</p>
        </div>
        <div className="prose">
          {about.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </div>

      <Block title={about.factsTitle} id="about-facts">
        <dl className="facts">
          {about.facts.map((fact) => (
            <div key={fact.label}>
              <dt className="label">{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
          <div className="facts-wide">
            <dt className="label">{about.courseworkTitle}</dt>
            <dd>
              <Chips items={about.coursework} label={about.courseworkTitle} />
            </dd>
          </div>
        </dl>
      </Block>

      <Block title={about.interestsTitle} id="about-interests">
        {/* two by two, so four interests take two rows instead of four */}
        <ul role="list" className="grid gap-2.5 sm:grid-cols-2">
          {interests.map((interest) => (
            <li key={interest.name} className="card">
              <p className="font-display text-xl font-semibold leading-tight tracking-wide text-gold">{interest.name}</p>
              <p className="mt-1 text-[0.9375rem] leading-normal text-ink-soft">{interest.description}</p>
            </li>
          ))}
        </ul>
      </Block>

      <div className="flex flex-wrap gap-2.5">
        <Link href="/projects" className="btn btn-primary">
          {about.projectsButton}
        </Link>
        <Link href="/resume" className="btn">
          {about.resumeButton}
        </Link>
      </div>
    </div>
  );
}
