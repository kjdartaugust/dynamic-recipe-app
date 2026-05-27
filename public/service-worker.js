const STATIC_CACHE = "zerowaste-static-v1";
const API_CACHE = "zerowaste-api-v1";
const IMAGE_CACHE = "zerowaste-images-v1";

const STATIC_ASSETS = [
  "/",
  "/dashboard",
  "/fridge",
  "/shopping-list",
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !name.startsWith("zerowaste-"))
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (!url.protocol.startsWith("http")) return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(apiStrategy(request));
    return;
  }

  if (url.hostname.includes("pollinations.ai")) {
    event.respondWith(imageStrategy(request));
    return;
  }

  event.respondWith(staticStrategy(request));
});

async function apiStrategy(request) {
  const cache = await caches.open(API_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => {
      return cached;
    });

  return cached || fetchPromise;
}

async function staticStrategy(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    if (request.mode === "navigate") {
      return cache.match("/dashboard");
    }
    throw error;
  }
}

async function imageStrategy(request) {
  const cache = await caches.open(IMAGE_CACHE);
  const cached = await cache.match(request);

  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(data.title || "ZeroWaste Chef", {
      body: data.body || "You have items expiring soon!",
      icon: data.icon || "/icon-192x192.png",
      badge: data.badge || "/icon-192x192.png",
      tag: data.tag || "expiry-alert",
      actions: data.actions || [
        { action: "open-fridge", title: "View Fridge" },
        { action: "dismiss", title: "Dismiss" },
      ],
      data: data.data || { url: "/fridge" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const url = data.url || "/fridge";

  if (event.action === "dismiss") {
    return;
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      })
  );
});
