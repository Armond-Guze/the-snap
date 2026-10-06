(async () => {
  const title = document.getElementById("title"),
    status = document.getElementById("status"),
    body = document.getElementById("body");
  const text = (tag, value) => {
    const node = document.createElement(tag);
    node.textContent = value;
    return node;
  };
  try {
    if (!("caches" in window))
      throw new Error("Offline storage is not supported by this browser.");
    const cache = await caches.open("snap-reading-v1");
    const href = new URLSearchParams(location.search).get("story");
    if (href && /^\/articles\/[a-zA-Z0-9_-]+$/.test(href)) {
      const response = await cache.match(href);
      if (!response)
        throw new Error(
          "This story has not been downloaded on this device. Open My Snap online to download it.",
        );
      const story = await response.json();
      title.textContent = story.title;
      status.textContent =
        "Text-only copy downloaded " +
        new Date(story.downloadedAt).toLocaleDateString() +
        ". Images, videos, and live updates need internet.";
      if (story.summary) body.append(text("p", story.summary));
      for (const paragraph of story.paragraphs || [])
        body.append(text("p", paragraph));
    } else {
      const keys = await cache.keys();
      status.textContent = keys.length
        ? "Downloads stay on this device. Browser storage cleanup can remove them."
        : "No downloads yet. Open My Snap online and choose Download text for offline.";
      const list = document.createElement("ul");
      for (const key of keys) {
        const story = await (await cache.match(key)).json();
        const item = document.createElement("li");
        const link = text("a", story.title);
        link.href =
          "/offline-reader.html?story=" + encodeURIComponent(story.href);
        const heading = text("h2", "");
        heading.append(link);
        item.append(heading);
        const remove = text("button", "Remove download");
        remove.addEventListener("click", async () => {
          try {
            await cache.delete(key);
            item.remove();
            status.textContent = "Download removed.";
          } catch {
            status.textContent = "Could not remove download. Please retry.";
          }
        });
        item.append(remove);
        list.append(item);
      }
      body.append(list);
    }
  } catch (error) {
    status.textContent = error.message;
  }
})();
