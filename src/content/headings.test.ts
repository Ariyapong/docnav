import { afterEach, describe, expect, it } from "vitest";
import { extractHeadings, findCurrentHeading } from "./headings";
import type { Heading } from "../types";

afterEach(() => {
  document.body.innerHTML = "";
  document.head.innerHTML = "";
});

function setDom(html: string) {
  document.body.innerHTML = html;
}

describe("extractHeadings", () => {
  it("returns h1–h4 inside <main> in document order", () => {
    setDom(`
      <main>
        <h1>Intro</h1>
        <h2>Section A</h2>
        <h3>A.1</h3>
        <h4>A.1.a</h4>
        <h5>too deep</h5>
      </main>
    `);
    const headings = extractHeadings();
    expect(headings.map((h) => h.text)).toEqual([
      "Intro",
      "Section A",
      "A.1",
      "A.1.a",
    ]);
    expect(headings.map((h) => h.level)).toEqual([1, 2, 3, 4]);
  });

  it("prefers <main> as the root when it contains headings", () => {
    setDom(`
      <header><h1>Site title</h1></header>
      <main>
        <h2>Real content</h2>
      </main>
    `);
    const headings = extractHeadings();
    expect(headings.map((h) => h.text)).toEqual(["Real content"]);
  });

  it("skips headings inside nav/header/footer/aside even when scoped to document", () => {
    setDom(`
      <nav><h2>Nav heading</h2></nav>
      <aside><h2>Sidebar heading</h2></aside>
      <h2>In document</h2>
      <footer><h2>Footer heading</h2></footer>
    `);
    const headings = extractHeadings();
    expect(headings.map((h) => h.text)).toEqual(["In document"]);
  });

  it("auto-generates a slug-style id when a heading has none", () => {
    setDom(`<main><h2>Hello, World!</h2></main>`);
    const [h] = extractHeadings();
    expect(h.id).toBe("hello-world");
    expect(h.el.id).toBe("hello-world");
  });

  it("disambiguates duplicate ids by suffixing a counter", () => {
    setDom(`
      <main>
        <h2>Setup</h2>
        <h2>Setup</h2>
      </main>
    `);
    const headings = extractHeadings();
    expect(headings.map((h) => h.id)).toEqual(["setup", "setup-2"]);
  });

  it("respects a pre-existing id", () => {
    setDom(`<main><h2 id="custom-anchor">Anything</h2></main>`);
    const [h] = extractHeadings();
    expect(h.id).toBe("custom-anchor");
  });

  it("collapses internal whitespace in heading text", () => {
    setDom(`<main><h2>  multi   line\n  heading  </h2></main>`);
    const [h] = extractHeadings();
    expect(h.text).toBe("multi line heading");
  });

  it("falls back to <article> when no <main> is present", () => {
    setDom(`
      <article>
        <h2>From article</h2>
      </article>
    `);
    expect(extractHeadings().map((h) => h.text)).toEqual(["From article"]);
  });
});

describe("findCurrentHeading", () => {
  function makeHeading(top: number, text = "h"): Heading {
    const el = document.createElement("h2");
    el.textContent = text;
    el.getBoundingClientRect = () =>
      ({ top, left: 0, right: 0, bottom: 0, width: 0, height: 0, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
    return { id: text, level: 2, text, el };
  }

  it("returns null when there are no headings", () => {
    expect(findCurrentHeading([])).toBeNull();
  });

  it("returns the first heading when every heading is below the threshold", () => {
    const headings = [makeHeading(9999, "a"), makeHeading(10000, "b")];
    expect(findCurrentHeading(headings)?.text).toBe("a");
  });

  it("returns the last heading whose top is above the upper-third threshold", () => {
    // happy-dom innerHeight defaults to 768 → threshold ~230
    const headings = [
      makeHeading(-500, "above-1"),
      makeHeading(-100, "above-2"),
      makeHeading(500, "below"),
    ];
    expect(findCurrentHeading(headings)?.text).toBe("above-2");
  });
});
