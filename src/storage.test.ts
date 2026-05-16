import { describe, expect, it } from "vitest";
import {
  clearRecent,
  getRecent,
  getSettings,
  getTheme,
  isSiteEnabled,
  pathLabel,
  recordVisit,
  setSiteEnabled,
  setTheme,
} from "./storage";
import type { RecentPage } from "./types";

function page(url: string, overrides: Partial<RecentPage> = {}): RecentPage {
  return {
    url,
    title: url,
    host: new URL(url).host,
    visitedAt: Date.now(),
    headingCount: 3,
    ...overrides,
  };
}

describe("recordVisit / getRecent", () => {
  it("returns an empty list when nothing has been recorded", async () => {
    expect(await getRecent()).toEqual([]);
  });

  it("places the most recent visit at the front", async () => {
    await recordVisit(page("https://a.test/1"));
    await recordVisit(page("https://b.test/2"));
    const list = await getRecent();
    expect(list.map((p) => p.url)).toEqual(["https://b.test/2", "https://a.test/1"]);
  });

  it("deduplicates by URL — re-visiting moves the entry to the top", async () => {
    await recordVisit(page("https://a.test/1", { visitedAt: 1 }));
    await recordVisit(page("https://b.test/2", { visitedAt: 2 }));
    await recordVisit(page("https://a.test/1", { visitedAt: 3 }));
    const list = await getRecent();
    expect(list.map((p) => p.url)).toEqual(["https://a.test/1", "https://b.test/2"]);
    expect(list[0].visitedAt).toBe(3);
  });

  it("caps the stored list at 50 entries", async () => {
    for (let i = 0; i < 60; i++) {
      await recordVisit(page(`https://example.test/p${i}`, { visitedAt: i }));
    }
    const list = await getRecent();
    expect(list).toHaveLength(50);
    // Newest first: p59 at index 0 down to p10 at index 49.
    expect(list[0].url).toBe("https://example.test/p59");
    expect(list[49].url).toBe("https://example.test/p10");
  });

  it("clearRecent empties the list", async () => {
    await recordVisit(page("https://a.test/1"));
    await clearRecent();
    expect(await getRecent()).toEqual([]);
  });
});

describe("site enabled settings", () => {
  it("treats unknown hosts as enabled by default", async () => {
    expect(await isSiteEnabled("react.dev")).toBe(true);
  });

  it("setSiteEnabled(false) disables a host", async () => {
    await setSiteEnabled("react.dev", false);
    expect(await isSiteEnabled("react.dev")).toBe(false);
    const settings = await getSettings();
    expect(settings.disabledHosts["react.dev"]).toBe(true);
  });

  it("setSiteEnabled(true) re-enables a previously disabled host", async () => {
    await setSiteEnabled("react.dev", false);
    await setSiteEnabled("react.dev", true);
    expect(await isSiteEnabled("react.dev")).toBe(true);
    const settings = await getSettings();
    expect(settings.disabledHosts["react.dev"]).toBeUndefined();
  });

  it("disable/enable for one host does not affect others", async () => {
    await setSiteEnabled("react.dev", false);
    expect(await isSiteEnabled("tanstack.com")).toBe(true);
  });
});

describe("theme", () => {
  it("defaults to 'system' when nothing is stored", async () => {
    expect(await getTheme()).toBe("system");
  });

  it("round-trips supported themes", async () => {
    await setTheme("dark");
    expect(await getTheme()).toBe("dark");
    await setTheme("light");
    expect(await getTheme()).toBe("light");
    await setTheme("system");
    expect(await getTheme()).toBe("system");
  });
});

describe("pathLabel", () => {
  it("joins host and pathname with no trailing slash", () => {
    expect(pathLabel("https://react.dev/reference/react-dom")).toBe(
      "react.dev/reference/react-dom",
    );
  });

  it("drops a trailing slash on the path", () => {
    expect(pathLabel("https://react.dev/reference/")).toBe("react.dev/reference");
  });

  it("omits the path entirely when it's just '/'", () => {
    expect(pathLabel("https://react.dev/")).toBe("react.dev");
  });

  it("falls back to the raw input for non-URL strings", () => {
    expect(pathLabel("not-a-url")).toBe("not-a-url");
  });
});
