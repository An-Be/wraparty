import type { ChainNode, EntityRef, KindLabels } from "@/lib/chain";
import { cn } from "@/lib/utils";
import { Photo } from "./photo";

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** The chain so far, top to bottom, with today's goal waiting at the end until it's reached. */
export function ChainList({
  chain,
  target,
  solved,
  labels,
}: {
  chain: readonly ChainNode[];
  target: EntityRef;
  solved: boolean;
  labels: KindLabels;
}) {
  return (
    <ol className="flex flex-col border-t border-ink">
      {chain.map((node, i) => (
        <li key={`${node.kind}-${node.id}`} className={cn("flex items-center gap-3 border-b border-ink py-3", node.kind === "via" && "pl-6")}>
          <span className="label w-6 shrink-0 text-mute">{String(i + 1).padStart(2, "0")}</span>
          <Photo src={node.img} alt={node.name} className="h-14 w-10 shrink-0 text-xs" />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="label text-mute">
              {capitalize(node.kind === "entity" ? labels.entity : labels.via)}
              {node.kind === "via" && node.meta ? ` · ${node.meta}` : ""}
            </span>
            <span className="font-display text-lg font-medium leading-tight tracking-tight">{node.name}</span>
          </span>
        </li>
      ))}
      {solved ? null : (
        <li className="flex items-center gap-3 border-b border-dashed border-faint py-3 text-faint">
          <span className="label w-6 shrink-0">··</span>
          <Photo src={target.img} alt={target.name} className="h-14 w-10 shrink-0 text-xs opacity-50" />
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="label">Goal</span>
            <span className="font-display text-lg font-medium leading-tight tracking-tight">{target.name}</span>
          </span>
        </li>
      )}
    </ol>
  );
}
