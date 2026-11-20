import Image from "next/image";
import Link from "next/link";
import { awards, makeAWish } from "../../data/portfolio";
import { starboardPortrait } from "../../data/photos";
import PlaceIcon from "../ui/PlaceIcon";
import Tabs from "../ui/Tabs";
import { ExternalLink, Quote, Stats } from "./parts";

// Awards: the trophy room. Awards come from `awards`, the story from
// `makeAWish` (app/data/portfolio.ts).
//
// Two tabs: the awards themselves, and the Make-A-Wish story.
export default function AwardsContent() {
  const cabinet = (
    <ul role="list" className="grid gap-2.5">
      {awards.map((award) => (
        <li key={award.id} className="card flex items-start gap-3.5">
          <PlaceIcon id="awards" className="mt-0.5 h-6 w-6 flex-none text-gold" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <h3 className="font-display text-[1.375rem] font-bold uppercase leading-tight tracking-wide">{award.title}</h3>
              {award.amount && <span className="font-display text-xl font-bold text-gold">{award.amount}</span>}
            </div>
            {(award.from || award.year) && <p className="text-[0.9375rem] text-ink-soft">{[award.from, award.year].filter(Boolean).join(", ")}</p>}
            <p className="meta mt-0.5">{award.note}</p>
          </div>
        </li>
      ))}
    </ul>
  );

  const story = (
    <div className="grid gap-5">
      <div className="prose">
        {makeAWish.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>

      <Quote text={makeAWish.quote.text} source={makeAWish.quote.source} />

      <Stats items={makeAWish.stats} />

      <div className="card flex items-center gap-4">
        <Image src={starboardPortrait.src} alt={starboardPortrait.alt} width={starboardPortrait.width} height={starboardPortrait.height} placeholder="blur" blurDataURL={starboardPortrait.blur} className="h-16 w-16 flex-none rounded-lg object-cover" />
        <div className="min-w-0 text-[0.9375rem] leading-normal">
          <p className="font-medium">{makeAWish.board.name}</p>
          <p className="text-ink-soft">
            {makeAWish.board.note} <ExternalLink href={makeAWish.starboardUrl}>{makeAWish.board.link}</ExternalLink>
          </p>
          <p className="meta mt-0.5 !text-xs">Photo: {starboardPortrait.credit}</p>
        </div>
      </div>

      <div>
        <Link href="/news" className="btn">
          {makeAWish.photosButton}
        </Link>
      </div>
    </div>
  );

  return (
    <div className="sec">
      <Tabs
        label="Awards"
        tabs={[
          { id: "awards", title: makeAWish.awardsTab, content: cabinet },
          { id: "story", title: makeAWish.storyTab, content: story },
        ]}
      />
    </div>
  );
}
