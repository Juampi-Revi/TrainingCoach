const SW = self;

// Cache name
const CACHE_NAME = "regen-app-v1";

// Install event
SW.addEventListener("install", (event) => {
  console.log("[SW] Installing...");
  event.waitUntil(SW.skipWaiting());
});

// Activate event
SW.addEventListener("activate", (event) => {
  console.log("[SW] Activating...");
  event.waitUntil(SW.clients.claim());
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
