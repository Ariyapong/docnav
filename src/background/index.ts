import type { RuntimeMessage } from "../types";

function sameLocation(a: string, b: string): boolean {
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    return ua.host === ub.host && ua.pathname === ub.pathname && ua.search === ub.search;
  } catch {
    return false;
  }
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
  return false;
});
