// @vitest-environment node
import { it, expect, vi } from "vitest";
import { readFileSync } from "node:fs";
import vm from "node:vm";
function worker() {
  const listeners: Record<string, (e: any) => void> = {};
  const remove = vi.fn(async () => true);
  const respond = vi.fn();
  const match = vi.fn(async () => "offline-shell");
  const cache = { match, addAll: vi.fn(async () => {}) };
  const fetch = vi.fn(async () => {
    throw Error("offline");
  });
  const context = {
    URL,
    self: {
      registration: { scope: "https://example.test/jayce-the-champion/" },
      addEventListener: (name: string, fn: any) => (listeners[name] = fn),
      skipWaiting: vi.fn(),
      clients: { claim: vi.fn() },
    },
    caches: {
      keys: async () => [
        "golf-v1",
        "jayce-champion-old",
        "adhdad-v1",
        "jayce-champion-test",
      ],
      delete: remove,
      open: async () => cache,
    },
    fetch,
  };
  let code = readFileSync("scripts/sw-template.js", "utf8")
    .replace("__VERSION__", "test")
    .replace("__ASSETS__", '["index.html","assets/app.js"]');
  vm.runInNewContext(code, context);
  return { listeners, remove, respond, fetch, cache, match };
}
it("only removes caches with this app’s prefix", async () => {
  const w = worker();
  let pending: Promise<unknown> = Promise.resolve();
  w.listeners.activate({ waitUntil: (p: Promise<unknown>) => (pending = p) });
  await pending;
  expect(w.remove).toHaveBeenCalledExactlyOnceWith("jayce-champion-old");
});
it("ignores unrelated paths, origins and non-GET requests", () => {
  const w = worker();
  for (const [url, method] of [
    ["https://example.test/golf-plan/", "GET"],
    ["https://elsewhere.test/jayce-the-champion/", "GET"],
    ["https://example.test/jayce-the-champion/", "POST"],
  ])
    w.listeners.fetch({
      request: { url, method, mode: "navigate" },
      respondWith: w.respond,
    });
  expect(w.respond).not.toHaveBeenCalled();
});
it("falls back to its own cached shell for offline navigation", async () => {
  const w = worker();
  let pending: Promise<unknown> = Promise.resolve();
  w.listeners.fetch({
    request: {
      url: "https://example.test/jayce-the-champion/",
      method: "GET",
      mode: "navigate",
    },
    respondWith: (p: Promise<unknown>) => (pending = p),
  });
  expect(await pending).toBe("offline-shell");
  expect(w.match).toHaveBeenCalledWith(
    "https://example.test/jayce-the-champion/index.html",
  );
});
it("uses only its own known cached asset, not arbitrary requests", async () => {
  const w = worker();
  let pending: Promise<unknown> = Promise.resolve();
  w.listeners.fetch({
    request: {
      url: "https://example.test/jayce-the-champion/assets/app.js",
      method: "GET",
    },
    respondWith: (p: Promise<unknown>) => (pending = p),
  });
  expect(await pending).toBe("offline-shell");
  expect(w.fetch).not.toHaveBeenCalled();
  w.listeners.fetch({
    request: {
      url: "https://example.test/jayce-the-champion/unknown",
      method: "GET",
    },
    respondWith: w.respond,
  });
  expect(w.respond).not.toHaveBeenCalled();
});
