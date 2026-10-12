import { SectionLabel } from "@/components/ui/section-label";
import { site } from "@/config/site";

/** Sibling apps, linked by name only. They leave the app, so plain <a>. */
export function Shelf({ n }: { n: string }) {
  if (!site.shelf.length) return null;
  return (
    <section>
      <SectionLabel n={n}>More from the same shelf</SectionLabel>
      <ul className="flex flex-col border-t border-ink">
        {site.shelf.map((app) => (
          <li key={app.url} className="border-b border-ink">
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-baseline justify-between gap-4 py-4 hover:bg-wash"
            >
              <span className="flex flex-col gap-1">
                <span className="font-display text-xl font-medium tracking-tight">{app.name}</span>
                <span className="text-sm text-mute">{app.line}</span>
              </span>
              <span aria-hidden="true" className="label text-mute">
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
