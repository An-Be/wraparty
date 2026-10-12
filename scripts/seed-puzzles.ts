// Seeds the Movies mode's daily puzzles from the curated list. Each mode has
// its own seed script (its source, its graph); they all write Puzzle rows
// scoped to their GameMode.
//
//   npx tsx scripts/seed-puzzles.ts --dry-run     # resolve names + compute par, write nothing
//   npx tsx scripts/seed-puzzles.ts               # append the keepers as new daily puzzles
//
// For each pair: resolve both names on TMDB, run a bidirectional BFS over the
// bounded credit graph (top-20 movies per person, top-15 cast per movie) to get
// par, keep pairs with par in [--min-par, --max-par], then schedule them on the
// next free UTC dates after Movies' last scheduled puzzle. Existing dates are never
// touched, and a pair that's already scheduled (either order) is skipped.
//
// Needs TMDB_API_TOKEN, plus DIRECT_URL (or DATABASE_URL) unless --dry-run.
// TMDB responses are cached in scripts/.tmdb-cache, so re-runs are cheap.
//
// Options: --file <path>  --min-par 2  --max-par 4  --budget 2500  --start yyyy-mm-dd
//          --rate 40/10 (requests per seconds)  --limit <n pairs>

import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import type { z } from "zod";
import { PrismaClient } from "../src/lib/generated/prisma/client";
import { addDays, isDateKey, utcDateKey } from "../src/lib/dates";
import { computePar, parseKey, type NodeKey } from "../src/lib/par";
import { normalizeName, pairKey, parsePairsFile, type PersonRef } from "../src/lib/seed-pairs";
import {
  movieWithCredits,
  personWithCredits,
  searchPersonResponse,
  TMDB_API_BASE,
  tmdbImage,
  topCastIds,
  topMovieIds,
  type MovieWithCredits,
  type PersonWithCredits,
} from "../src/lib/tmdb";

const { values: args } = parseArgs({
  options: {
    "dry-run": { type: "boolean", default: false },
    file: { type: "string", default: "scripts/seed/pairs.txt" },
    "min-par": { type: "string", default: "2" },
    "max-par": { type: "string", default: "4" },
    budget: { type: "string", default: "2500" },
    start: { type: "string" },
    rate: { type: "string", default: "40/10" },
    limit: { type: "string" },
  },
});

const MODE_SLUG = "movies";
const MIN_PAR = Number(args["min-par"]);
const MAX_PAR = Number(args["max-par"]);
const BUDGET = Number(args.budget);
const [RATE_N, RATE_S] = args.rate!.split("/").map(Number);
const CACHE_DIR = path.resolve("scripts/.tmdb-cache");
const API_BASE = process.env.TMDB_API_BASE_URL || TMDB_API_BASE;

function fail(message: string): never {
  console.error(`seed: ${message}`);
  process.exit(1);
}

// ---- TMDB with a rate limit and a disk cache --------------------------------

const token = process.env.TMDB_API_TOKEN;
if (!token) fail("TMDB_API_TOKEN is not set.");

const recent: number[] = [];
let requests = 0;

async function throttle() {
  for (;;) {
    const now = Date.now();
    while (recent.length && now - recent[0] > RATE_S * 1000) recent.shift();
    if (recent.length < RATE_N) {
      recent.push(now);
      return;
    }
    await new Promise((r) => setTimeout(r, RATE_S * 1000 - (now - recent[0]) + 10));
  }
}

