const CACHE = "kk-v2";
const ASSETS = ["./", "./index.html", "./style.css", "./app.js", "./config.js", "./manifest.webmanifest",
  ...Array.from({ length: 10 }, (_, i) => `./stage-${String(i + 1).padStart(2, "0")}.png`),
  "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Only this site's own files are cached. Account/record traffic to the
  // backend must always go to the network, never to the cache.
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res;
  }).catch(() => hit)));
});
