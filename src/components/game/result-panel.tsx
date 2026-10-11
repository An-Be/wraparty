"use client";

import { Button } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { linksOf, type ChainNode, type PuzzleProps } from "@/lib/chain";
import { copyToClipboard } from "@/lib/clipboard";
import { shareText, tierCopy, tierFor } from "@/lib/scoring";
import { toast } from "@/lib/toast";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";
import { Countdown } from "./countdown";
import type { DailyAggregates } from "@/lib/solve-types";

/** The share grid as squares: ink up to par, outlined past it, dashed for room left. */
function Squares({ links, par }: { links: number; par: number }) {
  const total = Math.max(links, par + 2);
  return (
    <div className="flex flex-wrap gap-1.5" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "size-6 border",
            i < links && i < par && "border-ink bg-ink",
            i < links && i >= par && "border-ink bg-wash",
            i >= links && "border-dashed border-faint",
          )}
        />
      ))}
    </div>
  );
}

function aggregateLine(a: DailyAggregates | null): string {
  if (!a || a.solved === 0) return "Be the first to finish today's pair.";
  const people = a.solved === 1 ? "1 player has" : `${a.solved.toLocaleString("en-US")} players have`;
  return `${people} finished today${a.averageLinks === null ? "." : `, averaging ${a.averageLinks} links.`}`;
}

export function ResultPanel({
  puzzle,
  chain,
  aggregates,
}: {
  puzzle: PuzzleProps;
  chain: readonly ChainNode[];
  aggregates: DailyAggregates | null;
}) {
  const links = linksOf(chain);
  const tier = tierFor(links, puzzle.par);
  const copy = tierCopy[tier];

  async function share() {
    const text = shareText({
      date: puzzle.date,
      personAName: puzzle.personA.name,
      personBName: puzzle.personB.name,
      par: puzzle.par,
      chain,
      url: window.location.origin,
    });
    const ok = await copyToClipboard(text);
    track("result_shared", { copied: ok, tier });
    if (ok) toast("Copied. Paste it anywhere.");
    else toast.error("Couldn't copy. Try again.");
  }

  return (
    <section className="flex flex-col gap-5">
      <SectionLabel n="02" aside={`${links} ${links === 1 ? "link" : "links"} · par ${puzzle.par}`}>
        That&apos;s a wrap
      </SectionLabel>
      <div className="flex flex-col gap-3">
        <h2 className="display text-6xl">{copy.label}</h2>
        <p className="text-sm text-mute">{copy.line}</p>
        <Squares links={links} par={puzzle.par} />
      </div>
      <Button size="lg" block onClick={share}>
        Share result
      </Button>
      <p className="text-sm text-mute">{aggregateLine(aggregates)}</p>
      <div className="flex items-baseline justify-between gap-4 border-t border-ink pt-4">
        <span className="label text-mute">Next pair in</span>
        <Countdown date={puzzle.date} />
      </div>
    </section>
  );
}
