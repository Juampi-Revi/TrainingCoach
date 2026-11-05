import { describe, expect, it } from "vitest";
import { assumedGrams, cleanPlateQuery, defaultPlateGrams, pickCatalogFood, plateItemGrams, standardPortion } from "./portions";

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

  it("drops size, color and amounts from a plate query", () => {
    expect(cleanPlateQuery("zanahoria mediana")).toBe("zanahoria");
    expect(cleanPlateQuery("cebolla grande")).toBe("cebolla");
    expect(cleanPlateQuery("pimiento verde")).toBe("pimiento");
    expect(cleanPlateQuery("pechuga a la plancha")).toBe("pechuga");
    expect(cleanPlateQuery("arroz integral cocido")).toBe("arroz integral");
    expect(cleanPlateQuery("2 huevos")).toBe("huevos");
    expect(cleanPlateQuery("20 g de muzzarella")).toBe("muzzarella");
  });

  it("multiplies a standard portion when quantity is given", () => {
    expect(plateItemGrams("huevo", 50, undefined, 2)).toEqual({ grams: 100, assumed: true });
    expect(plateItemGrams("arroz integral", 150, 200, undefined)).toEqual({ grams: 200, assumed: false });
  });

  it("picks the plain cooked food over fries or turkey", () => {
    expect(pickCatalogFood("papa", [
      { name: "Papas fritas" },
      { name: "Papa cocida" },
      { name: "Papas snack" },
    ])?.name).toBe("Papa cocida");
    expect(pickCatalogFood("pechuga", [
      { name: "Pechuga de pavo" },
      { name: "Pechuga de pollo" },
    ])?.name).toBe("Pechuga de pollo");
  });
});
