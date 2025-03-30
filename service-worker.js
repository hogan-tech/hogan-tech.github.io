const CACHE_NAME = "tap-game-cache-v1";
const urlsToCache = [
  "./",
  "./index.html",
  "./index.js",
  "./manifest.json",
  "./images/duck_normal.png",
  "./images/icon-192.png",
  "./images/icon-512.png",
  "https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
});
