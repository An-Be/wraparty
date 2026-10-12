"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { SectionLabel } from "@/components/ui/section-label";
import { api } from "@/lib/api-client";
import { isSolved, linksOf, type ChainNode, type PuzzleProps } from "@/lib/chain";
import { parseGame, type GameState } from "@/lib/game-state";
import { getDeviceId, readStats, readStorage, storageKeys, subscribeStorage, writeStorage } from "@/lib/local-store";
import { tierFor } from "@/lib/scoring";
import type { DailyAggregates, SolveResponse } from "@/lib/solve-types";
import { parseStats, recordSolve } from "@/lib/stats";
import { toast } from "@/lib/toast";
import { track } from "@/lib/track";
import { requireModeCopy } from "@/modes";
import { ChainList } from "./chain-list";
import { ResultPanel } from "./result-panel";
import { StatsRow } from "./stats-row";
import { StepPicker } from "./step-picker";

const serverSnapshot = () => null;

/**
 * Today's game in one mode. The chain lives in localStorage (keyed by mode and
 * UTC date) so a reload resumes it; reaching the target records local stats and
 * an anonymous solve report. Wording comes from the mode's copy.
 */
export function Game({ puzzle, initialAggregates }: { puzzle: PuzzleProps; initialAggregates: DailyAggregates | null }) {
  const copy = requireModeCopy(puzzle.mode);
  const key = storageKeys.game(puzzle.mode, puzzle.date);
  const start = useMemo<ChainNode>(() => ({ kind: "entity", meta: null, ...puzzle.entityA }), [puzzle.entityA]);
  const target = puzzle.entityB;
  const raw = useSyncExternalStore(subscribeStorage, () => readStorage(key), serverSnapshot);
  const game = useMemo(() => parseGame(raw, start), [raw, start]);
  const [aggregates, setAggregates] = useState(initialAggregates);

  const solved = isSolved(game.chain, target.id);
  const links = linksOf(game.chain);

  function save(next: GameState) {
    writeStorage(key, JSON.stringify(next));
  }

  async function report(chain: ChainNode[]) {
    const res = await api<SolveResponse>(`/api/puzzles/${puzzle.date}/solves?mode=${encodeURIComponent(puzzle.mode)}`, {
      method: "POST",
      body: { deviceId: getDeviceId(), path: chain.map((n) => ({ kind: n.kind, id: n.id })) },
    });
    if (!res.ok) {
      // The win still counts on this device; only today's shared tally misses it.
      toast.error("Couldn't add your solve to today's tally.");
      return;
    }
    setAggregates(res.data.aggregates);
    save({ chain, counted: true, reported: true });
  }

  function onPicked(nodes: ChainNode[]) {
    const chain = [...game.chain, ...nodes];
    if (!isSolved(chain, target.id)) {
      save({ ...game, chain });
      return;
    }
    // Finished by picking a via the target is part of: say why the game just ended.
    const via = nodes.length === 2 ? nodes[0] : null;
    if (via?.kind === "via") toast(copy.finished(target.name, via.name));
    const total = linksOf(chain);
    const stats = recordSolve(parseStats(readStats(puzzle.mode)), puzzle.date, total);
    writeStorage(storageKeys.stats(puzzle.mode), JSON.stringify(stats));
    save({ chain, counted: true, reported: false });
    track("puzzle_solved", { mode: puzzle.mode, links: total, par: puzzle.par, tier: tierFor(total, puzzle.par) });
    void report(chain);
  }

  function onBack() {
    if (game.chain.length < 2 || solved) return;
    save({ ...game, chain: game.chain.slice(0, -1) });
  }

  return (
    <>
      <section>
        <SectionLabel n="01" aside={solved ? undefined : `${links} ${links === 1 ? "link" : "links"} so far`}>
          Your chain
        </SectionLabel>
        <ChainList chain={game.chain} target={target} solved={solved} labels={copy.labels} />
        {solved ? null : (
          <div className="mt-5">
            <StepPicker
              key={game.chain.length}
              copy={copy}
              date={puzzle.date}
              chain={game.chain}
              targetId={target.id}
              onPicked={onPicked}
              onBack={onBack}
            />
          </div>
        )}
      </section>
      {solved ? <ResultPanel puzzle={puzzle} modeName={copy.name} chain={game.chain} aggregates={aggregates} /> : null}
      <section>
        <SectionLabel n={solved ? "03" : "02"}>Your stats</SectionLabel>
        <StatsRow mode={puzzle.mode} today={puzzle.date} />
      </section>
    </>
  );
}
