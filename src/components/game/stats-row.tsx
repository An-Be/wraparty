"use client";

import { useSyncExternalStore } from "react";
import { readStorage, storageKeys, subscribeStorage } from "@/lib/local-store";
import { averageLinks, currentStreak, parseStats } from "@/lib/stats";

const readStats = () => readStorage(storageKeys.stats);
const serverStats = () => null;

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1 border-r border-ink px-3 py-3 last:border-r-0">
      <span className="display text-3xl">{value}</span>
      <span className="label text-mute">{label}</span>
    </div>
  );
}

/** This device's streak and history. Lives in localStorage; no account. */
export function StatsRow({ today }: { today: string }) {
  const stats = parseStats(useSyncExternalStore(subscribeStorage, readStats, serverStats));
  const avg = averageLinks(stats);
  return (
    <div className="grid grid-cols-4 border border-ink">
      <Stat value={String(currentStreak(stats, today))} label="Streak" />
      <Stat value={String(stats.maxStreak)} label="Best" />
      <Stat value={String(stats.played)} label="Played" />
      <Stat value={avg === null ? "–" : String(avg)} label="Avg links" />
    </div>
  );
}
