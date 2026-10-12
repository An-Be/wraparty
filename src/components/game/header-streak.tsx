"use client";

import { useSyncExternalStore } from "react";
import { readStats, subscribeStorage } from "@/lib/local-store";
import { currentStreak, parseStats } from "@/lib/stats";

const serverStats = () => null;

/** "Streak 3" for one mode, once there is one; `fallback` until then. */
export function HeaderStreak({ mode, today, fallback = null }: { mode: string; today: string; fallback?: string | null }) {
  const raw = useSyncExternalStore(subscribeStorage, () => readStats(mode), serverStats);
  const streak = currentStreak(parseStats(raw), today);
  if (!streak) return fallback;
  return <span>Streak {streak}</span>;
}
