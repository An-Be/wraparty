/**
 * Path prefixes whose next segment is a secret (a token that grants access).
 * Used to redact logs (src/lib/csp-report.ts) and analytics. Keep in sync with
 * the privateHeaders entries in next.config.ts.
 *
 * WrapParty has no secret links: the daily puzzle is public and there are no
 * accounts. Leave this empty unless a secret-link feature is added.
 */
export const secretPathPrefixes: readonly string[] = [];
