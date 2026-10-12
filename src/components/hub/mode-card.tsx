import Link from "next/link";
import { HeaderStreak } from "@/components/game/header-streak";
import type { ModeCard as ModeCardData } from "@/lib/server/puzzles";
import { cn } from "@/lib/utils";

/** One game on the hub. Live modes link to today's puzzle; the rest say "Coming soon". */
export function ModeCard({ mode, n, today }: { mode: ModeCardData; n: number; today: string }) {
  const live = mode.status === "LIVE";
  const body = (
    <>
      <div className="flex items-baseline justify-between gap-4">
        <span className="label text-mute">{String(n).padStart(2, "0")}</span>
        <span className={cn("label", live ? "text-ink" : "text-faint")}>
          {live ? <HeaderStreak mode={mode.slug} today={today} fallback="Play today" /> : "Coming soon"}
        </span>
      </div>
      <h2 className={cn("display text-4xl", !live && "text-faint")}>{mode.name}</h2>
      <p className={cn("text-sm", live ? "text-mute" : "text-faint")}>{mode.tagline}</p>
    </>
  );

  if (!live) {
    return <li className="flex flex-col gap-2 border-b border-dashed border-faint py-5">{body}</li>;
  }
  return (
    <li className="border-b border-ink">
      <Link href={`/${mode.slug}`} className="flex flex-col gap-2 py-5 hover:bg-wash focus-visible:bg-wash">
        {body}
      </Link>
    </li>
  );
}
