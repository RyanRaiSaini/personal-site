import Image from "next/image";
import Link from "next/link";
import { about, interests, profile } from "../../data/portfolio";
import { headshot } from "../../data/photos";
import { Chips, SubHeading } from "./parts";

// About: the centre circle. The words come from `about` and
// `interests` in app/data/portfolio.ts.
export default function AboutContent() {
  return (
    <div className="space-y-7">
      <div className="flex items-center gap-4">
        <Image src={headshot.src} alt={headshot.alt} width={headshot.width} height={headshot.height} placeholder="blur" blurDataURL={headshot.blur} className="h-20 w-20 flex-none rounded-full border border-line-strong object-cover" />
        <div>
          <p className="font-display text-3xl font-bold uppercase leading-none tracking-wide">{about.greeting}</p>
          <p className="mt-1.5 text-sm text-ink-soft">{profile.seeking}</p>
        </div>
      </div>

      <div className="space-y-3.5 leading-relaxed text-ink-soft [&>p:first-child]:text-ink">
        {about.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>

      <section aria-labelledby="about-facts" className="space-y-3">
        <SubHeading id="about-facts">Team sheet</SubHeading>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {about.facts.map((fact) => (
            <div key={fact.label} className="flex items-baseline justify-between gap-3 border-b border-line pb-2">
              <dt className="text-xs uppercase tracking-[0.14em] text-ink-faint">{fact.label}</dt>
              <dd className="text-right text-sm font-medium">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="about-courses" className="space-y-3">
        <SubHeading id="about-courses">This term</SubHeading>
        <Chips items={about.coursework} label="Courses" />
      </section>

      <section aria-labelledby="about-interests" className="space-y-3">
        <SubHeading id="about-interests">Away from the keyboard</SubHeading>
        <ul role="list" className="space-y-3">
          {interests.map((interest) => (
            <li key={interest.name}>
              <p className="font-display text-lg font-semibold uppercase tracking-wide text-gold">{interest.name}</p>
              <p className="text-sm leading-relaxed text-ink-soft">{interest.description}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3 pt-1">
        <Link href="/projects" className="btn btn-primary">
          See the goals
        </Link>
        <Link href="/resume" className="btn">
          Résumé
        </Link>
      </div>
    </div>
  );
}
