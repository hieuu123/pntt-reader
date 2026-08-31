const SHELL = "pntt-shell-v3";
const CHAPTERS = "pntt-reader-chapters-v3";

const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.webmanifest",
  "./data/index.json",
  "./data/toc-part1.json",
  "./data/toc-part2.json"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(SHELL).then(c => c.addAll(FILES))
  );
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k.startsWith("pntt-shell-") && k !== SHELL)
          .map(k => caches.delete(k))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;

  const path = new URL(e.request.url).pathname;
  const isChapter = /\/data\/part[12]\/\d{4}\.json$/.test(path);

  if (isChapter) {
    e.respondWith(
      caches.open(CHAPTERS).then(async cache => {
        const hit = await cache.match(e.request);
        if (hit) return hit;

        const r = await fetch(e.request);
        if (r.ok) cache.put(e.request, r.clone());

        return r;
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request))
  );
});