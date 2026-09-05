import { describe, expect, it } from "vitest";
import {
  getWorkoutGuideFrameUrls,
  resolveExerciseIllustration,
  resolveWorkoutGuideSlug,
} from "./index";

describe("resolveWorkoutGuideSlug", () => {
  it("maps regen basic source ids", () => {
    expect(resolveWorkoutGuideSlug({ source: "regen_basic_v1", sourceId: "push_up" })).toBe("push-up");
    expect(resolveWorkoutGuideSlug({ source: "regen_basic_v1", sourceId: "deadlift" })).toBe("deadlift");
  });

  it("returns null for unknown exercises", () => {
    expect(resolveWorkoutGuideSlug({ source: "custom", sourceId: "not-real" })).toBeNull();
  });
});

describe("resolveExerciseIllustration", () => {
  it("prefers uploaded media over guide assets", () => {
    const result = resolveExerciseIllustration({
      source: "regen_basic_v1",
      sourceId: "push_up",
      thumbnailUrl: "https://cdn.example.com/coach.jpg",
      media: [{ mediaType: "image", url: "https://cdn.example.com/hero.jpg" }],
    });
    expect(result).toEqual({ url: "https://cdn.example.com/hero.jpg", kind: "media" });
  });

  it("falls back to workout guide for basic exercises", () => {
    const result = resolveExerciseIllustration({
      source: "regen_basic_v1",
      sourceId: "push_up",
    });
    expect(result?.kind).toBe("guide");
    expect(result?.url).toContain("push-up");
    expect(result?.slug).toBe("push-up");
  });
});

describe("getWorkoutGuideFrameUrls", () => {
  it("returns three frame urls", () => {
    const urls = getWorkoutGuideFrameUrls("push-up");
    expect(urls).toHaveLength(3);
    expect(urls[0]).toContain("frame-1");
    expect(urls[2]).toContain("frame-3");
  });
});
