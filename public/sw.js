/* Unstack Learning service worker: web-push display + tap-to-open.
 * Served from /sw.js (scope "/"). Plain script on purpose: no build step,
 * no caching logic in v1 — push only. */

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = typeof data.title === "string" ? data.title : "Unstack Learning";
  // Optional display/behavior overrides come from the backend payload.
  // Anything absent falls back to the platform defaults below.
  const vibrate = Array.isArray(data.vibrate)
    ? data.vibrate.filter((n) => typeof n === "number" && Number.isFinite(n))
    : [];
  const options = {
    body: typeof data.body === "string" ? data.body : "",
    icon: typeof data.icon === "string" ? data.icon : "/icon-192x192.png",
    data: {
      url: typeof data.url === "string" ? data.url : "/notifications",
    },
    ...(vibrate.length > 0 ? { vibrate } : {}),
    ...(typeof data.tag === "string" ? { tag: data.tag } : {}),
    ...(typeof data.renotify === "boolean" ? { renotify: data.renotify } : {}),
    ...(typeof data.requireInteraction === "boolean"
      ? { requireInteraction: data.requireInteraction }
      : {}),
    ...(data.silent === true ? { silent: true } : {}),
    ...(typeof data.image === "string" ? { image: data.image } : {}),
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url =
    event.notification.data && typeof event.notification.data.url === "string"
      ? event.notification.data.url
      : "/notifications";
  event.waitUntil(
    (async () => {
      const windows = await clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of windows) {
        if ("focus" in client) {
          try {
            await client.focus();
          } catch {
            // Focus can fail on some platforms; opening still works below.
          }
          if ("navigate" in client && typeof client.navigate === "function") {
            try {
              await client.navigate(url);
              return;
            } catch {
              // Fall through to openWindow.
            }
          } else {
            return;
          }
        }
      }
      await clients.openWindow(url);
    })(),
  );
});
