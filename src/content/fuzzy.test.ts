import { describe, expect, it } from "vitest";
import { fuzzyMatch, highlight } from "./fuzzy";

describe("fuzzyMatch", () => {
  it("returns a zero-score empty match for an empty query", () => {
    const m = fuzzyMatch("", "anything");
    expect(m).toEqual({ score: 0, indices: [] });
  });

  it("returns null when the query is not a subsequence", () => {
    expect(fuzzyMatch("xyz", "react docs")).toBeNull();
  });

  it("matches a simple subsequence and records the matched positions", () => {
    const m = fuzzyMatch("rd", "react docs");
    expect(m).not.toBeNull();
    expect(m!.indices).toEqual([0, 6]);
  });

  it("is case-insensitive", () => {
    const m = fuzzyMatch("RDC", "react docs");
    expect(m).not.toBeNull();
    // r@0, d@6, c@8 — 'o' at 7 is skipped because we need 'c' next
    expect(m!.indices).toEqual([0, 6, 8]);
  });

  it("scores consecutive matches better than scattered ones", () => {
    const consecutive = fuzzyMatch("intro", "introduction");
    const scattered = fuzzyMatch("intro", "interim notation rolling outputs");
    expect(consecutive).not.toBeNull();
    expect(scattered).not.toBeNull();
    expect(consecutive!.score).toBeLessThan(scattered!.score);
  });

  it("rewards matches that start at a word boundary", () => {
    const boundary = fuzzyMatch("col", "column sizing");
    const middle = fuzzyMatch("col", "deepcolumn");
    expect(boundary).not.toBeNull();
    expect(middle).not.toBeNull();
    expect(boundary!.score).toBeLessThan(middle!.score);
  });

  it("biases slightly toward shorter targets when ties are close", () => {
    const shorter = fuzzyMatch("intro", "intro");
    const longer = fuzzyMatch("intro", "introspection");
    expect(shorter).not.toBeNull();
    expect(longer).not.toBeNull();
    expect(shorter!.score).toBeLessThan(longer!.score);
  });
});

describe("highlight", () => {
  it("returns the plain text wrapped in a fragment when there are no indices", () => {
    const frag = highlight("hello world", []);
    expect(frag.textContent).toBe("hello world");
    expect(frag.querySelectorAll("mark")).toHaveLength(0);
  });

  it("wraps matched runs in <mark> while leaving other characters alone", () => {
    // indices 0,1 ("he") and 6,7 ("wo")
    const frag = highlight("hello world", [0, 1, 6, 7]);
    const marks = frag.querySelectorAll("mark");
    expect(marks).toHaveLength(2);
    expect(marks[0].textContent).toBe("he");
    expect(marks[1].textContent).toBe("wo");
    expect(frag.textContent).toBe("hello world");
  });
});
