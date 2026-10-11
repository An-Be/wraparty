"use client";

import { useSyncExternalStore } from "react";
import { readStorage, storageKeys, subscribeStorage } from "@/lib/local-store";
import { currentStreak, parseStats } from "@/lib/stats";

const readStats = () => readStorage(storageKeys.stats);
const serverStats = () => null;

/** "Streak 3" in the header, once there is one. */
export function HeaderStreak({ today }: { today: string }) {
  const raw = useSyncExternalStore(subscribeStorage, readStats, serverStats);
  const streak = currentStreak(parseStats(raw), today);
  if (!streak) return null;
  return <span>Streak {streak}</span>;
}
