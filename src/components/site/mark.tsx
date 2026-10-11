// WrapParty mark: a clapperboard, the "that's a wrap" moment.
// Inline SVG with currentColor so it inherits text color (next/image can't).
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="currentColor" aria-hidden="true">
      <polygon points="2,4 8,4 5,10 2,10" />
      <polygon points="12,4 19,4 16,10 9,10" />
      <polygon points="23,4 30,4 27,10 20,10" />
      <rect x="2" y="12" width="28" height="18" />
    </svg>
  );
}
