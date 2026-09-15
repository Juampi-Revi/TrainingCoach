import { describe, expect, it } from "vitest";
import { adjustSplit, calculateMacros, gramsFromSplit, mifflinBmr, scaleMacros, splitFromGrams } from "./macros";
import { parseOffProduct } from "./food-catalog.service";

describe("macros calculator", () => {
  it("uses Mifflin-St Jeor for a male lifter", () => {
    const bmr = mifflinBmr("male", 80, 178, 30);
    expect(Math.round(bmr)).toBe(1768);
    const macros = calculateMacros({
      sex: "male",
      ageYears: 30,
      heightCm: 178,
      weightKg: 80,
      activityLevel: "moderate",
      goal: "maintain",
    });
    expect(macros.calories).toBeGreaterThan(2500);
    expect(macros.proteinG).toBe(144);
    expect(macros.fatG).toBeGreaterThan(60);
    expect(macros.carbsG).toBeGreaterThan(200);
  });

  it("raises protein in a deficit", () => {
    const lose = calculateMacros({
      sex: "female",
      ageYears: 28,
      heightCm: 165,
      weightKg: 62,
      activityLevel: "light",
      goal: "lose",
    });
    const gain = calculateMacros({
      sex: "female",
      ageYears: 28,
      heightCm: 165,
      weightKg: 62,
      activityLevel: "light",
      goal: "gain",
    });
    expect(lose.proteinG).toBeGreaterThan(gain.proteinG);
    expect(lose.calories).toBeLessThan(gain.calories);
  });

  it("rebuilds grams from a custom P/C/F split", () => {
    const grams = gramsFromSplit(2400, { proteinPct: 25, carbsPct: 50, fatPct: 25 });
    expect(grams.proteinG).toBe(150);
    expect(grams.fatG).toBe(67);
    expect(grams.carbsG).toBeGreaterThan(grams.proteinG);
    const roundTrip = splitFromGrams(2400, grams.proteinG, grams.carbsG, grams.fatG);
    expect(roundTrip.carbsPct).toBeGreaterThan(roundTrip.proteinPct);
  });

  it("keeps the split at 100% when raising protein", () => {
    const next = adjustSplit({ proteinPct: 30, carbsPct: 45, fatPct: 25 }, "proteinPct", 40);
    expect(next.proteinPct).toBe(40);
    expect(next.proteinPct + next.carbsPct + next.fatPct).toBe(100);
  });

  it("scales macros by grams", () => {
    expect(scaleMacros({ kcal: 165, proteinG: 31, carbsG: 0, fatG: 3.6 }, 150)).toEqual({
      kcal: 247.5,
      proteinG: 46.5,
      carbsG: 0,
      fatG: 5.4,
    });
  });
});

describe("Open Food Facts parser", () => {
  it("reads Spanish name and per-100g nutriments", () => {
    const parsed = parseOffProduct({
      status: 1,
      product: {
        product_name_es: "Yogur descremado",
        brands: "La Serenísima",
        nutriments: {
          "energy-kcal_100g": 56,
          proteins_100g: 5.7,
          carbohydrates_100g: 7.7,
          fat_100g: 0.2,
        },
        serving_size: "125 g",
        serving_quantity: 125,
      },
    }, "7790742123456");
    expect(parsed?.name).toBe("Yogur descremado");
    expect(parsed?.kcalPer100g).toBe(56);
    expect(parsed?.proteinPer100g).toBe(5.7);
    expect(parsed?.servingGrams).toBe(125);
  });

  it("returns null when the barcode is missing", () => {
    expect(parseOffProduct({ status: 0 }, "000")).toBeNull();
  });
});
