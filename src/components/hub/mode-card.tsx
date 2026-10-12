import Link from "next/link";
import { HeaderStreak } from "@/components/game/header-streak";
import { buttonVariants } from "@/components/ui/button";
import type { ModeCard as ModeCardData } from "@/lib/server/puzzles";
import { cn } from "@/lib/utils";

/**
 * One game on the hub: "Movies · live", "Music · tuning up". Live modes link to
 * today's puzzle; the rest are honest coming-soon cards.
 */
export function ModeCard({ mode, n, today }: { mode: ModeCardData; n: number; today: string }) {
  const live = mode.status === "LIVE";
  const heading = (
    <div className="flex items-baseline justify-between gap-4">
      <h2 className={cn("display text-4xl", !live && "text-faint")}>
        {mode.name} <span className="text-faint">· {mode.statusLabel}</span>
      </h2>
      <span className="label shrink-0 text-mute">
        {live ? <HeaderStreak mode={mode.slug} today={today} /> : String(n).padStart(2, "0")}
      </span>
    </div>
  );

  if (!live) {
    return (
      <li className="flex flex-col gap-2 border-b border-dashed border-faint py-5">
        {heading}
        <p className="text-sm text-faint">{mode.tagline}</p>
      </li>
    );
  }
  return (
    <li className="border-b border-ink">
      <Link href={`/${mode.slug}`} className="group flex flex-col gap-3 py-5">
        {heading}
        <p className="text-sm text-mute">{mode.tagline}</p>
        <span className={cn(buttonVariants(), "self-start group-hover:brightness-90")}>Play today</span>
      </Link>
    </li>
  );
}
