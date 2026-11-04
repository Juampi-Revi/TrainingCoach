export type NutrientVector = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export function nutrientsForGrams(per100g: NutrientVector, grams: number): NutrientVector {
  const factor = grams / 100;
  return {
    kcal: round(per100g.kcal * factor, 1),
    proteinG: round(per100g.proteinG * factor, 2),
    carbsG: round(per100g.carbsG * factor, 2),
    fatG: round(per100g.fatG * factor, 2),
  };
}

export function sumNutrients(items: NutrientVector[]): NutrientVector {
  return items.reduce(
    (acc, item) => ({
      kcal: round(acc.kcal + item.kcal, 1),
      proteinG: round(acc.proteinG + item.proteinG, 2),
      carbsG: round(acc.carbsG + item.carbsG, 2),
      fatG: round(acc.fatG + item.fatG, 2),
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
}

export function remainingOf(
  consumed: Pick<NutrientVector, "kcal" | "proteinG">,
  goals: { kcal: number | null; proteinG: number | null },
) {
  return {
    kcal: goals.kcal == null ? null : round(goals.kcal - consumed.kcal, 1),
    proteinG: goals.proteinG == null ? null : round(goals.proteinG - consumed.proteinG, 2),
  };
}

function round(value: number, decimals: number): number {
  const scale = 10 ** decimals;
  return Math.round(value * scale) / scale;
}
