const MEDIA_CACHE = "regen-media-v1";

function youTubeIdFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1).split("/")[0] || null;
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const embed = u.pathname.match(/\/embed\/([^/?]+)/);
      if (embed?.[1]) return embed[1];
    }
  } catch {
    return null;
  }
  return null;
}

/** Normalize to a CORS-friendly image URL, or null if not precacheable. */
export function normalizePrecacheUrl(url: string): string | null {
  if (!/^https?:\/\//.test(url)) return null;

  const ytId = youTubeIdFromUrl(url);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;

  if (/youtube\.com|youtu\.be/.test(url)) return null;

  return url;
}

export function precacheUrls(urls: string[]) {
  const unique = [...new Set(
    urls
      .map(normalizePrecacheUrl)
      .filter((u): u is string => !!u),
  )].slice(0, 40);

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
