"use client";

import { useSyncExternalStore } from "react";
import { formatCountdown, msUntilNextUtcMidnight, utcDateKey } from "@/lib/dates";

function subscribeSeconds(cb: () => void) {
  const id = setInterval(cb, 1000);
  return () => clearInterval(id);
}
const nowSeconds = () => Math.floor(Date.now() / 1000);
const serverSeconds = () => null;

/** Time until the next pair. Once the UTC date moves past this puzzle's, offer the new one. */
export function Countdown({ date }: { date: string }) {
  const seconds = useSyncExternalStore(subscribeSeconds, nowSeconds, serverSeconds);
  if (seconds === null) return <span className="display text-3xl">--:--:--</span>;
  if (utcDateKey(seconds * 1000) !== date) {
    return (
      <button type="button" onClick={() => window.location.reload()} className="display text-3xl underline underline-offset-4">
        New pair ready
      </button>
    );
  }
  return <span className="display text-3xl">{formatCountdown(msUntilNextUtcMidnight(seconds * 1000))}</span>;
}
