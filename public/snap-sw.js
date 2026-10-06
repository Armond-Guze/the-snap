/* Only the standalone public reader shell is cached, never account pages or API responses. */
const SHELL = "snap-reader-shell-v1";
const FILES = ["/offline-reader.html", "/offline-reader.js"];
self.addEventListener("install", (event) =>
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll(FILES))
      .then(() => self.skipWaiting()),
  ),
);
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin)
    return;
  if (FILES.includes(url.pathname))
    event.respondWith(
      caches
        .open(SHELL)
        .then(
          async (cache) =>
            (await cache.match(url.pathname)) || fetch(event.request),
        ),
    );
  else if (event.request.mode === "navigate")
    event.respondWith(
      fetch(event.request).catch(
        async () =>
          (await caches.match("/offline-reader.html")) || Response.error(),
      ),
    );
});
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data?.json() || {};
  } catch {
    /* Always show a visible notification. */
  }
  const href =
    typeof data.href === "string" &&
    /^\/articles\/[a-zA-Z0-9_-]+$/.test(data.href)
      ? data.href
      : "/my-snap";
  event.waitUntil(
    self.registration.showNotification(data.title || "The Snap team update", {
      body: data.body || "New team coverage is available.",
      tag: data.tag || "snap-team",
      data: { href },
    }),
  );
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const href = event.notification.data?.href;
  const path =
    typeof href === "string" && /^\/articles\/[a-zA-Z0-9_-]+$/.test(href)
      ? href
      : "/my-snap";
  event.waitUntil(
    self.clients.openWindow(new URL(path, self.location.origin).href),
  );
});
