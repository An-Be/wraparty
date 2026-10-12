import { site } from "@/config/site";

// Wraparty's footer carries no author line: the games stand on their own.
// Sibling apps sit here by name only ("More from the same shelf").
export function SiteFooter() {
  return (
    <footer className="mt-auto flex flex-col gap-2 border-t border-ink py-5">
      <p className="label text-mute">{site.tagline}</p>
      {site.shelf.length ? (
        <p className="label text-mute">
          More from the same shelf:{" "}
          {site.shelf.map((app, i) => (
            <span key={app.url}>
              {i ? " · " : null}
              <a href={app.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
                {app.name}
              </a>
            </span>
          ))}
        </p>
      ) : null}
    </footer>
  );
}
