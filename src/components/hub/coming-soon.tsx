import Link from "next/link";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { buttonVariants } from "@/components/ui/button";
import { Shell } from "@/components/ui/shell";

/** A mode that exists on the hub but isn't playable yet. */
export function ComingSoon({ name, tagline }: { name: string; tagline: string }) {
  return (
    <>
      <SiteHeader />
      <Shell>
        <main className="flex flex-1 flex-col justify-center gap-4 py-10">
          <p className="label text-mute">Coming soon</p>
          <h1 className="display text-5xl">{name}</h1>
          <p className="text-sm text-mute">{tagline}</p>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Back to today&apos;s games
          </Link>
        </main>
        <SiteFooter />
      </Shell>
    </>
  );
}
