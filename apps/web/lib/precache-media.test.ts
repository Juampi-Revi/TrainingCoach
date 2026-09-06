import { describe, expect, it } from "vitest";
import { normalizePrecacheUrl } from "./precache-media";

describe("normalizePrecacheUrl", () => {
  it("maps YouTube watch URLs to thumbnail CDN", () => {
    expect(normalizePrecacheUrl("https://www.youtube.com/watch?v=TAH8RxOS0VI")).toBe(
      "https://img.youtube.com/vi/TAH8RxOS0VI/mqdefault.jpg",
    );
  });

  it("keeps direct image URLs", () => {
    expect(normalizePrecacheUrl("https://cdn.jsdelivr.net/gh/foo/bar.png")).toBe(
      "https://cdn.jsdelivr.net/gh/foo/bar.png",
    );
  });

  it("rejects non-http URLs", () => {
    expect(normalizePrecacheUrl("/local/path")).toBeNull();
  });
});
