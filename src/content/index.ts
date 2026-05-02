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

  // Re-extract on DOM mutations, but throttled — most doc sites lazy-load.
  let scheduled = false;
  const observer = new MutationObserver(() => {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      headings = extractHeadings();
      outline.refresh(headings);
    }, 400);
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Log this visit if the page has any headings worth indexing.
  if (headings.length >= 2) {
    void recordVisit({
      url: location.href,
      title: document.title || location.pathname,
      host,
      visitedAt: Date.now(),
      headingCount: headings.length,
    });
  }

  async function openPalette() {
    const recents = (await getRecent()).filter((r) => r.url !== location.href);
    palette.open(headings, recents);
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
