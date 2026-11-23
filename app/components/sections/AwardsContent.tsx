import Image from "next/image";
import Link from "next/link";
import { awards, makeAWish } from "../../data/portfolio";
import { album, starboardPortrait } from "../../data/photos";
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

  // STARboard first, then the numbers and the photos, then the story in full
  const story = (
    <div className="grid gap-5">
      {/* the two organisations, on a white strip so their colours read */}
      <div className="flex items-center justify-center gap-8 rounded-lg bg-white px-6 py-4">
        {makeAWish.logos.map((logo) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={logo.src} src={logo.src} alt={logo.alt} width={logo.width} height={logo.height} className="h-14 w-auto" />
        ))}
      </div>
      <div className="card grid gap-4 text-center sm:grid-cols-[9rem_1fr] sm:items-center sm:text-left">
        <Image src={starboardPortrait.src} alt={starboardPortrait.alt} width={starboardPortrait.width} height={starboardPortrait.height} placeholder="blur" blurDataURL={starboardPortrait.blur} className="mx-auto aspect-square w-36 rounded-lg object-cover" />
        <div className="min-w-0">
          <p className="font-display text-2xl font-bold uppercase leading-tight tracking-wide text-gold">{makeAWish.board.name}</p>
          <p className="mt-1 text-[0.9375rem] leading-normal text-ink-soft">{makeAWish.board.note}</p>
          <p className="mt-2">
            <ExternalLink href={makeAWish.starboardUrl} className="btn !min-h-9 !px-3 !text-sm">
              {makeAWish.board.link}
            </ExternalLink>
          </p>
          <p className="meta mt-1.5 !text-xs">Photo: {starboardPortrait.credit}</p>
        </div>
      </div>

      <Stats items={makeAWish.stats} />

      {/* three photos from All-Star weekend; the rest are in the press room */}
      <ul role="list" className="grid grid-cols-3 gap-2">
        {album.slice(0, 3).map((photo) => (
          <li key={photo.src}>
            <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} placeholder="blur" blurDataURL={photo.blur} sizes="11rem" className="aspect-[4/5] w-full rounded-md object-cover" />
          </li>
        ))}
      </ul>

      <Quote text={makeAWish.quote.text} source={makeAWish.quote.source} />

      <div className="prose">
        {makeAWish.paragraphs.map((paragraph) => (
          <p key={paragraph.slice(0, 24)}>{paragraph}</p>
        ))}
      </div>

      <div className="text-center">
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
