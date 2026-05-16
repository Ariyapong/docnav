// Styles live as a string so they can be injected into a shadow root,
// keeping us isolated from the host page's CSS.
//
// Theming: the shadow-host element gets a [data-theme] attribute. When it's
// "system" (or absent), prefers-color-scheme decides. "light" / "dark" force.

export const SHADOW_CSS = `
:host {
  all: initial;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, sans-serif;

  --bg: #fdfaf3;
  --fg: #1f1a14;
  --muted: #6b5f4d;
  --rule: rgba(31, 26, 20, 0.18);
  --rule-soft: rgba(31, 26, 20, 0.1);
  --accent: #a23a14;
  --accent-soft: rgba(162, 58, 20, 0.12);
  --accent-softer: rgba(162, 58, 20, 0.06);
  --backdrop: rgba(15, 15, 20, 0.45);
  --shadow-lg: 0 25px 60px -15px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 12px 24px -10px rgba(0, 0, 0, 0.25);
  --level-3-fg: #4a4137;
  --level-4-fg: #6b5f4d;
}

@media (prefers-color-scheme: dark) {
  :host(:not([data-theme="light"])) {
    --bg: #1b1813;
    --fg: #ece4d2;
    --muted: #9b8f78;
    --rule: rgba(236, 228, 210, 0.18);
    --rule-soft: rgba(236, 228, 210, 0.12);
    --accent: #e88a5c;
    --accent-soft: rgba(232, 138, 92, 0.18);
    --accent-softer: rgba(232, 138, 92, 0.1);
    --level-3-fg: #c5b89e;
    --level-4-fg: #9b8f78;
  }
}

:host([data-theme="dark"]) {
  --bg: #1b1813;
  --fg: #ece4d2;
  --muted: #9b8f78;
  --rule: rgba(236, 228, 210, 0.18);
  --rule-soft: rgba(236, 228, 210, 0.12);
  --accent: #e88a5c;
  --accent-soft: rgba(232, 138, 92, 0.18);
  --accent-softer: rgba(232, 138, 92, 0.1);
  --level-3-fg: #c5b89e;
  --level-4-fg: #9b8f78;
}

* { box-sizing: border-box; }

/* ---------- Palette ---------- */
.palette-backdrop {
  position: fixed;
  inset: 0;
  background: var(--backdrop);
  backdrop-filter: blur(2px);
  z-index: 2147483646;
  display: flex;
  justify-content: center;
  padding-top: 12vh;
  animation: docnav-fade 120ms ease-out;
}
.palette {
  width: min(640px, 92vw);
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
  color: var(--fg);
  border-radius: 10px;
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  border: 1px solid var(--rule);
}
.palette-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--rule-soft);
}
.palette-glyph {
  font-size: 14px;
  color: var(--accent);
  font-weight: 600;
  letter-spacing: 0.05em;
}
.palette-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 16px;
  color: inherit;
  font-family: inherit;
}
.palette-hint {
  font-size: 11px;
  color: var(--muted);
  font-family: ui-monospace, Menlo, monospace;
}
.palette-list {
  list-style: none;
  margin: 0;
  padding: 6px 0;
  overflow-y: auto;
  flex: 1;
}
.palette-section {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
  padding: 10px 16px 4px;
}
.palette-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1.4;
}
.palette-item[aria-selected="true"] {
  background: var(--accent-soft);
}
.palette-item-level {
  width: 22px;
  font-family: ui-monospace, Menlo, monospace;
  font-size: 10px;
  color: var(--muted);
  text-align: center;
  border: 1px solid var(--rule);
  border-radius: 3px;
  padding: 1px 0;
  flex-shrink: 0;
}
.palette-item-text {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.palette-item-text mark {
  background: transparent;
  color: var(--accent);
  font-weight: 600;
}
.palette-item-meta {
  font-size: 11px;
  color: var(--muted);
  font-family: ui-monospace, Menlo, monospace;
  flex-shrink: 0;
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  direction: rtl;
  text-align: right;
}
.palette-item-badge {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--accent);
  background: var(--accent-soft);
  padding: 2px 6px;
  border-radius: 3px;
  flex-shrink: 0;
}
.palette-empty {
  padding: 28px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--muted);
}

/* ---------- Outline ---------- */
.outline {
  position: fixed;
  top: 90px;
  right: 18px;
  width: 240px;
  max-height: calc(100vh - 140px);
  background: var(--bg);
  color: var(--fg);
  border: 1px solid var(--rule);
  border-radius: 8px;
  box-shadow: var(--shadow-md);
  z-index: 2147483645;
  display: flex;
  flex-direction: column;
  font-size: 12px;
  animation: docnav-slide 140ms ease-out;
  outline: none;
}
.outline:focus-visible {
  box-shadow: var(--shadow-md), 0 0 0 2px var(--accent-soft);
}
.outline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--rule-soft);
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--muted);
}
.outline-hint {
  font-family: ui-monospace, Menlo, monospace;
  letter-spacing: 0.04em;
  text-transform: none;
  font-size: 10px;
}
.outline-list {
  list-style: none;
  margin: 0;
  padding: 6px 0;
  overflow-y: auto;
}
.outline-item {
  padding: 4px 12px;
  cursor: pointer;
  line-height: 1.45;
  border-left: 2px solid transparent;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.outline-item[data-level="2"] { padding-left: 22px; }
.outline-item[data-level="3"] { padding-left: 32px; font-size: 11px; color: var(--level-3-fg); }
.outline-item[data-level="4"] { padding-left: 42px; font-size: 11px; color: var(--level-4-fg); }
.outline-item:hover { background: var(--accent-softer); }
.outline-item.is-active {
  border-left-color: var(--accent);
  color: var(--accent);
  background: var(--accent-softer);
}
.outline-item.is-selected {
  background: var(--accent-soft);
  color: var(--accent);
}
.outline-empty {
  padding: 14px 12px;
  color: var(--muted);
  font-style: italic;
}

@keyframes docnav-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes docnav-slide {
  from { opacity: 0; transform: translateX(8px); }
  to { opacity: 1; transform: translateX(0); }
}
`;
