import { extractHeadings } from "./headings";
import { createPalette } from "./palette";
import { createOutline } from "./outline";
import { SHADOW_CSS } from "./styles";
import {
  THEME_STORAGE_KEY,
  getRecent,
  getTheme,
  isSiteEnabled,
  recordVisit,
} from "../storage";
import type { RuntimeMessage, ThemePref } from "../types";

(async function bootstrap() {
  if (window.top !== window) return; // Skip iframes.
  const host = location.host;
  if (!host) return;

  const enabled = await isSiteEnabled(host);
  if (!enabled) return;

  // Mount a single shadow-DOM host element for all our UI.
  const mount = document.createElement("div");
  mount.id = "docnav-root";
  mount.style.all = "initial";
  const shadow = mount.attachShadow({ mode: "open" });
  const styleEl = document.createElement("style");
  styleEl.textContent = SHADOW_CSS;
  shadow.appendChild(styleEl);
  document.documentElement.appendChild(mount);

  // Apply current theme to the shadow host element.
  const applyTheme = (theme: ThemePref) => {
    mount.setAttribute("data-theme", theme);
  };
  applyTheme(await getTheme());

  // React to theme changes from the popup or other tabs.
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "local") return;
    const change = changes[THEME_STORAGE_KEY];
    if (change) {
      const next = change.newValue;
      applyTheme(next === "light" || next === "dark" ? next : "system");
    }
  });

  const palette = createPalette(shadow);
  const outline = createOutline(shadow);

  let headings = extractHeadings();

  // The URL we last wrote to Recent (sans hash). Used to avoid spamming
  // recordVisit when the same page mutates or the user just changes anchor.
  let lastRecordedUrl: string | null = null;

  // When the extension is reloaded, content scripts already running in open
  // tabs get orphaned — chrome.runtime.id throws and chrome.storage goes
  // undefined. Detect that so we stop trying to write into a dead channel.
  function isExtensionAlive(): boolean {
    try {
      return !!chrome.runtime?.id;
    } catch {
      return false;
    }
  }

  function urlWithoutHash(): string {
    return location.origin + location.pathname + location.search;
  }

  function maybeRecord() {
    if (!isExtensionAlive()) return;
    if (headings.length < 2) return;
    const url = urlWithoutHash();
    if (url === lastRecordedUrl) return;
    lastRecordedUrl = url;
    recordVisit({
      url,
      title: document.title || location.pathname,
      host: location.host,
      visitedAt: Date.now(),
      headingCount: headings.length,
    }).catch(() => {
      // Context was invalidated between the check and the call. Drop.
    });
  }

  // Re-extract on DOM mutations, but throttled — most doc sites lazy-load.
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      headings = extractHeadings();
      outline.refresh(headings);
      maybeRecord();
    }, 400);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Catch SPA navigations (pushState/replaceState/popstate). Doc sites built
  // on Next, Docusaurus, etc. swap content without a full reload, so the
  // initial bootstrap's URL goes stale within seconds.
  function onUrlChange() {
    // Headings usually re-render after the URL flip; the MutationObserver
    // above will catch the new content and call maybeRecord. We still try
    // here in case the page didn't mutate (anchor-only links).
    maybeRecord();
  }
  window.addEventListener("popstate", onUrlChange);
  for (const method of ["pushState", "replaceState"] as const) {
    const orig = history[method];
    history[method] = function (this: History, ...args: Parameters<typeof orig>) {
      const ret = orig.apply(this, args);
      onUrlChange();
      return ret;
    } as typeof orig;
  }

  // Initial record (may be skipped if headings haven't arrived yet — the
  // observer will pick it up once they do).
  maybeRecord();

  async function openPalette() {
    if (!isExtensionAlive()) return;
    const here = urlWithoutHash();
    const recents = await getRecent().catch(() => []);
    palette.open(headings, recents.filter((r) => r.url !== here));
  }

  // Local hotkey fallback. The browser-level command (chrome.commands) goes
  // through the background service worker; this also catches sites where the
  // browser shortcut is intercepted before reaching the page.
  document.addEventListener(
    "keydown",
    (e) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault();
        e.stopPropagation();
        if (palette.isOpen()) palette.close();
        else void openPalette();
      } else if (mod && e.shiftKey && e.key.toLowerCase() === "o") {
        e.preventDefault();
        e.stopPropagation();
        outline.toggle(headings);
      }
    },
    true,
  );

  chrome.runtime.onMessage.addListener((message: RuntimeMessage) => {
    if (message.type === "open-palette") {
      void openPalette();
    } else if (message.type === "toggle-outline") {
      outline.toggle(headings);
    }
  });
})();
