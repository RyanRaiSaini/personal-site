import Image from "next/image";
import Link from "next/link";
import { awards, makeAWish } from "../../data/portfolio";
import { starboardPortrait } from "../../data/photos";
import PlaceIcon from "../ui/PlaceIcon";
import { Chips, ExternalLink, Stats, SubHeading } from "./parts";

// Awards: the trophy room. Awards come from `awards`, the story from
// `makeAWish` (app/data/portfolio.ts).
export default function AwardsContent() {
  return (
    <div className="space-y-8">
      <section aria-labelledby="awards-list" className="space-y-3">
        <SubHeading id="awards-list">In the cabinet</SubHeading>
        <ul role="list" className="space-y-2.5">
          {awards.map((award) => (
            <li key={award.id} className="flex items-start gap-3.5 rounded-2xl border border-line bg-bg-raised/40 px-4 py-3.5">
              <PlaceIcon id="awards" className="mt-0.5 h-7 w-7 flex-none text-gold" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                  <h3 className="font-display text-2xl font-bold uppercase leading-tight tracking-wide">{award.title}</h3>
                  {award.amount && <span className="font-display text-xl font-bold text-gold">{award.amount}</span>}
                </div>
                {(award.from || award.year) && <p className="text-sm text-ink-soft">{[award.from, award.year].filter(Boolean).join(" · ")}</p>}
                <p className="mt-1 text-sm text-ink-faint">{award.note}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="awards-wish" className="space-y-4">
        <SubHeading id="awards-wish">{makeAWish.heading}</SubHeading>
        <div className="space-y-3.5 leading-relaxed text-ink-soft">
          {makeAWish.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>

        <figure className="rounded-2xl border border-gold/50 bg-bg-raised/40 px-5 py-4">
          <blockquote className="font-display text-3xl font-bold uppercase leading-tight tracking-wide">“{makeAWish.quote.text}”</blockquote>
          <figcaption className="mt-2 text-sm text-ink-faint">{makeAWish.quote.source}</figcaption>
        </figure>

        <Stats items={makeAWish.stats} />

        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-[0.14em] text-ink-faint">Met and interviewed</h3>
          <Chips items={makeAWish.met} label="People I met at NBA All-Star 2026" />
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-line bg-bg-raised/40 p-3.5">
          <Image src={starboardPortrait.src} alt={starboardPortrait.alt} width={starboardPortrait.width} height={starboardPortrait.height} placeholder="blur" blurDataURL={starboardPortrait.blur} className="h-16 w-16 flex-none rounded-xl object-cover" />
          <div className="min-w-0 text-sm">
            <p className="font-medium">STARboard, Make-A-Wish Canada</p>
            <p className="text-ink-soft">
              Young people from across Canada whose wishes were granted, advising Make-A-Wish. <ExternalLink href={makeAWish.starboardUrl}>Meet the board</ExternalLink>
            </p>
            <p className="mt-0.5 text-xs text-ink-faint">Photo: {starboardPortrait.credit}</p>
          </div>
        </div>

        <Link href="/news" className="btn">
          Photos and press
        </Link>
      </section>
    </div>
  );
}
