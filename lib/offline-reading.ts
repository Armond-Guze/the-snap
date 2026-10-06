export const OFFLINE_CACHE = "snap-reading-v1";
export async function readingWorker() {
  if (!("serviceWorker" in navigator) || !("caches" in window))
    throw new Error("Offline reading is not supported on this device.");
  const registration = await navigator.serviceWorker.register("/snap-sw.js", {
    scope: "/",
    updateViaCache: "none",
  });
  await Promise.race([
    navigator.serviceWorker.ready,
    new Promise<never>((_, reject) =>
      setTimeout(
        () =>
          reject(new Error("Offline reader could not start. Please retry.")),
        15000,
      ),
    ),
  ]);
  return registration;
}
export async function downloadStory(href: string) {
  await readingWorker();
  const response = await fetch(
    "/api/reading?slug=" + encodeURIComponent(href.split("/").pop() || ""),
  );
  if (!response.ok)
    throw new Error("This story could not be downloaded. Try again online.");
  const data = await response.json();
  if (!Array.isArray(data.paragraphs) || !data.paragraphs.length)
    throw new Error("A text version is not available for this story.");
  const cache = await caches.open(OFFLINE_CACHE);
  if (!(await cache.match(href)) && (await cache.keys()).length >= 50)
    throw new Error("Offline library is full. Remove a download first.");
  await cache.put(
    href,
    new Response(
      JSON.stringify({ ...data, href, downloadedAt: new Date().toISOString() }),
      { headers: { "Content-Type": "application/json" } },
    ),
  );
}
