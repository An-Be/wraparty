import "server-only";
import type { NodeKind, PathStep, ValidateStepBody, ValidateStepResult } from "@/lib/chain";
import type { SearchResult } from "@/lib/search-schema";

/**
 * The facts behind one game mode. The engine (routes, chain rules, UI) only
 * ever talks to a mode through this. Every method checks against the source's
 * full data, never the bounded graph the seed script uses for par.
 */
export type ModeAdapter = {
  /** Autocomplete for the next pick. */
  search(kind: NodeKind, query: string): Promise<SearchResult[]>;
  /** Is this one link real? Returns the node to add, or why not. */
  validateStep(body: ValidateStepBody): Promise<ValidateStepResult>;
  /** Re-checks every link of a finished chain (shape is checked before this). */
  validatePath(path: readonly PathStep[]): Promise<string | null>;
};
