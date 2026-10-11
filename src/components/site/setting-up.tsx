import { Shell } from "@/components/ui/shell";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

/** Shown before launch, and on any day with no puzzle scheduled. */
export function SettingUp() {
  return (
    <>
      <SiteHeader />
      <Shell>
        <main className="flex flex-1 flex-col justify-center gap-4 py-10">
          <p className="label text-mute">No pair today</p>
          <h1 className="display text-5xl">The crew is setting up.</h1>
          <p className="text-sm text-mute">Today&apos;s puzzle isn&apos;t ready yet. Check back soon.</p>
        </main>
        <SiteFooter />
      </Shell>
    </>
  );
}
