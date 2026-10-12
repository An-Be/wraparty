import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Game } from "@/components/game/game";
import { HeaderStreak } from "@/components/game/header-streak";
import { PairHero } from "@/components/game/pair-hero";
import { ModeCredit } from "@/components/site/mode-credit";
import { SettingUp } from "@/components/site/setting-up";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { Shell } from "@/components/ui/shell";
import { site } from "@/config/site";
import type { PuzzleProps } from "@/lib/chain";
import { utcDateKey } from "@/lib/dates";
import { gameIsOpen } from "@/lib/server/launch";
import { getLiveMode } from "@/lib/server/modes";
import { getAggregates, getPuzzleForDate } from "@/lib/server/puzzles";
import { isWellFormedSlug, modeCopy } from "@/modes";

export async function generateMetadata({ params }: PageProps<"/[mode]">): Promise<Metadata> {
  const { mode } = await params;
  const copy = isWellFormedSlug(mode) ? modeCopy(mode) : null;
  return copy ? { title: `${site.name} ${copy.name}` } : {};
}

// Today's puzzle in one live mode. Anything else is a 404.
export default async function ModePage({ params }: PageProps<"/[mode]">) {
  if (!gameIsOpen()) return <SettingUp />;

  const { mode: slug } = await params;
  if (!isWellFormedSlug(slug)) notFound();

  // Only live modes have a page; planned ones aren't named anywhere yet.
  const mode = await getLiveMode(slug);
  const copy = modeCopy(slug);
  if (!mode || !copy) notFound();

  const today = utcDateKey();
  const puzzle = await getPuzzleForDate(mode.id, today);
  if (!puzzle) return <SettingUp />;

  // Pass only what the game needs across the server/client boundary.
  const props: PuzzleProps = {
    mode: mode.slug,
    date: puzzle.date,
    number: puzzle.number,
    par: puzzle.par,
    entityA: puzzle.entityA,
    entityB: puzzle.entityB,
  };
  const aggregates = await getAggregates(mode.id, today);

  return (
    <>
      <SiteHeader right={<HeaderStreak mode={mode.slug} today={today} />} />
      <Shell>
        <main className="flex flex-1 flex-col gap-10 py-8">
          <h1 className="sr-only">
            {site.name} {copy.name}: connect {puzzle.entityA.name} to {puzzle.entityB.name}
          </h1>
          <PairHero puzzle={props} copy={copy} />
          <Game puzzle={props} initialAggregates={aggregates} />
        </main>
        <ModeCredit slug={mode.slug} />
        <SiteFooter />
      </Shell>
    </>
  );
}
