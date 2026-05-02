# docnav

A Chrome extension that adds a **Cmd+K command palette** and a **sticky outline panel** to any documentation site.

I open MDN, React docs, Next docs, and Tailwind docs about a hundred times a day, and the only thing they have in common is that finding the right heading is annoying. `docnav` makes every page jumpable with one shortcut.

## Features

- **⌘⇧K** — open a fuzzy command palette over every `h1`–`h4` on the page. Type a few letters, press Enter, scroll-snap there.
- **⌘⇧O** — toggle a sticky outline panel that highlights your current section as you scroll.
- **Recent docs** — the last few documentation pages you've visited are surfaced inside the palette and the popup, so you can jump back without remembering the URL.
- **Per-site toggle** — the popup lets you disable docnav on hosts where it's not useful.
- **No DOM pollution** — UI is rendered inside a shadow DOM, so the host page's CSS can't reach it (and vice versa).

## Install (developer mode)

```bash
pnpm install
pnpm build
```

Then in Chrome, Edge or Chromium-based browsers:

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked** and pick the generated `dist/` folder

## Develop

```bash
pnpm dev
```

This runs Vite in extension mode with HMR. After the first run, load `dist/` once via "Load unpacked" — subsequent reloads happen automatically while `pnpm dev` is running.

## Hotkeys

| Shortcut       | Action                          |
| -------------- | ------------------------------- |
| `⌘⇧K` / `Ctrl+Shift+K` | Open the command palette  |
| `⌘⇧O` / `Ctrl+Shift+O` | Toggle the outline panel  |
| `↑` / `↓` / `Ctrl+P` / `Ctrl+N` | Move selection (palette and outline) |
| `Home` / `End` | Jump to first / last heading (outline) |
| `Enter`        | Jump to selected heading        |
| `Esc`          | Close palette / outline         |

Both the palette and outline are keyboard-driven end-to-end. Hover/click work too.

You can rebind the global hotkeys from `chrome://extensions/shortcuts` (also linked from the popup).

## Theme

The popup has a **System / Light / Dark** segmented control. The choice is stored in `chrome.storage.local` and applied live to every open tab via `chrome.storage.onChanged`. "System" follows `prefers-color-scheme`.

## How it works

- A content script runs on every page and extracts visible `h1`–`h4` elements from the most likely "main content" container (`main`, `article`, `[role=main]`, `.markdown-body`, etc., falling back to the document).
- Headings without an `id` get one auto-generated, so the URL stays usable after a jump.
- A `MutationObserver` re-extracts headings (throttled to 400ms) for sites that lazy-load content.
- All UI lives in a shadow root, so we don't have to fight host-page CSS.
- Recent pages are stored in `chrome.storage.local` (capped at 50 entries).

## Layout

```
src/
  manifest.config.ts       MV3 manifest (typed, via @crxjs/vite-plugin)
  types.ts                 shared types
  storage.ts               chrome.storage.local helpers
  background/index.ts      forwards keyboard commands → active tab
  content/
    index.ts               bootstrap, hotkeys, mutation observer
    headings.ts            extract + slugify visible headings
    palette.ts             command-palette UI
    outline.ts             sticky outline panel UI
    fuzzy.ts               tiny subsequence matcher with scoring
    styles.ts              shadow-DOM CSS
  popup/
    index.html · popup.ts · popup.css
public/icons/icon.svg      source icon — `pnpm gen:icons` rebuilds PNGs
scripts/build-icons.mjs    SVG → PNG (16/32/48/128) via sharp
```

## Roadmap

- [ ] Cross-page search ("recent docs" full-text, not just titles)
- [ ] Pin a page to the palette's top section
- [ ] Per-site heading-selector overrides for sites with weird DOM
- [ ] Firefox build (manifest v2 fallback)

## License

MIT
