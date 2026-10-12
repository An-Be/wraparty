import { site } from "@/config/site";

// Wraparty's footer carries no author line: the games stand on their own.
export function SiteFooter() {
  return (
    <footer className="mt-auto flex flex-wrap items-baseline justify-between gap-2 border-t border-ink py-5">
      <p className="label text-mute">{site.tagline}</p>
    </footer>
  );
}
