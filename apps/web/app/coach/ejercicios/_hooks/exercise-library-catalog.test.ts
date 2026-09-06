import { describe, expect, it } from "vitest";
import { catalogFilterLabel, catalogQueryFlags } from "./exercise-library-catalog";

describe("catalogQueryFlags", () => {
  it("maps catalog filters to API query flags", () => {
    expect(catalogQueryFlags("all")).toEqual({
      basicsOnly: false,
      guideOnly: false,
      mineOnly: false,
      illustratedOnly: false,
    });
    expect(catalogQueryFlags("basic")).toEqual({
      basicsOnly: true,
      guideOnly: false,
      mineOnly: false,
      illustratedOnly: false,
    });
    expect(catalogQueryFlags("guide")).toEqual({
      basicsOnly: false,
      guideOnly: true,
      mineOnly: false,
      illustratedOnly: false,
    });
    expect(catalogQueryFlags("mine")).toEqual({
      basicsOnly: false,
      guideOnly: false,
      mineOnly: true,
      illustratedOnly: false,
    });
    expect(catalogQueryFlags("illustrated")).toEqual({
      basicsOnly: false,
      guideOnly: false,
      mineOnly: false,
      illustratedOnly: true,
    });
  });
});

describe("catalogFilterLabel", () => {
  it("returns Spanish labels for active catalog filters", () => {
    expect(catalogFilterLabel("all")).toBeNull();
    expect(catalogFilterLabel("basic")).toBe("Básicos");
    expect(catalogFilterLabel("guide")).toBe("Guía visual");
    expect(catalogFilterLabel("mine")).toBe("Propios");
    expect(catalogFilterLabel("illustrated")).toBe("Con ilustración");
  });
});
