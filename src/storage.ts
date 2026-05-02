import type { RecentPage, SiteSettings, ThemePref } from "./types";

const RECENT_KEY = "docnav.recent";
const SETTINGS_KEY = "docnav.settings";
const THEME_KEY = "docnav.theme";
const RECENT_LIMIT = 50;

export async function getRecent(): Promise<RecentPage[]> {
  const data = await chrome.storage.local.get(RECENT_KEY);
  return (data[RECENT_KEY] as RecentPage[] | undefined) ?? [];
}

export async function recordVisit(page: RecentPage): Promise<void> {
  const list = await getRecent();
  const without = list.filter((p) => p.url !== page.url);
  without.unshift(page);
  await chrome.storage.local.set({
    [RECENT_KEY]: without.slice(0, RECENT_LIMIT),
  });
}

export async function clearRecent(): Promise<void> {
  await chrome.storage.local.set({ [RECENT_KEY]: [] });
}

export async function getSettings(): Promise<SiteSettings> {
  const data = await chrome.storage.local.get(SETTINGS_KEY);
  return (data[SETTINGS_KEY] as SiteSettings | undefined) ?? { disabledHosts: {} };
}

export async function setSiteEnabled(host: string, enabled: boolean): Promise<void> {
  const settings = await getSettings();
  if (enabled) {
    delete settings.disabledHosts[host];
  } else {
    settings.disabledHosts[host] = true;
  }
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

export async function isSiteEnabled(host: string): Promise<boolean> {
  const settings = await getSettings();
  return !settings.disabledHosts[host];
}

export async function getTheme(): Promise<ThemePref> {
  const data = await chrome.storage.local.get(THEME_KEY);
  const v = data[THEME_KEY];
  return v === "light" || v === "dark" ? v : "system";
}

export async function setTheme(theme: ThemePref): Promise<void> {
  await chrome.storage.local.set({ [THEME_KEY]: theme });
}

export const THEME_STORAGE_KEY = THEME_KEY;

/** host + pathname, no trailing slash. Useful for distinguishing pages on the same site. */
export function pathLabel(url: string): string {
  try {
    const u = new URL(url);
    const path = u.pathname === "/" ? "" : u.pathname.replace(/\/$/, "");
    return u.host + path;
  } catch {
    return url;
  }
}
