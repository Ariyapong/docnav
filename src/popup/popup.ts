import {
  clearRecent,
  getRecent,
  getTheme,
  isSiteEnabled,
  pathLabel,
  setSiteEnabled,
  setTheme,
} from "../storage";
import type { ThemePref } from "../types";

async function getActiveHost(): Promise<string | null> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) return null;
  try {
    return new URL(tab.url).host || null;
  } catch {
    return null;
  }
}

function fmtAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

async function renderRecent() {
  const list = document.getElementById("recent-list") as HTMLUListElement;
  list.innerHTML = "";
  const recents = await getRecent();
  if (recents.length === 0) {
    const empty = document.createElement("li");
    empty.className = "recent-empty";
    empty.textContent = "Nothing yet — visit a docs page to start tracking.";
    list.appendChild(empty);
    return;
  }
  for (const r of recents.slice(0, 12)) {
    const li = document.createElement("li");
    li.className = "recent-item";
    li.title = r.url;
    const t = document.createElement("div");
    t.className = "recent-title";
    t.textContent = r.title || pathLabel(r.url);
    const meta = document.createElement("div");
    meta.className = "recent-meta";
    meta.textContent = `${pathLabel(r.url)} · ${fmtAgo(r.visitedAt)}`;
    li.append(t, meta);
    li.addEventListener("click", () => {
      void chrome.tabs.create({ url: r.url });
    });
    list.appendChild(li);
  }
}

function applyPopupTheme(theme: ThemePref) {
  document.documentElement.setAttribute("data-theme", theme);
}

function renderThemeSelection(theme: ThemePref) {
  document.querySelectorAll<HTMLButtonElement>(".seg-btn").forEach((btn) => {
    btn.setAttribute("aria-checked", String(btn.dataset.theme === theme));
  });
}

async function init() {
  const versionEl = document.getElementById("version");
  if (versionEl) versionEl.textContent = `v${chrome.runtime.getManifest().version}`;

  const host = await getActiveHost();
  const hostEl = document.getElementById("host") as HTMLElement;
  const toggle = document.getElementById("enabled") as HTMLInputElement;
  hostEl.textContent = host ?? "(no active page)";

  if (!host) {
    toggle.disabled = true;
  } else {
    toggle.checked = await isSiteEnabled(host);
    toggle.addEventListener("change", async () => {
      await setSiteEnabled(host, toggle.checked);
    });
  }

  const theme = await getTheme();
  applyPopupTheme(theme);
  renderThemeSelection(theme);

  document.querySelectorAll<HTMLButtonElement>(".seg-btn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const next = (btn.dataset.theme ?? "system") as ThemePref;
      await setTheme(next);
      applyPopupTheme(next);
      renderThemeSelection(next);
    });
  });

  document.getElementById("clear")?.addEventListener("click", async () => {
    await clearRecent();
    await renderRecent();
  });

  document.getElementById("open-shortcuts")?.addEventListener("click", (e) => {
    e.preventDefault();
    void chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
  });

  await renderRecent();
}

void init();
