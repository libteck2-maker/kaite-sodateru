const CACHE = "kk-v4";
const ASSETS = ["./", "./index.html", "./style.css", "./manifest.webmanifest",
  ...Array.from({ length: 10 }, (_, i) => `./stage-${String(i + 1).padStart(2, "0")}.png`),
  "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Only this site's own files are handled here. Account/record traffic to
  // the backend must always go to the network, never to the cache.
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  // Code and pages: network first, so a stale or broken cached copy can
  // never wedge the app. Images and style: cache first (they never change
  // under the same name).
  const isCode = url.pathname.endsWith(".js") || url.pathname.endsWith(".html") || url.pathname.endsWith("/");
  if (isCode) {
    e.respondWith(fetch(e.request).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res;
    }).catch(() => caches.match(e.request)));
  } else {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return res;
    })));
  }
});
