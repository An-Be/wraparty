import { cn } from "@/lib/utils";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

/**
 * TMDB headshot or poster, grayscale to sit inside the monochrome system.
 * A plain <img>: next/image sets an inline style attribute, which the
 * nonce-only production CSP blocks. Falls back to initials when TMDB has no image.
 */
export function Photo({ src, alt, className }: { src: string | null; alt: string; className?: string }) {
  if (!src) {
    return (
      <span
        aria-hidden="true"
        className={cn("flex items-center justify-center border border-ink bg-wash font-display text-mute", className)}
      >
        {initials(alt)}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element -- see comment above
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={cn("border border-ink bg-wash object-cover grayscale", className)}
    />
  );
}
