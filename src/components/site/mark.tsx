// Wraparty mark: two links that cross into a loose W. It says "connections"
// without saying "movies", so it covers every game mode. Marquee red, with a
// paper-colored halo where the second link passes over the first. Keep in sync
// with src/app/icon.svg. Inline SVG so it follows the theme tokens.
export function Mark({ height = 22 }: { height?: number }) {
  return (
    <svg viewBox="0 0 48 32" width={(height * 3) / 2} height={height} aria-hidden="true" className="shrink-0 text-marquee">
      <g fill="none" strokeLinejoin="round" strokeLinecap="round" strokeWidth="4.5">
        <path d="M4 5 L14 27 L26 6" stroke="currentColor" />
        <path d="M22 6 L34 27 L44 5" className="stroke-paper" strokeWidth="9.5" />
        <path d="M22 6 L34 27 L44 5" stroke="currentColor" />
      </g>
    </svg>
  );
}
