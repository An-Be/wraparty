import type { ChainNode, PersonNode } from "@/lib/chain";
import { cn } from "@/lib/utils";
import { Photo } from "./photo";

function NodeText({ node }: { node: ChainNode }) {
  if (node.kind === "person") {
    return (
      <>
        <span className="label text-mute">Person</span>
        <span className="font-display text-lg font-medium leading-tight tracking-tight">{node.name}</span>
      </>
    );
  }
  return (
    <>
      <span className="label text-mute">Movie{node.year ? ` · ${node.year}` : ""}</span>
      <span className="font-display text-lg font-medium leading-tight tracking-tight">{node.title}</span>
    </>
  );
}

/** The chain so far, top to bottom, with today's goal waiting at the end until it's reached. */
export function ChainList({ chain, target, solved }: { chain: readonly ChainNode[]; target: PersonNode; solved: boolean }) {
  return (
    <ol className="flex flex-col border-t border-ink">
      {chain.map((node, i) => (
        <li key={`${node.kind}-${node.id}`} className={cn("flex items-center gap-3 border-b border-ink py-3", node.kind === "movie" && "pl-6")}>
          <span className="label w-6 shrink-0 text-mute">{String(i + 1).padStart(2, "0")}</span>
          <Photo
            src={node.img}
            alt={node.kind === "person" ? node.name : node.title}
            className="h-14 w-10 shrink-0 text-xs"
          />
          <span className="flex min-w-0 flex-col gap-0.5">
            <NodeText node={node} />
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
