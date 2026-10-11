import { describe, expect, it } from "vitest";
import type { ChainNode } from "./chain";
import { emojiGrid, shareText, tierFor } from "./scoring";

describe("tierFor", () => {
  it("maps links vs par to a tier", () => {
    expect(tierFor(2, 3)).toBe("UNDER");
    expect(tierFor(3, 3)).toBe("PAR");
    expect(tierFor(4, 3)).toBe("OVER");
  });
});

describe("emojiGrid", () => {
  it("matches the spec example", () => {
    expect(emojiGrid(4, 3)).toBe("🟩🟩🟩🟨⬜");
  });
  it("pads short chains and grows long ones", () => {
    expect(emojiGrid(2, 3)).toBe("🟩🟩⬜⬜⬜");
    expect(emojiGrid(3, 3)).toBe("🟩🟩🟩⬜⬜");
    expect(emojiGrid(6, 3)).toBe("🟩🟩🟩🟨🟨🟨");
  });
});

describe("shareText", () => {
  it("builds the headline, the path and the link", () => {
    const chain: ChainNode[] = [
      { kind: "person", id: 1, name: "Meryl Streep", img: null },
      { kind: "movie", id: 10, title: "Movie X", year: 2000, img: null },
      { kind: "person", id: 2, name: "Keanu Reeves", img: null },
    ];
    const text = shareText({
      date: "2026-10-09",
      personAName: "Meryl Streep",
      personBName: "Keanu Reeves",
      par: 1,
      chain,
      url: "https://wraparty.example",
    });
    expect(text).toBe(
      "WrapParty 10/09: Streep → Reeves in 1 (par 1) 🟩⬜⬜\nMeryl Streep → Movie X → Keanu Reeves\nhttps://wraparty.example",
    );
  });
});
