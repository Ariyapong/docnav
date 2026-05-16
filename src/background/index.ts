import type { RuntimeMessage } from "../types";

function normalizeUrl(raw: string): string | null {
  try {
    const u = new URL(raw);
    return u.origin + u.pathname + u.search;
  } catch {
    return null;
  }
}

function sameLocation(a: string, b: string): boolean {
  const na = normalizeUrl(a);
  const nb = normalizeUrl(b);
  return na !== null && na === nb;
}

async function listOpenTabUrls(): Promise<string[]> {
  const tabs = await chrome.tabs.query({});
  const out: string[] = [];
  for (const t of tabs) {
    if (!t.url) continue;
    const n = normalizeUrl(t.url);
    if (n) out.push(n);
  }
  return out;
}

async function openOrFocusRecent(url: string): Promise<void> {
  const tabs = await chrome.tabs.query({});
  const match = tabs.find((t) => t.url && sameLocation(t.url, url));
  if (match?.id != null) {
    await chrome.tabs.update(match.id, { active: true });
    if (match.windowId != null) {
      await chrome.windows.update(match.windowId, { focused: true });
    }
    return;
  }
  await chrome.tabs.create({ url });
}

// Forward keyboard commands to the active tab's content script.
chrome.commands.onCommand.addListener(async (command) => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) return;
  const message: RuntimeMessage | null =
    command === "open-palette"
      ? { type: "open-palette" }
      : command === "toggle-outline"
        ? { type: "toggle-outline" }
        : null;
  if (!message) return;
  try {
    await chrome.tabs.sendMessage(tab.id, message);
  } catch {
    // Content script not loaded on this tab (e.g. chrome:// pages). Ignore.
  }
});

chrome.runtime.onMessage.addListener((message: RuntimeMessage, _sender, sendResponse) => {
  if (message.type === "open-recent") {
    void openOrFocusRecent(message.url).then(() => sendResponse({ ok: true }));
    return true; // keep the channel open for the async response
  }
  if (message.type === "list-open-tab-urls") {
    void listOpenTabUrls().then((urls) => sendResponse({ urls }));
    return true;
  }
  return false;
});
