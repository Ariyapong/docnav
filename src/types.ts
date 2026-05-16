export interface Heading {
  id: string;
  level: number;
  text: string;
  el: HTMLElement;
}

export interface RecentPage {
  url: string;
  title: string;
  host: string;
  visitedAt: number;
  headingCount: number;
}

export interface SiteSettings {
  // host -> enabled flag. If a host is missing, default is "enabled".
  disabledHosts: Record<string, true>;
}

export type ThemePref = "system" | "light" | "dark";

export type RuntimeMessage =
  | { type: "open-palette" }
  | { type: "toggle-outline" }
  | { type: "page-indexed"; page: RecentPage }
  | { type: "open-recent"; url: string }
  | { type: "list-open-tab-urls" };
