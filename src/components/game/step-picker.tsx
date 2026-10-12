"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { linksOf, nextKind, repeatReason, type ChainNode, type ValidateStepResult } from "@/lib/chain";
import { SEARCH_MAX, SEARCH_MIN, type SearchResult } from "@/lib/search-schema";
import type { ModeCopy } from "@/modes/types";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";
import { Photo } from "./photo";

type Option = SearchResult & { kind: ChainNode["kind"] };

const DEBOUNCE_MS = 250;

/** "Hook (1991)": a via with its qualifier, for rejection messages. */
function viaLabel(via: { name: string; meta: string | null }): string {
  return via.meta ? `${via.name} (${via.meta})` : via.name;
}

/**
 * Autocomplete for the next link. Searches the mode's source through our API,
 * then asks the server to check the pick against real facts before it joins
 * the chain. All wording comes from the mode's copy.
 */
export function StepPicker({
  copy,
  date,
  chain,
  targetId,
  onPicked,
  onBack,
}: {
  copy: ModeCopy;
  date: string;
  chain: readonly ChainNode[];
  /** Today's target: picking a via they're part of ends the game. */
  targetId: string;
  /** One node, or a via plus the target when that via finishes the chain. */
  onPicked: (nodes: ChainNode[]) => void;
  onBack: () => void;
}) {
  const current = chain.at(-1)!;
  const kind = nextKind(chain);
  const listId = useId();
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<Option[]>([]);
  const [searched, setSearched] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [active, setActive] = useState(-1);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const label = current.kind === "entity" ? copy.pickVia(current.name) : copy.pickEntity(current.name);
  const withMode = (path: string) => `${path}?mode=${encodeURIComponent(copy.slug)}`;
  const open = query.trim().length >= SEARCH_MIN && (options.length > 0 || searched !== null);

  /**
   * Shows why a pick didn't count. Closes the dropdown first: it sits over the
   * message, which made a rejected pick look like a click that did nothing.
   * The typed text stays, selected, so the next search is one keystroke away.
   */
  function showError(message: string) {
    seq.current++;
    setOptions([]);
    setSearched(null);
    setSearching(false);
    setActive(-1);
    setError(message);
    // After the re-render that re-enables the input (it's disabled while checking).
    requestAnimationFrame(() => inputRef.current?.select());
  }

  function reset() {
    seq.current++;
    if (timer.current) clearTimeout(timer.current);
    setQuery("");
    setOptions([]);
    setSearched(null);
    setSearching(false);
    setActive(-1);
  }

  async function runSearch(q: string) {
    const id = ++seq.current;
    const res = await api<{ results: SearchResult[] }>(
      `${withMode("/api/search")}&kind=${kind}&q=${encodeURIComponent(q)}`,
      { method: "GET" },
    );
    if (id !== seq.current) return; // a newer keystroke won
    setSearching(false);
    if (!res.ok) {
      setOptions([]);
      setSearched(null);
      setError(res.error);
      return;
    }
    const next: Option[] = res.data.results.map((r) => ({ ...r, kind }));
    setOptions(next);
    setSearched(q);
    setActive(next.length ? 0 : -1);
  }

  function onChange(value: string) {
    setQuery(value);
    setError(null);
    if (timer.current) clearTimeout(timer.current);
    const q = value.trim();
    if (q.length < SEARCH_MIN) {
      seq.current++;
      setOptions([]);
      setSearched(null);
      setSearching(false);
      setActive(-1);
      return;
    }
    setSearching(true);
    timer.current = setTimeout(() => void runSearch(q), DEBOUNCE_MS);
  }

  async function pick(option: Option) {
    if (checking) return;
    const repeat = repeatReason(chain, option, copy.labels);
    if (repeat) {
      showError(repeat);
      return;
    }
    setChecking(true);
    setError(null);
    const body =
      current.kind === "entity" ? { fromEntityId: current.id, viaId: option.id } : { viaId: current.id, toEntityId: option.id };
    const res = await api<ValidateStepResult>(withMode(`/api/puzzles/${date}/validate-step`), { method: "POST", body });
    if (!res.ok) {
      setChecking(false);
      showError(res.error);
      return;
    }
    if (!res.data.valid) {
      setChecking(false);
      track("step_rejected", { mode: copy.slug, kind: option.kind, code: res.data.code });
      if (res.data.code === "not-found") {
        showError(res.data.reason);
        return;
      }
      const [entity, via] = current.kind === "entity" ? [current, option] : [option, current];
      showError(copy.rejected(res.data.code, entity.name, viaLabel(via)));
      return;
    }
    track("step_added", { mode: copy.slug, kind: option.kind, links: linksOf(chain) + (option.kind === "via" ? 1 : 0) });
    const picked = res.data.node;
    // Picking a via the target is part of finishes the chain: naming them would
    // be a step with only one right answer. Checked against the same facts; if
    // the check fails for any reason, the game just carries on as before.
    const finish = picked.kind === "via" ? await targetIn(picked.id) : null;
    setChecking(false);
    reset();
    onPicked(finish ? [picked, finish] : [picked]);
    inputRef.current?.focus();
  }

  async function targetIn(viaId: string): Promise<ChainNode | null> {
    const res = await api<ValidateStepResult>(withMode(`/api/puzzles/${date}/validate-step`), {
      method: "POST",
      body: { viaId, toEntityId: targetId },
    });
    return res.ok && res.data.valid ? res.data.node : null;
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!open || !options.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      void pick(options[active]);
    } else if (e.key === "Escape") {
      setOptions([]);
      setSearched(null);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Field
        htmlFor="step"
        label={label}
        error={error}
        hint={checking ? "Checking…" : copy.hint[kind]}
      >
        <div className="relative">
          <Input
            id="step"
            ref={inputRef}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
            aria-invalid={Boolean(error)}
            aria-describedby="step-desc"
            value={query}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            maxLength={SEARCH_MAX}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="search"
            placeholder={copy.placeholder[kind]}
            disabled={checking}
          />
          {open ? (
            <ul id={listId} role="listbox" className="absolute inset-x-0 top-full z-10 max-h-80 overflow-auto border border-t-0 border-ink bg-paper">
              {options.map((o, i) => (
                <li
                  key={`${o.kind}-${o.id}`}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => void pick(o)}
                  className={cn("flex cursor-pointer items-center gap-3 px-3 py-2", i === active && "bg-wash")}
                >
                  <Photo src={o.img} alt={o.name} className="h-12 w-8 shrink-0 text-[10px]" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm text-ink">{o.name}</span>
                    {o.meta ? <span className="label text-mute">{o.meta}</span> : null}
                  </span>
                </li>
              ))}
              {!options.length && !searching ? <li className="px-3 py-3 text-sm text-mute">{copy.noMatches}</li> : null}
            </ul>
          ) : null}
        </div>
      </Field>
      {chain.length > 1 ? (
        <div>
          <Button variant="ghost" size="sm" onClick={onBack} disabled={checking} className="px-0">
            ← Undo last pick
          </Button>
        </div>
      ) : null}
    </div>
  );
}