async function tmdb<S extends z.ZodType>(apiPath: string, params: Record<string, string>, schema: S, cacheKey?: string) {
  const cacheFile = cacheKey ? path.join(CACHE_DIR, `${cacheKey}.json`) : null;
  if (cacheFile) {
    const cached = await readFile(cacheFile, "utf8").catch(() => null);
    if (cached) return schema.parse(JSON.parse(cached)) as z.infer<S> | null;
  }
  const url = new URL(`${API_BASE}${apiPath}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  for (let attempt = 0; ; attempt++) {
    await throttle();
    requests++;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } });
    if (res.status === 429 && attempt < 5) {
      const wait = Number(res.headers.get("retry-after") ?? "2");
      await new Promise((r) => setTimeout(r, wait * 1000));
      continue;
    }
    if (res.status === 404) return null;
    if (!res.ok) fail(`TMDB ${res.status} for ${apiPath}`);
    const body = await res.json();
    const data = schema.parse(body) as z.infer<S>;
    if (cacheFile) await writeFile(cacheFile, JSON.stringify(data));
    return data;
  }
}

const getPerson = (id: number) =>
  tmdb(`/person/${id}`, { append_to_response: "movie_credits", language: "en-US" }, personWithCredits, `person-${id}`) as Promise<PersonWithCredits | null>;
const getMovie = (id: number) =>
  tmdb(`/movie/${id}`, { append_to_response: "credits", language: "en-US" }, movieWithCredits, `movie-${id}`) as Promise<MovieWithCredits | null>;

const neighborCache = new Map<NodeKey, NodeKey[]>();
const movieTitles = new Map<number, string>();
const personNames = new Map<number, string>();

async function neighbors(node: NodeKey): Promise<NodeKey[]> {
  const hit = neighborCache.get(node);
  if (hit) return hit;
  const { kind, id } = parseKey(node);
  let out: NodeKey[] = [];
  if (kind === "person") {
    const p = await getPerson(id);
    if (p) {
      personNames.set(p.id, p.name);
      out = topMovieIds(p).map((m) => `m:${m}` as const);
    }
  } else {
    const m = await getMovie(id);
    if (m) {
      movieTitles.set(m.id, m.title);
      for (const c of [...m.credits.cast, ...m.credits.crew]) personNames.set(c.id, c.name);
      out = topCastIds(m).map((p) => `p:${p}` as const);
    }
  }
  neighborCache.set(node, out);
  return out;
}

type Resolved = { id: number; name: string; img: string | null; dept: string | null };

async function resolvePerson(ref: PersonRef): Promise<Resolved | null> {
  if (ref.id) {
    const p = await getPerson(ref.id);
    return p ? { id: p.id, name: p.name, img: tmdbImage(p.profile_path, "w185"), dept: p.known_for_department } : null;
  }
  const data = await tmdb(
    "/search/person",
    { query: ref.name, include_adult: "false", language: "en-US", page: "1" },
    searchPersonResponse,
    `search-${normalizeName(ref.name).replace(/ /g, "_")}`,
  );
  const results = (data?.results ?? []).filter((r) => !r.adult);
  const exact = results.filter((r) => normalizeName(r.name) === normalizeName(ref.name));
  const pick = (exact.length ? exact : results).sort((a, b) => b.popularity - a.popularity)[0];
  return pick ? { id: pick.id, name: pick.name, img: tmdbImage(pick.profile_path, "w185"), dept: pick.known_for_department } : null;
}

async function describePath(p: NodeKey[]): Promise<string> {
  const parts: string[] = [];
  for (const k of p) {
    const { kind, id } = parseKey(k);
    if (kind === "person") {
      parts.push(personNames.get(id) ?? `person ${id}`);
      continue;
    }
    if (!movieTitles.has(id)) {
      const m = await getMovie(id);
      if (m) movieTitles.set(id, m.title);
    }
    parts.push(`[${movieTitles.get(id) ?? `movie ${id}`}]`);
  }
  return parts.join(" → ");
}

// ---- Main ----------------------------------------------------------------------

async function main() {
  await mkdir(CACHE_DIR, { recursive: true });
  const { pairs, errors } = parsePairsFile(await readFile(args.file!, "utf8"));
  if (errors.length) fail(`fix ${args.file}:\n  ${errors.join("\n  ")}`);
  const todo = args.limit ? pairs.slice(0, Number(args.limit)) : pairs;

  const dryRun = args["dry-run"];
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!dryRun && !connectionString) fail("DIRECT_URL (or DATABASE_URL) is not set. Use --dry-run to only compute par.");
  const db = connectionString ? new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 2 }) }) : null;

  const mode = db ? await db.gameMode.findUnique({ where: { slug: MODE_SLUG }, select: { id: true } }) : null;
  if (db && !mode) fail(`No GameMode row for "${MODE_SLUG}". Apply the migrations first.`);
  const existing =
    db && mode
      ? await db.puzzle.findMany({ where: { modeId: mode.id }, select: { date: true, entityAId: true, entityBId: true } })
      : [];
  const scheduled = new Set(existing.map((p) => pairKey(Number(p.entityAId), Number(p.entityBId))));
  const lastDate = existing.map((p) => p.date).sort().at(-1);

  if (args.start && !isDateKey(args.start)) fail("--start must be yyyy-mm-dd");
  const today = utcDateKey();
  let next = args.start ?? (lastDate && lastDate >= today ? addDays(lastDate, 1) : today);
  if (lastDate && next <= lastDate) fail(`--start ${next} would collide with scheduled dates (last is ${lastDate}).`);

  const report: unknown[] = [];
  const keep: { date: string; a: Resolved; b: Resolved; par: number }[] = [];

  for (const [i, pair] of todo.entries()) {
    const tag = `[${i + 1}/${todo.length}] line ${pair.line}`;
    const a = await resolvePerson(pair.a);
    const b = await resolvePerson(pair.b);
    if (!a || !b) {
      console.log(`${tag}  SKIP  couldn't find ${!a ? pair.a.name : pair.b.name} on TMDB`);
      report.push({ line: pair.line, status: "not-found", a: pair.a.name, b: pair.b.name });
      continue;
    }
    const names = `${a.name} (${a.dept ?? "?"}) → ${b.name} (${b.dept ?? "?"})`;
    if (scheduled.has(pairKey(a.id, b.id))) {
      console.log(`${tag}  SKIP  already scheduled: ${names}`);
      report.push({ line: pair.line, status: "duplicate", a: a.name, b: b.name });
      continue;
    }

    const before = requests;
    const result = await computePar(a.id, b.id, neighbors, { maxPar: MAX_PAR, budget: BUDGET });
    const cost = `${result.expansions} lookups, ${requests - before} requests`;
    if (!result.found) {
      console.log(`${tag}  SKIP  ${result.reason === "budget" ? "search budget hit" : `no path within par ${MAX_PAR}`}: ${names} (${cost})`);
      report.push({ line: pair.line, status: result.reason, a: a.name, b: b.name, aId: a.id, bId: b.id });
      continue;
    }
    if (result.par < MIN_PAR) {
      console.log(`${tag}  SKIP  par ${result.par} is too easy: ${names}`);
      report.push({ line: pair.line, status: "too-easy", par: result.par, a: a.name, b: b.name });
      continue;
    }

    const date = next;
    next = addDays(next, 1);
    scheduled.add(pairKey(a.id, b.id));
    keep.push({ date, a, b, par: result.par });
    const sample = await describePath(result.path);
    console.log(`${tag}  KEEP  ${date}  par ${result.par}  ${names}\n        ${sample} (${cost})`);
    report.push({ line: pair.line, status: "keep", date, par: result.par, a: a.name, aId: a.id, b: b.name, bId: b.id, sample });
  }

  await writeFile("scripts/.seed-report.json", JSON.stringify(report, null, 2));
  console.log(`\nseed: ${keep.length} of ${todo.length} pairs kept, ${requests} TMDB requests. Report: scripts/.seed-report.json`);

  if (dryRun || !db || !mode) {
    console.log("seed: dry run, nothing written.");
    await db?.$disconnect();
    return;
  }
  if (keep.length) {
    await db.puzzle.createMany({
      data: keep.map(({ date, a, b, par }) => ({
        modeId: mode.id,
        date,
        par,
        entityAId: String(a.id),
        entityAName: a.name,
        entityAImg: a.img,
        entityBId: String(b.id),
        entityBName: b.name,
        entityBImg: b.img,
      })),
    });
    console.log(`seed: scheduled ${keep[0].date} through ${keep.at(-1)!.date}.`);
  }
  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
