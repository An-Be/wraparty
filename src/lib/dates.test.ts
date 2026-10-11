import { describe, expect, it } from "vitest";
import {
  addDays,
  daysBetween,
  displayDate,
  formatCountdown,
  isDateKey,
  isPlayableDate,
  msUntilNextUtcMidnight,
  shareDateLabel,
  utcDateKey,
  wrappedIndex,
} from "./dates";

describe("utcDateKey", () => {
  it("uses the UTC calendar, not local time", () => {
    expect(utcDateKey(Date.parse("2026-10-09T23:59:59Z"))).toBe("2026-10-09");
    expect(utcDateKey(Date.parse("2026-10-10T00:00:00Z"))).toBe("2026-10-10");
    // 8pm in Chicago on the 9th is already the 10th in UTC.
    expect(utcDateKey(Date.parse("2026-10-09T20:00:00-05:00"))).toBe("2026-10-10");
  });
});

describe("isDateKey", () => {
  it("accepts real dates only", () => {
    expect(isDateKey("2026-10-09")).toBe(true);
    expect(isDateKey("2026-02-30")).toBe(false);
    expect(isDateKey("2026-10-9")).toBe(false);
    expect(isDateKey("../../x")).toBe(false);
    expect(isDateKey(20261009)).toBe(false);
  });
});

describe("day math", () => {
  it("counts and adds days across months and DST", () => {
    expect(daysBetween("2026-10-30", "2026-11-02")).toBe(3);
    expect(daysBetween("2026-11-02", "2026-10-30")).toBe(-3);
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-08", 1)).toBe("2026-03-09");
  });
});

describe("labels", () => {
  it("formats share and display dates", () => {
    expect(shareDateLabel("2026-10-09")).toBe("10/09");
    expect(displayDate("2026-10-09")).toBe("Oct 9");
  });
  it("formats the countdown", () => {
    expect(formatCountdown(5 * 3600_000 + 12 * 60_000 + 33_000)).toBe("05:12:33");
    expect(formatCountdown(-5)).toBe("00:00:00");
    expect(msUntilNextUtcMidnight(Date.parse("2026-10-09T23:00:00Z"))).toBe(3600_000);
  });
});

describe("wrappedIndex", () => {
  it("cycles through the list in date order", () => {
    expect(wrappedIndex("2026-10-01", "2026-10-01", 3)).toBe(0);
    expect(wrappedIndex("2026-10-01", "2026-10-04", 3)).toBe(0);
    expect(wrappedIndex("2026-10-01", "2026-10-05", 3)).toBe(1);
    expect(wrappedIndex("2026-10-01", "2026-09-30", 3)).toBe(2);
    expect(wrappedIndex("2026-10-01", "2026-10-05", 0)).toBe(-1);
  });
});

describe("isPlayableDate", () => {
  const now = Date.parse("2026-10-10T00:30:00Z");
  it("allows today and yesterday only", () => {
    expect(isPlayableDate("2026-10-10", now)).toBe(true);
    expect(isPlayableDate("2026-10-09", now)).toBe(true);
    expect(isPlayableDate("2026-10-08", now)).toBe(false);
    expect(isPlayableDate("2026-10-11", now)).toBe(false);
    expect(isPlayableDate("nope", now)).toBe(false);
  });
});
