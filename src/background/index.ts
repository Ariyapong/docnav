import type { RuntimeMessage } from "../types";

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
