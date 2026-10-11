// Placeholder brand mark: a square split on the diagonal. Replace per tool.
// Inline SVG with currentColor so it inherits text color (next/image can't).
export function Mark({ size = 28 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} fill="currentColor" aria-hidden="true">
      <polygon points="2,2 30,2 2,30" />
      <polygon points="30,8 30,30 8,30" />
    </svg>
  );
}
