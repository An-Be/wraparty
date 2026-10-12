// localStorage wrapped for useSyncExternalStore. Snapshots are raw strings, so
// React compares them by value and nothing re-renders unless the value changed.
// If storage is unavailable (private mode, blocked site data), values live in
// memory for the session so the game still plays; they just don't persist.

const memory = new Map<string, string>();
const listeners = new Set<() => void>();

export function readStorage(key: string): string | null {
  if (memory.has(key)) return memory.get(key)!;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string) {
  memory.set(key, value);
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // memory copy above keeps this session working
  }
  for (const l of listeners) l();
}

export function subscribeStorage(listener: () => void): () => void {
  listeners.add(listener);
  // Another tab finished today's puzzle: drop our memory copy and re-read.
  const onStorage = (e: StorageEvent) => {
    if (e.key) memory.delete(e.key);
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

// Stats and saved games are per mode; the device id is shared across modes.
export const storageKeys = {
  stats: (mode: string) => `wraparty:${mode}:stats`,
  device: "wraparty:device",
  game: (mode: string, date: string) => `wraparty:${mode}:game:${date}`,
};

/** Before modes, Movies stats lived under one key. Read it until Movies has its own. */
export const legacyStatsKey: Record<string, string> = { movies: "wraparty:stats" };

export function readStats(mode: string): string | null {
  return readStorage(storageKeys.stats(mode)) ?? (Object.hasOwn(legacyStatsKey, mode) ? readStorage(legacyStatsKey[mode]) : null);
}

function uuidV4(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // randomUUID needs a secure context; plain-http LAN testing doesn't have one.
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Random per-device id for anonymous solve reporting. Not an account, not a fingerprint. */
export function getDeviceId(): string {
  const existing = readStorage(storageKeys.device);
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
  const id = uuidV4();
  writeStorage(storageKeys.device, id);
  return id;
}
