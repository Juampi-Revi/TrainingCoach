import { describe, expect, it } from "vitest";
import { SYSTEM_FOODS } from "./food-catalog-data";
import { buildMealIdeas, foodMapFromSeed, portionLabel, roundGrams, suggestedMealSlot } from "./meal-ideas";

const foods = foodMapFromSeed(SYSTEM_FOODS);

describe("meal ideas", () => {
  it("suggests dinner plates close to a 60 g protein gap", () => {
    const ideas = buildMealIdeas({
      slot: "dinner",
      remaining: { kcal: 900, proteinG: 60, carbsG: 80, fatG: 30 },
      foods,
    });
    expect(ideas.length).toBeGreaterThanOrEqual(2);
    const best = ideas[0];
    expect(best.totals.proteinG).toBeGreaterThan(45);
    expect(best.totals.proteinG).toBeLessThan(90);
    expect(best.items.length).toBeGreaterThan(1);
  });

  it("uses quicker ideas when only a snack-sized gap remains", () => {
    const ideas = buildMealIdeas({
      slot: "dinner",
      remaining: { kcal: 280, proteinG: 22, carbsG: 20, fatG: 10 },
      foods,
    });
    expect(ideas.length).toBeGreaterThan(0);
    expect(ideas.some((idea) => idea.slot === "snack" || idea.slot === "any" || idea.totals.kcal < 500)).toBe(true);
  });

  it("returns nothing when protein is already covered", () => {
    expect(buildMealIdeas({
      slot: "lunch",
      remaining: { kcal: 400, proteinG: 4, carbsG: 40, fatG: 10 },
      foods,
    })).toEqual([]);
  });

  it("keeps rice cakes in whole units", () => {
    const cake = foods.get("tostada-arroz");
    expect(cake).toBeTruthy();
    if (!cake) return;
    expect(roundGrams(cake, 20)).toBe(18);
    expect(portionLabel(cake, 18)).toContain("2");
  });

  it("maps late hours to dinner", () => {
    expect(suggestedMealSlot(new Date(2026, 8, 15, 21))).toBe("dinner");
    expect(suggestedMealSlot(new Date(2026, 8, 15, 8))).toBe("breakfast");
  });
});
