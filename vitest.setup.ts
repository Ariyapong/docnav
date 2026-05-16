// Minimal in-memory chrome.* fake — just enough surface for the modules
// under test. Reset between tests via resetChromeStorage().
import { afterEach } from "vitest";

const store = new Map<string, unknown>();

type Keys = string | string[] | Record<string, unknown> | null | undefined;

const fakeStorage = {
  async get(keys: Keys): Promise<Record<string, unknown>> {
    if (keys === null || keys === undefined) {
      return Object.fromEntries(store);
    }
    if (typeof keys === "string") {
      return store.has(keys) ? { [keys]: store.get(keys) } : {};
    }
    if (Array.isArray(keys)) {
      const out: Record<string, unknown> = {};
      for (const k of keys) if (store.has(k)) out[k] = store.get(k);
      return out;
    }
    const out: Record<string, unknown> = { ...keys };
    for (const k of Object.keys(keys)) if (store.has(k)) out[k] = store.get(k);
    return out;
  },
  async set(items: Record<string, unknown>): Promise<void> {
    for (const [k, v] of Object.entries(items)) store.set(k, v);
  },
  async remove(keys: string | string[]): Promise<void> {
    for (const k of Array.isArray(keys) ? keys : [keys]) store.delete(k);
  },
  async clear(): Promise<void> {
    store.clear();
  },
};

const fakeChrome = {
  storage: {
    local: fakeStorage,
    onChanged: { addListener: () => {} },
  },
  runtime: {
    id: "test-extension-id",
    getManifest: () => ({ version: "0.0.0-test" }),
    sendMessage: async () => undefined,
    onMessage: { addListener: () => {} },
  },
  tabs: {
    query: async () => [],
    create: async () => undefined,
    update: async () => undefined,
    sendMessage: async () => undefined,
  },
  windows: {
    update: async () => undefined,
  },
  commands: {
    onCommand: { addListener: () => {} },
  },
};

(globalThis as unknown as { chrome: typeof fakeChrome }).chrome = fakeChrome;

// happy-dom returns zero-sized rects by default, which would make every
// element fail our isVisible() check. Give elements a real-looking size
// unless a test overrides it on the instance.
const defaultRect = (): DOMRect => ({
  top: 0,
  left: 0,
  right: 100,
  bottom: 20,
  width: 100,
  height: 20,
  x: 0,
  y: 0,
  toJSON: () => ({}),
});
Element.prototype.getBoundingClientRect = function () {
  return defaultRect();
};

afterEach(() => {
  store.clear();
});
