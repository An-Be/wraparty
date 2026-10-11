import { Game } from "@/components/game/game";
import { HeaderStreak } from "@/components/game/header-streak";
import { PairHero } from "@/components/game/pair-hero";
import { SiteFooter } from "@/components/site/site-footer";
import { SettingUp } from "@/components/site/setting-up";
import { SiteHeader } from "@/components/site/site-header";
import { TmdbCredit } from "@/components/site/tmdb-credit";
import { Shell } from "@/components/ui/shell";
import type { PuzzleProps } from "@/lib/chain";
import { utcDateKey } from "@/lib/dates";
import { gameIsOpen } from "@/lib/server/launch";
import { getAggregates, getPuzzleForDate } from "@/lib/server/puzzles";

export default async function Home() {
  // Before launch, production shows the setting-up screen without touching the database.
  if (!gameIsOpen()) return <SettingUp />;

  const today = utcDateKey();
  const puzzle = await getPuzzleForDate(today);

  if (!puzzle) return <SettingUp />;

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
            Wraparty: connect {puzzle.personA.name} to {puzzle.personB.name}
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
