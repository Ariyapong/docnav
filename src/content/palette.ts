import { fuzzyMatch, highlight } from "./fuzzy";
import { pathLabel } from "../storage";
import type { Heading, RecentPage } from "../types";

interface Item {
  kind: "heading" | "recent";
  label: string;
  meta?: string;
  level?: number;
  isOpen?: boolean;
  onPick: () => void;
}

interface Scored {
  item: Item;
  score: number;
  indices: number[];
}

interface PaletteApi {
  open: (headings: Heading[], recents: RecentPage[], openUrls?: Set<string>) => void;
  close: () => void;
  toggle: (headings: Heading[], recents: RecentPage[], openUrls?: Set<string>) => void;
  isOpen: () => boolean;
}

function normalizeForCompare(raw: string): string | null {
  try {
    const u = new URL(raw);
    return u.origin + u.pathname + u.search;
  } catch {
    return null;
  }
}

export function createPalette(root: ShadowRoot): PaletteApi {
  let backdrop: HTMLDivElement | null = null;
  let input: HTMLInputElement | null = null;
  let list: HTMLUListElement | null = null;
  let items: Item[] = [];
  let visible: Scored[] = [];
  let selectedIndex = 0;

  function buildItems(
    headings: Heading[],
    recents: RecentPage[],
    openUrls: Set<string>,
  ): Item[] {
    const out: Item[] = headings.map((h) => ({
      kind: "heading",
      label: h.text,
      level: h.level,
      onPick: () => jumpTo(h),
    }));
    for (const r of recents.slice(0, 8)) {
      const normalized = normalizeForCompare(r.url);
      out.push({
        kind: "recent",
        label: r.title || pathLabel(r.url),
        meta: pathLabel(r.url),
        isOpen: normalized !== null && openUrls.has(normalized),
        onPick: () => {
          void chrome.runtime.sendMessage({ type: "open-recent", url: r.url });
        },
      });
    }
    return out;
  }

  function jumpTo(h: Heading) {
    history.replaceState(null, "", `#${h.id}`);
    h.el.scrollIntoView({ behavior: "smooth", block: "start" });
    // Brief outline flash so the user sees where they landed.
    const prev = h.el.style.transition;
    const prevBg = h.el.style.backgroundColor;
    h.el.style.transition = "background-color 800ms ease-out";
    h.el.style.backgroundColor = "rgba(162, 58, 20, 0.18)";
    setTimeout(() => {
      h.el.style.backgroundColor = prevBg;
      setTimeout(() => {
        h.el.style.transition = prev;
      }, 800);
    }, 50);
  }

  function score(query: string): Scored[] {
    if (!query) {
      return items.map((item) => ({ item, score: 0, indices: [] }));
    }
    const out: Scored[] = [];
    for (const item of items) {
      const m = fuzzyMatch(query, item.label);
      if (m) out.push({ item, score: m.score, indices: m.indices });
    }
    out.sort((a, b) => a.score - b.score);
    return out;
  }

  function render() {
    if (!list) return;
    list.innerHTML = "";
    if (visible.length === 0) {
      const empty = document.createElement("div");
      empty.className = "palette-empty";
      empty.textContent = "No matches.";
      list.appendChild(empty);
      return;
    }

    let lastKind: Item["kind"] | null = null;
    visible.forEach((s, i) => {
      if (s.item.kind !== lastKind) {
        const section = document.createElement("li");
        section.className = "palette-section";
        section.setAttribute("aria-hidden", "true");
        section.textContent = s.item.kind === "heading" ? "On this page" : "Recent";
        list!.appendChild(section);
        lastKind = s.item.kind;
      }
      const li = document.createElement("li");
      li.className = "palette-item";
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", String(i === selectedIndex));
      li.dataset.index = String(i);

      const level = document.createElement("span");
      level.className = "palette-item-level";
      level.textContent = s.item.level ? `H${s.item.level}` : "↗";
      li.appendChild(level);

      const text = document.createElement("span");
      text.className = "palette-item-text";
      text.appendChild(highlight(s.item.label, s.indices));
      li.appendChild(text);

      if (s.item.isOpen) {
        const badge = document.createElement("span");
        badge.className = "palette-item-badge";
        badge.textContent = "open";
        li.appendChild(badge);
      }

      if (s.item.meta) {
        const meta = document.createElement("span");
        meta.className = "palette-item-meta";
        meta.textContent = s.item.meta;
        li.appendChild(meta);
      }

      li.addEventListener("mouseenter", () => {
        selectedIndex = i;
        updateSelection();
      });
      li.addEventListener("click", () => {
        pick(i);
      });
      list!.appendChild(li);
    });
  }

  function updateSelection() {
    if (!list) return;
    const els = list.querySelectorAll<HTMLLIElement>(".palette-item");
    els.forEach((el) => {
      const idx = Number(el.dataset.index);
      const sel = idx === selectedIndex;
      el.setAttribute("aria-selected", String(sel));
      if (sel) el.scrollIntoView({ block: "nearest" });
    });
  }

  function move(delta: number) {
    if (visible.length === 0) return;
    selectedIndex = (selectedIndex + delta + visible.length) % visible.length;
    updateSelection();
  }

  function pick(i: number) {
    const target = visible[i];
    if (!target) return;
    close();
    target.item.onPick();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "ArrowDown" || (e.key === "n" && e.ctrlKey)) {
      e.preventDefault();
      move(1);
      return;
    }
    if (e.key === "ArrowUp" || (e.key === "p" && e.ctrlKey)) {
      e.preventDefault();
      move(-1);
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      pick(selectedIndex);
    }
  }

  function open(headings: Heading[], recents: RecentPage[], openUrls?: Set<string>) {
    if (backdrop) close();
    items = buildItems(headings, recents, openUrls ?? new Set());
    visible = score("");
    selectedIndex = 0;

    backdrop = document.createElement("div");
    backdrop.className = "palette-backdrop";
    backdrop.addEventListener("mousedown", (e) => {
      if (e.target === backdrop) close();
    });

    const palette = document.createElement("div");
    palette.className = "palette";
    palette.setAttribute("role", "dialog");
    palette.setAttribute("aria-label", "docnav command palette");

    const inputRow = document.createElement("div");
    inputRow.className = "palette-input-row";
    const glyph = document.createElement("span");
    glyph.className = "palette-glyph";
    glyph.textContent = "›";
    input = document.createElement("input");
    input.className = "palette-input";
    input.placeholder = "Jump to a heading…";
    input.spellcheck = false;
    input.autocomplete = "off";
    input.addEventListener("input", () => {
      visible = score(input!.value);
      selectedIndex = 0;
      render();
    });
    input.addEventListener("keydown", onKeyDown);
    const hint = document.createElement("span");
    hint.className = "palette-hint";
    hint.textContent = "↑↓  ⏎  esc";
    inputRow.append(glyph, input, hint);

    list = document.createElement("ul");
    list.className = "palette-list";
    list.setAttribute("role", "listbox");

    palette.append(inputRow, list);
    backdrop.appendChild(palette);
    root.appendChild(backdrop);
    render();
    setTimeout(() => input?.focus(), 0);
  }

  function close() {
    if (!backdrop) return;
    backdrop.remove();
    backdrop = null;
    input = null;
    list = null;
    visible = [];
    items = [];
  }

  function isOpen() {
    return backdrop !== null;
  }

  function toggle(headings: Heading[], recents: RecentPage[], openUrls?: Set<string>) {
    if (isOpen()) close();
    else open(headings, recents, openUrls);
  }

  return { open, close, toggle, isOpen };
}
