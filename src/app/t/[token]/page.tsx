import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SpaceView } from "@/components/spaces/space-view";
import { Shell } from "@/components/ui/shell";
import { site } from "@/config/site";
import { getSpaceByToken } from "@/lib/server/spaces";

// Secret-link page. The title never includes user content, so link previews
// and browser history don't leak it.
export const metadata: Metadata = { title: site.name };

export default async function SpacePage({ params }: PageProps<"/t/[token]">) {
  const { token } = await params;
  const space = await getSpaceByToken(token);
  if (!space) notFound();

  return (
    <>
      <SiteHeader />
      <Shell>
        <main className="flex flex-1 flex-col gap-10 py-10">
          {/* Pass only what the view needs across the server/client boundary. */}
          <SpaceView token={space.token} title={space.title} />
        </main>
        <SiteFooter />
      </Shell>
    </>
  );
}
