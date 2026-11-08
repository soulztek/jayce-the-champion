/* Only this app's path and caches are ever touched. No remote analytics or data sync. */
const PREFIX = "jayce-champion-";
const CACHE = PREFIX + "2680acb4f277";
const ROOT = new URL(self.registration.scope);
const ASSETS = ["assets/index-BMFyRc91.js","assets/index-Bv_-J2KT.css","demos/crossover-layup-left.gif","demos/crossover-layup-left.png","demos/crossover-layup-right.gif","demos/crossover-layup-right.png","demos/crossover-pullup-left.gif","demos/crossover-pullup-left.png","demos/crossover-pullup-right.gif","demos/crossover-pullup-right.png","demos/crossover-real.gif","demos/crossover-real.png","demos/double-crossover-layup-left.gif","demos/double-crossover-layup-left.png","demos/double-crossover-layup-right.gif","demos/double-crossover-layup-right.png","demos/double-crossover-pullup-left.gif","demos/double-crossover-pullup-left.png","demos/double-crossover-pullup-right.gif","demos/double-crossover-pullup-right.png","demos/form-shot.gif","demos/form-shot.png","demos/in-and-out-layup-left.gif","demos/in-and-out-layup-left.png","demos/in-and-out-layup-right.gif","demos/in-and-out-layup-right.png","demos/in-and-out-pullup-left.gif","demos/in-and-out-pullup-left.png","demos/in-and-out-pullup-right.gif","demos/in-and-out-pullup-right.png","demos/warmup-ankle.gif","demos/warmup-ankle.png","demos/warmup-dribble.gif","demos/warmup-dribble.png","demos/warmup-lateral.gif","demos/warmup-lateral.png","demos/warmup-march.gif","demos/warmup-march.png","demos/warmup-squat.gif","demos/warmup-squat.png","icons/ball.svg","icons/icon-192.png","icons/icon-512.png","icons/maskable-512.png","index.html","manifest.webmanifest"].map((path) => new URL(path, ROOT).href);
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
