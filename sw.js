// Offline cache for the phone annotator's own files, and nothing else.
// A pack is never cached: only the paths listed here are, so no frame ever
// lands in Cache Storage. Network first, so an update arrives whenever the phone
// is online, with the cache as the fallback when it is not.
// VERSION is replaced by publish_phone.sh with a hash of index.html.
const VERSION = "b97ff7504fac";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-512.png"];
const CACHE = `gait-marks-${VERSION}`;

self.addEventListener("install", ev => {
  ev.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", ev => {
  ev.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", ev => {
  const url = new URL(ev.request.url);
  if (ev.request.method !== "GET" || url.origin !== location.origin) return;
  const scope = new URL(self.registration.scope);
  const rel = url.pathname.startsWith(scope.pathname) ? url.pathname.slice(scope.pathname.length) : null;
  const key = rel === "" ? "./" : rel;
  if (!FILES.includes(key)) return;            // not ours: straight to the network
  ev.respondWith(
    fetch(ev.request).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
      return res;
    }).catch(() => caches.open(CACHE).then(c => c.match(key)))
  );
});
