import { describe, expect, it } from "vitest";
import { assumedGrams, defaultPlateGrams, standardPortion } from "./portions";

describe("standard portions", () => {
  it("matches a common food by token", () => {
    expect(standardPortion("Manzana")).toEqual({ grams: 180, label: "unidad" });
    expect(standardPortion("pechuga de pollo")).toEqual({ grams: 150, label: "porción" });
    expect(standardPortion("fideos con tuco")).toEqual({ grams: 180, label: "plato" });
  });

  it("does not treat empanada as pan", () => {
    expect(standardPortion("empanada de carne")?.label).toBe("unidad");
    expect(standardPortion("empanada de carne")?.grams).toBe(80);
  });

  it("assumes grams only when the unit is not already grams", () => {
    expect(assumedGrams("manzana", 1, "unidad")).toBe(180);
    expect(assumedGrams("manzana", 2, "porción")).toBe(360);
    expect(assumedGrams("manzana", 180, "g")).toBeNull();
  });

  it("fills a plate with a standard portion when grams are omitted", () => {
    expect(defaultPlateGrams("arroz", 1)).toEqual({ grams: 150, assumed: true });
    expect(defaultPlateGrams("algo raro", 90)).toEqual({ grams: 90, assumed: true });
    expect(defaultPlateGrams("algo raro", null)).toEqual({ grams: 150, assumed: true });
  });
});
