import { describe, expect, it } from "vitest";
import { isGameOpen } from "./launch";

describe("isGameOpen", () => {
  it("is always open outside production", () => {
    expect(isGameOpen({})).toBe(true);
    expect(isGameOpen({ vercelEnv: "preview" })).toBe(true);
    expect(isGameOpen({ vercelEnv: "development", live: "false" })).toBe(true);
  });

  it("is closed in production until WRAPARTY_LIVE is true", () => {
    expect(isGameOpen({ vercelEnv: "production" })).toBe(false);
    expect(isGameOpen({ vercelEnv: "production", live: "" })).toBe(false);
    expect(isGameOpen({ vercelEnv: "production", live: "false" })).toBe(false);
    expect(isGameOpen({ vercelEnv: "production", live: "1" })).toBe(false);
    expect(isGameOpen({ vercelEnv: "production", live: "true" })).toBe(true);
    expect(isGameOpen({ vercelEnv: "production", live: " TRUE " })).toBe(true);
  });
});
