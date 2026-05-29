const CACHE_NAME = "agrovoo-cache-v2"

const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json"
]

self.addEventListener("install", (event) => {
  console.log("Service Worker instalado")

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache)
    })
  )

  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      )
    })
  )

  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  )
})
