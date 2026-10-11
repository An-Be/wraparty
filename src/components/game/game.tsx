"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { SectionLabel } from "@/components/ui/section-label";
import { api } from "@/lib/api-client";
import { isSolved, linksOf, type ChainNode, type PersonNode, type PuzzleProps } from "@/lib/chain";
import { parseGame, type GameState } from "@/lib/game-state";
import { getDeviceId, readStorage, storageKeys, subscribeStorage, writeStorage } from "@/lib/local-store";
import { tierFor } from "@/lib/scoring";
import type { DailyAggregates, SolveResponse } from "@/lib/solve-types";
import { parseStats, recordSolve } from "@/lib/stats";
import { toast } from "@/lib/toast";
import { track } from "@/lib/track";
import { ChainList } from "./chain-list";
import { ResultPanel } from "./result-panel";
import { StatsRow } from "./stats-row";
import { StepPicker } from "./step-picker";

const serverSnapshot = () => null;

/**
 * Today's game. The chain lives in localStorage (keyed by UTC date) so a reload
 * resumes it; reaching person B records local stats and an anonymous solve report.
 */
export function Game({ puzzle, initialAggregates }: { puzzle: PuzzleProps; initialAggregates: DailyAggregates | null }) {
  const key = storageKeys.game(puzzle.date);
  const start = useMemo<PersonNode>(() => ({ kind: "person", ...puzzle.personA }), [puzzle.personA]);
  const target = useMemo<PersonNode>(() => ({ kind: "person", ...puzzle.personB }), [puzzle.personB]);
  const raw = useSyncExternalStore(subscribeStorage, () => readStorage(key), serverSnapshot);
  const game = useMemo(() => parseGame(raw, start), [raw, start]);
  const [aggregates, setAggregates] = useState(initialAggregates);

  const solved = isSolved(game.chain, target.id);
  const links = linksOf(game.chain);

  function save(next: GameState) {
    writeStorage(key, JSON.stringify(next));
  }

  async function report(chain: ChainNode[]) {
    const res = await api<SolveResponse>(`/api/puzzles/${puzzle.date}/solves`, {
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

  function onPicked(node: ChainNode) {
    const chain = [...game.chain, node];
    if (!isSolved(chain, target.id)) {
      save({ ...game, chain });
      return;
    }
    const total = linksOf(chain);
    writeStorage(storageKeys.stats, JSON.stringify(recordSolve(parseStats(readStorage(storageKeys.stats)), puzzle.date, total)));
    save({ chain, counted: true, reported: false });
    track("puzzle_solved", { links: total, par: puzzle.par, tier: tierFor(total, puzzle.par) });
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
        <ChainList chain={game.chain} target={target} solved={solved} />
        {solved ? null : (
          <div className="mt-5">
            <StepPicker key={game.chain.length} date={puzzle.date} chain={game.chain} onPicked={onPicked} onBack={onBack} />
          </div>
        )}
      </section>
      {solved ? <ResultPanel puzzle={puzzle} chain={game.chain} aggregates={aggregates} /> : null}
      <section>
        <SectionLabel n={solved ? "03" : "02"}>Your stats</SectionLabel>
        <StatsRow today={puzzle.date} />
      </section>
    </>
  );
}
