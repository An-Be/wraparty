import Link from "next/link";
import { HeaderStreak } from "@/components/game/header-streak";
import { buttonVariants } from "@/components/ui/button";
import type { ModeCard as ModeCardData } from "@/lib/server/puzzles";
import { cn } from "@/lib/utils";

/** One live game on the hub: "Movies · live", its tagline, and today's link. */
export function ModeCard({ mode, today }: { mode: ModeCardData; today: string }) {
  return (
    <li className="border-b border-ink">
      <Link href={`/${mode.slug}`} className="group flex flex-col gap-3 py-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="display text-4xl">
            {mode.name} <span className="text-faint">· {mode.statusLabel}</span>
          </h2>
          <span className="label shrink-0 text-mute">
            <HeaderStreak mode={mode.slug} today={today} />
          </span>
        </div>
        <p className="text-sm text-mute">{mode.tagline}</p>
        <span className={cn(buttonVariants(), "self-start group-hover:brightness-90")}>Play today</span>
      </Link>
    </li>
  );
}
