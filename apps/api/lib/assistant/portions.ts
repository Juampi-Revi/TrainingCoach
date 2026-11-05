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

const STANDARD_PORTIONS: Array<{ key: string; grams: number; label: string }> = [
  { key: "arroz con pollo", grams: 320, label: "plato" },
  { key: "pure de papa", grams: 180, label: "porción" },
  { key: "ensalada", grams: 150, label: "plato" },
  { key: "milanesa", grams: 150, label: "unidad" },
  { key: "empanada", grams: 80, label: "unidad" },
  { key: "hamburguesa", grams: 180, label: "unidad" },
  { key: "sandwich", grams: 180, label: "unidad" },
  { key: "medialuna", grams: 50, label: "unidad" },
  { key: "omelette", grams: 120, label: "unidad" },
  { key: "tortilla", grams: 150, label: "porción" },
  { key: "pechuga", grams: 150, label: "porción" },
  { key: "pollo", grams: 150, label: "porción" },
  { key: "carne", grams: 150, label: "porción" },
  { key: "bife", grams: 150, label: "unidad" },
  { key: "salmon", grams: 150, label: "porción" },
  { key: "atun", grams: 120, label: "lata" },
  { key: "merluza", grams: 150, label: "porción" },
  { key: "fideos", grams: 180, label: "plato" },
  { key: "pasta", grams: 180, label: "plato" },
  { key: "arroz", grams: 150, label: "taza" },
  { key: "quinoa", grams: 150, label: "taza" },
  { key: "lentejas", grams: 200, label: "plato" },
  { key: "garbanzos", grams: 160, label: "porción" },
  { key: "papa", grams: 150, label: "unidad" },
  { key: "batata", grams: 150, label: "porción" },
  { key: "manzana", grams: 180, label: "unidad" },
  { key: "banana", grams: 120, label: "unidad" },
  { key: "naranja", grams: 150, label: "unidad" },
  { key: "pera", grams: 160, label: "unidad" },
  { key: "palta", grams: 100, label: "mitad" },
  { key: "tomate", grams: 120, label: "unidad" },
  { key: "huevo", grams: 50, label: "unidad" },
  { key: "yogurt", grams: 150, label: "pote" },
  { key: "yogur", grams: 150, label: "pote" },
  { key: "avena", grams: 40, label: "porción" },
  { key: "granola", grams: 40, label: "porción" },
  { key: "leche", grams: 200, label: "vaso" },
  { key: "queso", grams: 30, label: "porción" },
  { key: "jamon", grams: 40, label: "feta" },
  { key: "pan", grams: 40, label: "feta" },
  { key: "tostada", grams: 30, label: "unidad" },
  { key: "pizza", grams: 150, label: "porción" },
  { key: "wrap", grams: 220, label: "unidad" },
  { key: "fruta", grams: 150, label: "porción" },
];

const FALLBACK_PORTION_GRAMS = 150;

export function standardPortion(name: string): { grams: number; label: string } | null {
  const needle = fold(name);
  if (!needle) return null;
  let best: { grams: number; label: string; len: number } | null = null;
  for (const row of STANDARD_PORTIONS) {
    if (!portionKeyFits(needle, row.key)) continue;
    if (!best || row.key.length > best.len) best = { grams: row.grams, label: row.label, len: row.key.length };
  }
  return best ? { grams: best.grams, label: best.label } : null;
}

export function assumedGrams(foodName: string, quantity: number, unit: string): number | null {
  const folded = fold(cleanServingUnit(unit));
  if (["g", "gr", "gramo", "gramos", "ml", "mililitro", "mililitros"].includes(folded)) return null;
  const std = standardPortion(foodName);
  if (std) return quantity * std.grams;
  if (["unidad", "unidades", "porcion", "porciones", "plato", "platos", "taza", "vaso"].includes(folded)) {
    return quantity * FALLBACK_PORTION_GRAMS;
  }
  return null;
}

export function defaultPlateGrams(query: string, catalogServingGrams: number | null): { grams: number; assumed: boolean } {
  const std = standardPortion(query);
  if (std) return { grams: std.grams, assumed: true };
  if (catalogServingGrams && catalogServingGrams > 1) return { grams: catalogServingGrams, assumed: true };
  return { grams: FALLBACK_PORTION_GRAMS, assumed: true };
}

export function plateItemGrams(
  query: string,
  catalogServingGrams: number | null,
  grams?: number,
  quantity?: number,
): { grams: number; assumed: boolean } {
  if (grams != null) return { grams, assumed: false };
  const one = defaultPlateGrams(query, catalogServingGrams);
  return { grams: one.grams * (quantity ?? 1), assumed: true };
}

export function cleanPlateQuery(query: string): string {
  const simplified = fold(query)
    .replace(/\([^)]*\)/g, " ")
    .replace(/\ba la (plancha|parrilla)\b/g, " ")
    .replace(/\bal horno\b/g, " ")
    .replace(/\b(hervid|cocid|frit|saltead|grillad|crud|pesad)[oa]s?\b/g, " ")
    .replace(/\b(mediana?|medi[oa]|grande|chic[oa]|pequena?|pequeno)\b/g, " ")
    .replace(/\b(verde|roj[oa]|amarill[oa]|blanc[oa]|negr[oa])\b/g, " ")
    .replace(/\bqueso\s+(?=muzzarella|mozzarella|muzza)\b/g, " ")
    .replace(/[.,;:!?]/g, " ")
    .replace(/\b\d+(?:[.,]\d+)?\s*(?:gramos?|gr|g)?\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^de\s+/, "");
  return simplified.length > 2 ? simplified : fold(query);
}

export function pickCatalogFood<T extends { name: string }>(query: string, results: T[]): T | null {
  if (results.length === 0) return null;
  if (results.length === 1) return results[0];
  const needle = fold(query);
  const ranked = results.map((food) => {
    const name = fold(food.name);
    let score = 0;
    if (name === needle) score += 80;
    if (name.startsWith(needle)) score += 30;
    if (name.includes(needle)) score += 12;
    if (/\b(frit|snack|reboz|milanes)/.test(name)) score -= 60;
    if (/\b(cocid|hervid|plancha)\b/.test(name)) score += 16;
    if (/\bpavo\b/.test(name) && !/\bpavo\b/.test(needle)) score -= 25;
    if (/\bpollo\b/.test(name) && !/\bpavo\b/.test(needle)) score += 8;
    score -= Math.min(name.length, 40);
    return { food, score };
  });
  ranked.sort((a, b) => b.score - a.score);
  return ranked[0]?.food ?? null;
}

function portionKeyFits(needle: string, key: string): boolean {
  if (needle === key) return true;
  const tokens = needle.split(/\s+/);
  if (key.includes(" ")) return needle.includes(key);
  return tokens.includes(key);
}
