const MEDIA_CACHE = "regen-media-v1";

export function precacheUrls(urls: string[]) {
  const unique = [...new Set(urls.filter((u) => /^https?:\/\//.test(u)))].slice(0, 40);
  if (unique.length === 0) return;

  if (typeof window !== "undefined" && "caches" in window) {
    caches.open(MEDIA_CACHE).then((cache) => {
      unique.forEach((url) => {
        cache.add(url).catch(() => { /* CORS or network */ });
      });
    }).catch(() => { /* ignore */ });
  }

  const sw = typeof navigator !== "undefined" ? navigator.serviceWorker?.controller : null;
  sw?.postMessage({ type: "PRECACHE", urls: unique });
}
