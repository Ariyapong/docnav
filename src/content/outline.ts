import { findCurrentHeading } from "./headings";
import type { Heading } from "../types";

interface OutlineApi {
  show: (headings: Heading[], opts?: { focus?: boolean }) => void;
  hide: () => void;
  toggle: (headings: Heading[]) => void;
  refresh: (headings: Heading[]) => void;
  isVisible: () => boolean;
}

export function createOutline(root: ShadowRoot): OutlineApi {
  let panel: HTMLDivElement | null = null;
  let listEl: HTMLUListElement | null = null;
  let currentHeadings: Heading[] = [];
  let scrollHandler: (() => void) | null = null;
  let selectedIndex = -1; // -1 means "no manual selection yet"

  function jumpTo(h: Heading) {
    history.replaceState(null, "", `#${h.id}`);
    h.el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderList() {
    if (!listEl) return;
    listEl.innerHTML = "";
    if (currentHeadings.length === 0) {
      const empty = document.createElement("li");
      empty.className = "outline-empty";
      empty.textContent = "No headings on this page.";
      listEl.appendChild(empty);
      return;
    }
    currentHeadings.forEach((h, i) => {
      const li = document.createElement("li");
      li.className = "outline-item";
      li.dataset.level = String(h.level);
      li.dataset.id = h.id;
      li.dataset.index = String(i);
      li.title = h.text;
      li.textContent = h.text;
      li.addEventListener("click", () => {
        selectedIndex = i;
        updateSelection();
        jumpTo(h);
      });
      listEl!.appendChild(li);
    });
    updateActive();
    updateSelection();
  }

  function updateActive() {
    if (!listEl || currentHeadings.length === 0) return;
    const active = findCurrentHeading(currentHeadings);
    const items = listEl.querySelectorAll<HTMLLIElement>(".outline-item");
    items.forEach((el) => {
      el.classList.toggle("is-active", active?.id === el.dataset.id);
    });
  }

  function updateSelection() {
    if (!listEl) return;
    const items = listEl.querySelectorAll<HTMLLIElement>(".outline-item");
    items.forEach((el) => {
      const idx = Number(el.dataset.index);
      const sel = idx === selectedIndex;
      el.classList.toggle("is-selected", sel);
      if (sel) el.scrollIntoView({ block: "nearest" });
    });
  }

  function move(delta: number) {
    if (currentHeadings.length === 0) return;
    if (selectedIndex < 0) {
      // First navigation — start from whichever heading is currently visible.
      const active = findCurrentHeading(currentHeadings);
      selectedIndex = active
        ? Math.max(0, currentHeadings.findIndex((h) => h.id === active.id))
        : 0;
    } else {
      selectedIndex =
        (selectedIndex + delta + currentHeadings.length) % currentHeadings.length;
    }
    updateSelection();
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      hide();
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
    if (e.key === "Home") {
      e.preventDefault();
      if (currentHeadings.length > 0) {
        selectedIndex = 0;
        updateSelection();
      }
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      if (currentHeadings.length > 0) {
        selectedIndex = currentHeadings.length - 1;
        updateSelection();
      }
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex < 0) move(0); // initialize selection if not already
      const h = currentHeadings[selectedIndex];
      if (h) {
        jumpTo(h);
        hide();
      }
    }
  }

  function show(headings: Heading[], opts: { focus?: boolean } = {}) {
    currentHeadings = headings;
    if (panel) {
      renderList();
      if (opts.focus) panel.focus();
      return;
    }
    selectedIndex = -1;
    panel = document.createElement("div");
    panel.className = "outline";
    panel.tabIndex = 0;
    panel.setAttribute("role", "listbox");
    panel.setAttribute("aria-label", "Page outline");
    panel.addEventListener("keydown", onKeyDown);

    const header = document.createElement("div");
    header.className = "outline-header";
    const label = document.createElement("span");
    label.textContent = "Outline";
    const hint = document.createElement("span");
    hint.className = "outline-hint";
    hint.textContent = "↑↓ ⏎ esc";
    header.append(label, hint);

    listEl = document.createElement("ul");
    listEl.className = "outline-list";

    panel.append(header, listEl);
    root.appendChild(panel);
    renderList();

    if (opts.focus !== false) {
      // Default to focusing on hotkey-driven open. Document.activeElement
      // restoration is handled by the hide() flow.
      requestAnimationFrame(() => panel?.focus());
    }

    scrollHandler = () => updateActive();
    window.addEventListener("scroll", scrollHandler, { passive: true });
    window.addEventListener("resize", scrollHandler, { passive: true });
  }

  function hide() {
    if (!panel) return;
    panel.remove();
    panel = null;
    listEl = null;
    selectedIndex = -1;
    if (scrollHandler) {
      window.removeEventListener("scroll", scrollHandler);
      window.removeEventListener("resize", scrollHandler);
      scrollHandler = null;
    }
  }

  function toggle(headings: Heading[]) {
    if (panel) hide();
    else show(headings, { focus: true });
  }

  function refresh(headings: Heading[]) {
    currentHeadings = headings;
    if (panel) renderList();
  }

  function isVisible() {
    return panel !== null;
  }

  return { show, hide, toggle, refresh, isVisible };
}
