import { describe, expect, it } from "vitest";
import { averageLinks, currentStreak, emptyStats, parseStats, recordSolve } from "./stats";

describe("recordSolve", () => {
  it("starts a streak, extends it on consecutive days, resets after a gap", () => {
    let s = recordSolve(emptyStats, "2026-10-01", 3);
    expect(s).toMatchObject({ played: 1, streak: 1, maxStreak: 1 });
    s = recordSolve(s, "2026-10-02", 4);
    expect(s).toMatchObject({ played: 2, streak: 2, maxStreak: 2, totalLinks: 7 });
    s = recordSolve(s, "2026-10-04", 2);
    expect(s).toMatchObject({ played: 3, streak: 1, maxStreak: 2 });
  });

  it("counts a date once", () => {
    const s = recordSolve(emptyStats, "2026-10-01", 3);
    expect(recordSolve(s, "2026-10-01", 9)).toBe(s);
  });

  it("crosses month boundaries", () => {
    const s = recordSolve(recordSolve(emptyStats, "2026-10-31", 3), "2026-11-01", 3);
    expect(s.streak).toBe(2);
  });
});

describe("currentStreak", () => {
  const s = recordSolve(recordSolve(emptyStats, "2026-10-01", 3), "2026-10-02", 3);
  it("is alive today and the day after, gone after a missed day", () => {
    expect(currentStreak(s, "2026-10-02")).toBe(2);
    expect(currentStreak(s, "2026-10-03")).toBe(2);
    expect(currentStreak(s, "2026-10-04")).toBe(0);
    expect(currentStreak(emptyStats, "2026-10-04")).toBe(0);
  });
});

describe("parseStats + averageLinks", () => {
  it("survives junk storage", () => {
    expect(parseStats(null)).toEqual(emptyStats);
    expect(parseStats("{nope")).toEqual(emptyStats);
    expect(parseStats(JSON.stringify({ played: "x", streak: 2 }))).toMatchObject({ played: 0, streak: 2 });
  });
  it("averages to one decimal", () => {
    expect(averageLinks(emptyStats)).toBeNull();
    expect(averageLinks({ ...emptyStats, played: 3, totalLinks: 10 })).toBe(3.3);
  });
});
