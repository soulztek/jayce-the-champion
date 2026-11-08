/* Only this app's path and caches are ever touched. No remote analytics or data sync. */
const PREFIX = "jayce-champion-";
const CACHE = PREFIX + "__VERSION__";
const ROOT = new URL(self.registration.scope);
const ASSETS = __ASSETS__.map((path) => new URL(path, ROOT).href);
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(PREFIX) && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (
    req.method !== "GET" ||
    url.origin !== ROOT.origin ||
    !url.pathname.startsWith(ROOT.pathname)
  )
    return;
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() =>
        caches
          .open(CACHE)
          .then((cache) => cache.match(new URL("index.html", ROOT).href)),
      ),
    );
    return;
  }
  if (!ASSETS.includes(url.href)) return;
  event.respondWith(
    caches
      .open(CACHE)
      .then(async (cache) => (await cache.match(req)) || fetch(req)),
  );
});
