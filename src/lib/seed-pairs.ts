// Parsing for scripts/seed/pairs.txt, the curated list of daily pairs.
//
// One pair per line:   Meryl Streep | Keanu Reeves
// Pin an ambiguous name to a TMDB person id:   Chris Evans [16828] | Scarlett Johansson
// Blank lines and lines starting with # are ignored.

export type PersonRef = { name: string; id: number | null };
export type PairLine = { line: number; a: PersonRef; b: PersonRef };
export type ParseResult = { pairs: PairLine[]; errors: string[] };

function parseRef(raw: string): PersonRef | null {
  const m = raw.trim().match(/^(.+?)(?:\s*\[(\d+)\])?$/);
  if (!m || !m[1].trim()) return null;
  return { name: m[1].trim(), id: m[2] ? Number(m[2]) : null };
}

export function parsePairsFile(text: string): ParseResult {
  const pairs: PairLine[] = [];
  const errors: string[] = [];
  text.split(/\r?\n/).forEach((raw, i) => {
    const line = raw.trim();
    if (!line || line.startsWith("#")) return;
    const parts = line.split("|");
    const a = parts.length === 2 ? parseRef(parts[0]) : null;
    const b = parts.length === 2 ? parseRef(parts[1]) : null;
    if (!a || !b) {
      errors.push(`line ${i + 1}: expected "Person A | Person B", got "${line}"`);
      return;
    }
    pairs.push({ line: i + 1, a, b });
  });
  return { pairs, errors };
}

/** Case- and accent-insensitive name match ("Penelope Cruz" == "Penélope Cruz"). */
export function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** The same two people in either order. */
export function pairKey(a: number, b: number): string {
  return a < b ? `${a}-${b}` : `${b}-${a}`;
}
