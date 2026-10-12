import { ModeCard } from "@/components/hub/mode-card";
import { Shelf } from "@/components/hub/shelf";
import { SettingUp } from "@/components/site/setting-up";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SectionLabel } from "@/components/ui/section-label";
import { Shell } from "@/components/ui/shell";
import { site } from "@/config/site";
import { utcDateKey } from "@/lib/dates";
import { gameIsOpen } from "@/lib/server/launch";
import { getModes } from "@/lib/server/puzzles";

// The arcade: every game mode, live ones first. Each mode plays at /[mode].
export default async function Hub() {
  // Before launch, production shows the setting-up screen without touching the database.
  if (!gameIsOpen()) return <SettingUp />;

  const modes = await getModes();
  const today = utcDateKey();

  return (
    <>
      <SiteHeader />
      <Shell>
        <main className="flex flex-1 flex-col gap-10 py-8">
          <div className="flex flex-col gap-3">
            <h1 className="display text-5xl">{site.slogan}</h1>
            <p className="text-sm text-mute">
              One pair a day per game, same for everyone. Link them in as few steps as you can.
            </p>
          </div>
          <section>
            <SectionLabel n="01">Today&apos;s games</SectionLabel>
            <ul className="flex flex-col border-t border-ink">
              {modes.map((mode, i) => (
                <ModeCard key={mode.slug} mode={mode} n={i + 1} today={today} />
              ))}
            </ul>
          </section>
          <Shelf n="02" />
        </main>
        <SiteFooter />
      </Shell>
    </>
  );
}
