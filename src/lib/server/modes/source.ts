import "server-only";

/**
 * A mode's data source failed (not configured, down, or answered something
 * unexpected). Adapters throw subclasses; routes turn them into one generic 503
 * so players never see source internals.
 */
export class SourceError extends Error {
  constructor(
    readonly source: string,
    message: string,
    readonly kind: "not-configured" | "upstream",
  ) {
    super(message);
  }
}

export function sourceUnavailable(error: unknown): Response {
  if (error instanceof SourceError) console.error(`[${error.source}] ${error.kind}: ${error.message}`);
  else console.error("[source] unexpected error", error);
  return Response.json({ error: "Game data is unavailable right now. Try again in a minute." }, { status: 503 });
}
