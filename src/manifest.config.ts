import { defineManifest } from "@crxjs/vite-plugin";
import pkg from "../package.json" with { type: "json" };

export default defineManifest({
  manifest_version: 3,
  name: "docnav",
  description: pkg.description,
  version: pkg.version,
  icons: {
    16: "icons/icon-16.png",
    32: "icons/icon-32.png",
    48: "icons/icon-48.png",
    128: "icons/icon-128.png",
  },
  action: {
    default_popup: "src/popup/index.html",
    default_title: "docnav",
    default_icon: {
      16: "icons/icon-16.png",
      32: "icons/icon-32.png",
    },
  },
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["<all_urls>"],
      js: ["src/content/index.ts"],
      run_at: "document_idle",
    },
  ],
  permissions: ["storage", "activeTab"],
  commands: {
    "open-palette": {
      suggested_key: { default: "Ctrl+Shift+K", mac: "Command+Shift+K" },
      description: "Open the docnav command palette on the active page.",
    },
    "toggle-outline": {
      suggested_key: { default: "Ctrl+Shift+O", mac: "Command+Shift+O" },
      description: "Toggle the sticky outline panel on the active page.",
    },
  },
});
