"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";
import { nextKind, repeatReason, type ChainNode, type ValidateStepResult } from "@/lib/chain";
import { SEARCH_MAX, SEARCH_MIN, type MovieResult, type PersonResult } from "@/lib/search-schema";
import { track } from "@/lib/track";
import { cn } from "@/lib/utils";
import { Photo } from "./photo";

type Option =
  | { kind: "movie"; id: number; label: string; sub: string | null; img: string | null }
  | { kind: "person"; id: number; label: string; sub: string | null; img: string | null };

const DEBOUNCE_MS = 250;

function rejection(current: ChainNode, option: Option, code: "not-credited" | "not-a-role"): string {
  const who = current.kind === "person" ? current.name : option.label;
  const what = current.kind === "person" ? `${option.label}${option.sub ? ` (${option.sub})` : ""}` : current.title;
  if (code === "not-a-role") return `${who} only appears as themselves in ${what}. That doesn't count as a link.`;
  if (current.kind === "person") {
    return `${current.name} isn't credited in ${option.label}${option.sub ? ` (${option.sub})` : ""}. Acting or directing only.`;
  }
  return `${option.label} isn't credited in ${current.title}. Acting or directing only.`;
}

/**
 * Autocomplete for the next link. Searches TMDB through our proxy, then asks the
 * server to check the pick against real credits before it joins the chain.
 */
export function StepPicker({
  date,
  chain,
  onPicked,
  onBack,
}: {
  date: string;
  chain: readonly ChainNode[];
  onPicked: (node: ChainNode) => void;
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

  const label = current.kind === "person" ? `Pick a movie ${current.name} was in` : `Who else is in ${current.title}?`;
  const open = query.trim().length >= SEARCH_MIN && (options.length > 0 || searched !== null);

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
    const res =
      kind === "movie"
        ? await api<{ results: MovieResult[] }>(`/api/tmdb/search-movie?q=${encodeURIComponent(q)}`, { method: "GET" })
        : await api<{ results: PersonResult[] }>(`/api/tmdb/search-person?q=${encodeURIComponent(q)}`, { method: "GET" });
    if (id !== seq.current) return; // a newer keystroke won
    setSearching(false);
    if (!res.ok) {
      setOptions([]);
      setSearched(null);
      setError(res.error);
      return;
    }
    const next: Option[] = res.data.results.map((r) =>
      "title" in r
        ? { kind: "movie", id: r.id, label: r.title, sub: r.year ? String(r.year) : null, img: r.img }
        : { kind: "person", id: r.id, label: r.name, sub: r.dept, img: r.img },
    );
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
    const repeat = repeatReason(chain, option);
    if (repeat) {
      setError(repeat);
      return;
    }
    setChecking(true);
    setError(null);
    const body =
      current.kind === "person" ? { fromPersonId: current.id, movieId: option.id } : { movieId: current.id, toPersonId: option.id };
    const res = await api<ValidateStepResult>(`/api/puzzles/${date}/validate-step`, { method: "POST", body });
    setChecking(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    if (!res.data.valid) {
      track("step_rejected", { kind: option.kind, code: res.data.code });
      setError(res.data.code === "not-found" ? res.data.reason : rejection(current, option, res.data.code));
      return;
    }
    track("step_added", { kind: option.kind, links: chain.filter((n) => n.kind === "movie").length + (option.kind === "movie" ? 1 : 0) });
    reset();
    onPicked(res.data.node);
    inputRef.current?.focus();
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
        hint={checking ? "Checking the credits…" : kind === "movie" ? "Search any movie." : "Search any actor or director."}
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
            placeholder={kind === "movie" ? "Search movies" : "Search people"}
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
                  <Photo src={o.img} alt={o.label} className="h-12 w-8 shrink-0 text-[10px]" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm text-ink">{o.label}</span>
                    {o.sub ? <span className="label text-mute">{o.sub}</span> : null}
                  </span>
                </li>
              ))}
              {!options.length && !searching ? <li className="px-3 py-3 text-sm text-mute">No matches on TMDB.</li> : null}
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
