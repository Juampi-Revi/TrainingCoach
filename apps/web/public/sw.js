const SW = self;

const CACHE_NAME = "regen-app-v1";
const MEDIA_CACHE = "regen-media-v1";

SW.addEventListener("install", (event) => {
  event.waitUntil(SW.skipWaiting());
});

SW.addEventListener("activate", (event) => {
  event.waitUntil(SW.clients.claim());
});

SW.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "PRECACHE" || !Array.isArray(data.urls)) return;
  event.waitUntil(
    caches.open(MEDIA_CACHE).then((cache) =>
      Promise.all(data.urls.map((url) => cache.add(url).catch(() => undefined))),
    ),
  );
});

SW.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const dest = req.destination;
  if (dest !== "image" && dest !== "video") return;

  event.respondWith(
    caches.open(MEDIA_CACHE).then(async (cache) => {
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone()).catch(() => undefined);
      return res;
    }),
  );
});

// Push notification event
SW.addEventListener("push", (event) => {
  console.log("[SW] Push received:", event);

  let data = {};

  try {
    data = event.data?.json() || {};
  } catch (e) {
    console.error("[SW] Failed to parse push data:", e);
  }

  const title = data.notification?.title || "Nueva notificación";
  const options = {
    body: data.notification?.body || "",
    icon: data.notification?.icon || "/icon-192x192.png",
    badge: data.notification?.badge || "/icon-192x192.png",
    tag: data.notification?.tag || "default",
    requireInteraction: false,
    data: data.notification?.data || {},
  };

  event.waitUntil(
    SW.registration.showNotification(title, options)
  );
});

// Notification click event
SW.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event);

  event.notification.close();

  const data = event.notification.data;
  const urlToOpen = data?.url || "/panel";

  event.waitUntil(
    SW.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Check if there's already a window open
        for (const client of windowClients) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        // Open new window if none exists
        if (SW.clients.openWindow) {
          return SW.clients.openWindow(urlToOpen);
        }
      })
  );
});
