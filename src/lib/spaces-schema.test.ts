import { describe, expect, it } from "vitest";
import { createSpaceSchema, TITLE_MAX } from "./spaces-schema";

describe("createSpaceSchema", () => {
  it("trims and collapses whitespace", () => {
    expect(createSpaceSchema.parse({ title: "  Friday   dinner " })).toEqual({ title: "Friday dinner" });
  });

  it("rejects empty and too-long titles", () => {
    expect(createSpaceSchema.safeParse({ title: "   " }).success).toBe(false);
    expect(createSpaceSchema.safeParse({ title: "x".repeat(TITLE_MAX + 1) }).success).toBe(false);
  });

  it("rejects non-strings", () => {
    expect(createSpaceSchema.safeParse({ title: 42 }).success).toBe(false);
  });
});
