import { describe, expect, it } from "vitest";
import { parseLoggedPlate } from "./parse-plate";

describe("parseLoggedPlate", () => {
  it("reads the airfryer plate with mixed grams and halves", () => {
    const parsed = parseLoggedPlate(
      "comi 200 gramos de papa, una zanahoria mediana, 250 de pechucga (pesado cruda) medio pimiento verde y media cebolla grande. Todo en la airfryer. Cuantas calorias comi?",
    );
    expect(parsed?.replaceLast).toBe(false);
    expect(parsed?.items).toEqual([
      { query: "papa", grams: 200 },
      { query: "zanahoria" },
      { query: "pechucga", grams: 250 },
      { query: "pimiento", quantity: 0.5 },
      { query: "cebolla", quantity: 0.5 },
    ]);
  });

  it("reads a correction as replaceLast with the ingredients", () => {
    const parsed = parseLoggedPlate(
      "actualiza la ultima comida, fue una tortilla de arroz (arroz integral y 2 huevos y unos 20g de queso muzzarella)",
    );
    expect(parsed?.replaceLast).toBe(true);
    expect(parsed?.items).toEqual([
      { query: "arroz integral" },
      { query: "huevos", quantity: 2 },
      { query: "muzzarella", grams: 20 },
    ]);
  });

  it("ignores a question without foods", () => {
    expect(parseLoggedPlate("cuantas calorias comi hoy?")).toBeNull();
  });
});
