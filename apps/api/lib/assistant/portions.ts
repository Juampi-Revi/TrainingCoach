const DRINK_MILLILITERS: Record<string, number> = {
  vaso: 250,
  "vaso chico": 200,
  "vaso grande": 400,
  taza: 200,
  botella: 500,
  "medio litro": 500,
  litro: 1000,
  termo: 1000,
  mate: 200,
  unidad: 200,
};

export function millilitersForUnit(quantity: number, unit: string): number | null {
  const folded = fold(cleanServingUnit(unit));
  if (["ml", "mililitro", "mililitros"].includes(folded)) return quantity;
  const each = DRINK_MILLILITERS[folded];
  return each === undefined ? null : quantity * each;
}

export function cleanServingUnit(unit: string): string {
  const trimmed = unit.trim();
  const stripped = trimmed.replace(/^(?:1(?:[.,]0*)?)\s+/i, "").trim();
  return stripped || trimmed;
}

export function gramsFor(
  servingLabel: string | null,
  servingGrams: number | null,
  quantity: number,
  unit: string,
): number | null {
  const folded = fold(cleanServingUnit(unit));
  if (["g", "gr", "gramo", "gramos", "ml", "mililitro", "mililitros"].includes(folded)) return quantity;
  if (servingGrams != null && servingLabel && fold(cleanServingUnit(servingLabel)) === folded) {
    return quantity * servingGrams;
  }
  if (servingGrams != null && ["unidad", "unidades", "scoop", "scoops", "porcion", "porciones"].includes(folded)) {
    return quantity * servingGrams;
  }
  return null;
}

export function volumeFor(
  servingLabel: string | null,
  servingGrams: number | null,
  quantity: number,
  unit: string,
): number | null {
  return gramsFor(servingLabel, servingGrams, quantity, unit)
    ?? millilitersForUnit(quantity, unit)
    ?? gramsFor(servingLabel, servingGrams, quantity, "unidad");
}

export function fold(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase().trim();
}
