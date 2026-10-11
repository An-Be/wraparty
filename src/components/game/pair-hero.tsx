import type { PuzzleProps } from "@/lib/chain";
import { displayDate } from "@/lib/dates";
import { Photo } from "./photo";

/** Today's pair, big: two headshots, the arrow between them, and par. */
export function PairHero({ puzzle }: { puzzle: PuzzleProps }) {
  const { personA, personB } = puzzle;
  return (
    <section className="flex flex-col gap-5">
      <div className="flex items-baseline justify-between gap-4">
        <p className="label text-mute">
          No. {String(puzzle.number).padStart(3, "0")} · {displayDate(puzzle.date)}
        </p>
        <p className="label">Par {puzzle.par}</p>
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-start gap-3">
        <figure className="flex flex-col gap-3">
          <Photo src={personA.img} alt={personA.name} className="aspect-[2/3] w-full text-4xl" />
          <figcaption className="display text-2xl break-words">{personA.name}</figcaption>
        </figure>
        <span aria-hidden="true" className="display mt-[30%] text-4xl">
          →
        </span>
        <figure className="flex flex-col gap-3">
          <Photo src={personB.img} alt={personB.name} className="aspect-[2/3] w-full text-4xl" />
          <figcaption className="display text-2xl break-words">{personB.name}</figcaption>
        </figure>
      </div>
      <p className="text-sm text-mute">
        Connect them through movies. Each link is a movie two people were both in, acting or directing.
      </p>
    </section>
  );
}
