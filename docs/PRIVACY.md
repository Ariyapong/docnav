# Privacy Policy for docnav

_Last updated: 2026-05-16_

docnav is a Chrome extension that adds a command palette and outline to documentation websites. This document explains what data it touches and what it does with it.

## What docnav stores

docnav stores the following data **locally on your device** using `chrome.storage.local`:

- **Recent docs** — the URL, page title, host, visit timestamp, and heading count for documentation pages you have visited. Capped at 50 entries.
- **Per-site enable/disable** — a list of hostnames where you have toggled docnav off via the popup.
- **Theme preference** — your choice of System / Light / Dark.

This data never leaves your device. docnav has no servers, no analytics, no telemetry, no third-party scripts, and makes no outbound network requests.

## What docnav reads

On every page docnav is enabled on, the content script reads:

- The text and DOM position of heading elements (`h1`, `h2`, `h3`, `h4`).
- The page title (`document.title`) and URL (`location.href`) of the current page.

These are used to populate the in-page command palette and the local "Recent" list. None of this is transmitted anywhere.

## Permissions

- `storage` — used to persist the data described above.
- `activeTab` — used by the background service worker to deliver the keyboard-shortcut command to the active tab.
- `tabs` — used to check whether a "Recent" URL is already open in another tab, so docnav can switch to that tab instead of opening a duplicate.
- Host permission `<all_urls>` — the content script needs to run on every documentation site you visit. The script does nothing unless you invoke a hotkey or have visited the site before.

## Children

docnav is not directed at children under 13 and does not knowingly collect any information from them.

## Changes

If this policy changes, the updated version will be committed to this repository and the `Last updated` date above will change.

## Contact

For questions, open an issue at <https://github.com/Ariyapong/docnav/issues>.
