import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { CreateSpaceForm } from "@/components/spaces/create-space-form";
import { SectionLabel } from "@/components/ui/section-label";
import { Shell } from "@/components/ui/shell";
import { site } from "@/config/site";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <Shell>
        <main className="flex flex-1 flex-col gap-10 py-10">
          <section className="flex flex-col gap-4">
            <h1 className="display text-5xl">{site.name}</h1>
            <p className="text-sm text-mute">{site.description}</p>
          </section>
          <section>
            <SectionLabel n="01">Start</SectionLabel>
            <CreateSpaceForm />
          </section>
        </main>
        <SiteFooter />
      </Shell>
    </>
  );
}
