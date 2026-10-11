// Wraparty mark: two people (the rings) and the movie they share (the filled
// overlap), which is the whole game. Keep in sync with src/app/icon.svg.
// Inline SVG with currentColor so it inherits text color (next/image can't).
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <circle cx="11" cy="16" r="8.5" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="21" cy="16" r="8.5" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <path d="M16 9.12A8.5 8.5 0 0 1 16 22.88A8.5 8.5 0 0 1 16 9.12Z" fill="currentColor" />
    </svg>
  );
}
