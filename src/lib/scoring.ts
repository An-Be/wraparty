import { nodeLabel, type ChainNode } from "./chain";
import { shareDateLabel } from "./dates";

// Friendly scoring: tiers, not raw numbers. Matches the VsPar enum in schema.prisma.
export type Tier = "UNDER" | "PAR" | "OVER";

export function tierFor(links: number, par: number): Tier {
  if (links < par) return "UNDER";
  if (links === par) return "PAR";
  return "OVER";
}

export const tierCopy: Record<Tier, { label: string; line: string }> = {
  UNDER: { label: "Under par", line: "You found a shorter route than we did." },
  PAR: { label: "Par", line: "Right on the shortest route we know." },
  OVER: { label: "Over par", line: "The scenic route. Still a wrap." },
};

/**
 * One square per link: green up to par, yellow past it. Short chains are padded
 * with white squares to par + 2, so the grid always shows how much room was left.
 * "4 links, par 3" -> 🟩🟩🟩🟨⬜
 */
export function emojiGrid(links: number, par: number): string {
  const squares: string[] = [];
  for (let i = 0; i < links; i++) squares.push(i < par ? "🟩" : "🟨");
  while (squares.length < par + 2) squares.push("⬜");
  return squares.join("");
}

function surname(name: string): string {
  return name.trim().split(/\s+/).at(-1) ?? name;
}

export function shareText({
  date,
  personAName,
  personBName,
  par,
  chain,
  url,
}: {
  date: string;
  personAName: string;
  personBName: string;
  par: number;
  chain: readonly ChainNode[];
  url?: string;
}): string {
  const links = chain.filter((n) => n.kind === "movie").length;
  const head = `WrapParty ${shareDateLabel(date)}: ${surname(personAName)} → ${surname(personBName)} in ${links} (par ${par}) ${emojiGrid(links, par)}`;
  const path = chain.map(nodeLabel).join(" → ");
  return [head, path, url].filter(Boolean).join("\n");
}
