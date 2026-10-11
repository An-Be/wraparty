import { Game } from "@/components/game/game";
import { HeaderStreak } from "@/components/game/header-streak";
import { PairHero } from "@/components/game/pair-hero";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { TmdbCredit } from "@/components/site/tmdb-credit";
import { Shell } from "@/components/ui/shell";
import type { PuzzleProps } from "@/lib/chain";
import { utcDateKey } from "@/lib/dates";
import { getAggregates, getPuzzleForDate } from "@/lib/server/puzzles";

export default async function Home() {
  const today = utcDateKey();
  const puzzle = await getPuzzleForDate(today);

  if (!puzzle) {
    return (
      <>
        <SiteHeader />
        <Shell>
          <main className="flex flex-1 flex-col justify-center gap-4 py-10">
            <p className="label text-mute">No pair today</p>
            <h1 className="display text-5xl">The crew is setting up.</h1>
            <p className="text-sm text-mute">Today&apos;s puzzle isn&apos;t ready yet. Check back soon.</p>
          </main>
          <SiteFooter />
        </Shell>
      </>
    );
  }

  // Pass only what the game needs across the server/client boundary.
  const props: PuzzleProps = {
    date: puzzle.date,
    number: puzzle.number,
    par: puzzle.par,
    personA: puzzle.personA,
    personB: puzzle.personB,
  };
  const aggregates = await getAggregates(today);

  return (
    <>
      <SiteHeader right={<HeaderStreak today={today} />} />
      <Shell>
        <main className="flex flex-1 flex-col gap-10 py-8">
          <h1 className="sr-only">
            WrapParty: connect {puzzle.personA.name} to {puzzle.personB.name}
          </h1>
          <PairHero puzzle={props} />
          <Game puzzle={props} initialAggregates={aggregates} />
        </main>
        <TmdbCredit />
        <SiteFooter />
      </Shell>
    </>
  );
}
