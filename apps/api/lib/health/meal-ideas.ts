import { scaleMacros } from "@/lib/health/macros";
import type { FoodSeedRow } from "@/lib/health/food-catalog-data";

export type MealSlot = "breakfast" | "lunch" | "snack" | "dinner";

export interface MealIdeaTemplate {
  id: string;
  slot: MealSlot | "any";
  title: string;
  blurb: string;
  items: Array<{ foodId: string; grams: number }>;
}

export interface BuiltMealIdeaItem {
  foodId: string;
  name: string;
  grams: number;
  portionLabel: string;
  servingLabel: string | null;
  servingGrams: number | null;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface BuiltMealIdea {
  templateId: string;
  title: string;
  blurb: string;
  slot: MealSlot | "any";
  items: BuiltMealIdeaItem[];
  totals: { kcal: number; proteinG: number; carbsG: number; fatG: number };
}

export const MEAL_IDEA_TEMPLATES: MealIdeaTemplate[] = [
  { id: "bf-claras-avena", slot: "breakfast", title: "Claras con avena", blurb: "Desayuno de siempre: mucha prote, fácil de armar.", items: [{ foodId: "clara-huevo", grams: 200 }, { foodId: "avena", grams: 40 }, { foodId: "banana", grams: 120 }] },
  { id: "bf-griego-whey", slot: "breakfast", title: "Yogur griego con proteína", blurb: "Rápido y alto en prote si no tenés ganas de cocinar.", items: [{ foodId: "yogurt-griego", grams: 200 }, { foodId: "whey", grams: 30 }, { foodId: "frutilla", grams: 150 }] },
  { id: "bf-huevos-tostadas", slot: "breakfast", title: "Huevos y tostadas de arroz", blurb: "Salado, liviano y rinde bien de mañana.", items: [{ foodId: "huevo", grams: 150 }, { foodId: "tostada-arroz", grams: 18 }, { foodId: "palta", grams: 40 }] },
  { id: "bf-skyr-avena", slot: "breakfast", title: "Skyr con avena", blurb: "Tipo bowl proteico, cremoso y fácil de ajustar.", items: [{ foodId: "skyr", grams: 200 }, { foodId: "avena", grams: 40 }, { foodId: "frutilla", grams: 100 }] },

  { id: "sn-whey-leche", slot: "snack", title: "Shake con banana", blurb: "Merienda de 2 minutos cuando falta prote.", items: [{ foodId: "whey", grams: 30 }, { foodId: "leche-descremada", grams: 250 }, { foodId: "banana", grams: 120 }] },
  { id: "sn-atun-tostadas", slot: "snack", title: "Atún con tostadas de arroz", blurb: "Merienda salada que cierra un hueco grande de prote.", items: [{ foodId: "atun-natural", grams: 120 }, { foodId: "tostada-arroz", grams: 27 }, { foodId: "tomate", grams: 80 }] },
  { id: "sn-huevos-skyr", slot: "snack", title: "Huevos duros y skyr", blurb: "Para llevar o armar en 5 minutos.", items: [{ foodId: "huevo-duro", grams: 100 }, { foodId: "skyr", grams: 150 }] },
  { id: "sn-griego-tostadas", slot: "snack", title: "Yogur y galletas de arroz", blurb: "Más liviana, sirve cuando falta poco.", items: [{ foodId: "yogurt-griego", grams: 200 }, { foodId: "tostada-arroz", grams: 18 }] },

  { id: "lu-pechuga-arroz", slot: "lunch", title: "Pechuga, arroz y brócoli", blurb: "El plato que más fácil cubre un faltante grande de prote.", items: [{ foodId: "pechuga-pollo", grams: 180 }, { foodId: "arroz-blanco", grams: 150 }, { foodId: "brocoli", grams: 90 }] },
  { id: "lu-carne-batata", slot: "lunch", title: "Carne magra con batata", blurb: "Almuerzo completo, prote + carbo de calidad.", items: [{ foodId: "carne-vacuna-magra", grams: 180 }, { foodId: "batata", grams: 130 }, { foodId: "lechuga", grams: 80 }] },
  { id: "lu-atun-quinoa", slot: "lunch", title: "Bowl de atún y quinoa", blurb: "Fresco, rápido y alto en prote.", items: [{ foodId: "atun-natural", grams: 120 }, { foodId: "quinoa-cocida", grams: 185 }, { foodId: "pepino", grams: 100 }] },
  { id: "lu-merluza-papa", slot: "lunch", title: "Merluza con papa", blurb: "Pescado magro si querés bajar un poco las kcal.", items: [{ foodId: "merluza", grams: 200 }, { foodId: "papa-cocida", grams: 150 }, { foodId: "zapallo", grams: 120 }] },
  { id: "lu-lentejas-huevo", slot: "lunch", title: "Lentejas con huevo", blurb: "Opción sin carne, llena y suma prote.", items: [{ foodId: "lentejas-cocidas", grams: 180 }, { foodId: "huevo", grams: 100 }, { foodId: "arroz-blanco", grams: 100 }] },

  { id: "di-pechuga-ensalada", slot: "dinner", title: "Pechuga a la plancha", blurb: "Cena clásica para cerrar 50–70 g de prote.", items: [{ foodId: "pechuga-pollo", grams: 200 }, { foodId: "lechuga", grams: 80 }, { foodId: "tomate", grams: 120 }, { foodId: "tostada-arroz", grams: 18 }] },
  { id: "di-merluza-calabaza", slot: "dinner", title: "Merluza con calabaza", blurb: "Cena liviana, mucha prote y pocas grasas.", items: [{ foodId: "merluza", grams: 220 }, { foodId: "calabaza-horno", grams: 150 }, { foodId: "brocoli", grams: 90 }] },
  { id: "di-atun-huevos", slot: "dinner", title: "Atún con huevos", blurb: "Si no querés prender el horno: lata + sartén.", items: [{ foodId: "atun-natural", grams: 120 }, { foodId: "huevo", grams: 100 }, { foodId: "lechuga", grams: 80 }] },
  { id: "di-carne-zapallito", slot: "dinner", title: "Carne magra y zapallitos", blurb: "Cena de recomp: prote primero, verdura de volumen.", items: [{ foodId: "carne-vacuna-magra", grams: 170 }, { foodId: "zucchini", grams: 150 }, { foodId: "tomate", grams: 120 }] },
  { id: "di-wrap-pollo", slot: "dinner", title: "Wrap de pollo", blurb: "Más cómodo de comer si estás con poco tiempo.", items: [{ foodId: "wrap", grams: 50 }, { foodId: "pechuga-pollo", grams: 150 }, { foodId: "lechuga", grams: 40 }] },
  { id: "di-tofu-quinoa", slot: "dinner", title: "Tofu salteado", blurb: "Cena vegetariana; sumá un extra si todavía falta prote.", items: [{ foodId: "tofu", grams: 200 }, { foodId: "quinoa-cocida", grams: 150 }, { foodId: "brocoli", grams: 90 }] },

  { id: "any-whey", slot: "any", title: "Un scoop extra", blurb: "El atajo más rápido cuando ya comiste y todavía falta prote.", items: [{ foodId: "whey", grams: 30 }] },
  { id: "any-claras", slot: "any", title: "Claras a la plancha", blurb: "Cierre barato y magro, sin armar un plato entero.", items: [{ foodId: "clara-huevo", grams: 200 }] },
  { id: "any-atun", slot: "any", title: "Una lata de atún", blurb: "Directo de la lata si estás apurado.", items: [{ foodId: "atun-natural", grams: 120 }] },
];

export function suggestedMealSlot(date = new Date()): MealSlot {
  const hour = date.getHours();
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 19) return "snack";
  return "dinner";
}

export function foodMapFromSeed(rows: FoodSeedRow[]): Map<string, FoodSeedRow> {
  return new Map(rows.map((row) => [row.id, row]));
}

export function buildMealIdeas(args: {
  slot: MealSlot;
  remaining: { kcal: number; proteinG: number; carbsG: number; fatG: number };
  foods: Map<string, FoodSeedRow>;
  take?: number;
}): BuiltMealIdea[] {
  const need = args.remaining.proteinG;
  if (!Number.isFinite(need) || need <= 8) return [];

  const take = args.take ?? 3;
  const includeSnacks = need < 40 && args.slot !== "snack";
  const scored = MEAL_IDEA_TEMPLATES
    .filter((template) => {
      if (template.slot === args.slot || template.slot === "any") return true;
      return includeSnacks && template.slot === "snack";
    })
    .map((template) => scoreTemplate(template, args.slot, args.remaining, args.foods))
    .filter((row): row is NonNullable<typeof row> => row != null)
    .sort((a, b) => a.score - b.score);

  const picked: BuiltMealIdea[] = [];
  for (const row of scored) {
    if (picked.some((idea) => idea.templateId === row.idea.templateId)) continue;
    picked.push(row.idea);
    if (picked.length >= take) break;
  }
  return picked;
}

function scoreTemplate(
  template: MealIdeaTemplate,
  slot: MealSlot,
  remaining: { kcal: number; proteinG: number; carbsG: number; fatG: number },
  foods: Map<string, FoodSeedRow>,
): { idea: BuiltMealIdea; score: number } | null {
  const base = buildFromGrams(template, 1, foods);
  if (!base || base.totals.proteinG < 8) return null;
  const rawScale = remaining.proteinG / base.totals.proteinG;
  const scale = Math.min(1.8, Math.max(0.55, rawScale));
  const idea = buildFromGrams(template, scale, foods);
  if (!idea) return null;

  const coverage = idea.totals.proteinG / Math.max(remaining.proteinG, 1);
  const proteinMiss = Math.abs(1 - Math.min(coverage, 1.3));
  const kcalRatio = remaining.kcal > 80 ? idea.totals.kcal / remaining.kcal : 1;
  const kcalPenalty = kcalRatio > 1.2 ? (kcalRatio - 1.2) : 0;
  const slotPenalty = template.slot === slot ? 0 : template.slot === "any" ? 0.12 : 0.2;
  return { idea, score: proteinMiss + kcalPenalty + slotPenalty };
}

function buildFromGrams(template: MealIdeaTemplate, scale: number, foods: Map<string, FoodSeedRow>): BuiltMealIdea | null {
  const items: BuiltMealIdeaItem[] = [];
  for (const part of template.items) {
    const food = foods.get(part.foodId);
    if (!food) return null;
    const grams = roundGrams(food, part.grams * scale);
    const macros = scaleMacros({ kcal: food.kcal, proteinG: food.p, carbsG: food.c, fatG: food.f }, grams);
    items.push({
      foodId: food.id,
      name: food.name,
      grams,
      portionLabel: portionLabel(food, grams),
      servingLabel: food.servingLabel ?? null,
      servingGrams: food.servingGrams ?? null,
      kcal: macros.kcal,
      proteinG: macros.proteinG,
      carbsG: macros.carbsG,
      fatG: macros.fatG,
    });
  }
  const totals = items.reduce(
    (acc, item) => ({
      kcal: round1(acc.kcal + item.kcal),
      proteinG: round1(acc.proteinG + item.proteinG),
      carbsG: round1(acc.carbsG + item.carbsG),
      fatG: round1(acc.fatG + item.fatG),
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 },
  );
  return { templateId: template.id, title: template.title, blurb: template.blurb, slot: template.slot, items, totals };
}

export function roundGrams(food: FoodSeedRow, grams: number): number {
  const serving = food.servingGrams;
  if (serving && serving > 0 && serving <= 60) {
    return Math.max(serving, Math.round(grams / serving) * serving);
  }
  return Math.max(20, Math.round(grams / 5) * 5);
}

export function portionLabel(food: FoodSeedRow, grams: number): string {
  const serving = food.servingGrams;
  if (serving && serving > 0) {
    const units = grams / serving;
    if (Math.abs(units - Math.round(units)) < 0.08) {
      const n = Math.round(units);
      const label = food.servingLabel ?? `${serving} g`;
      return n === 1 ? label : `${n} × ${label}`;
    }
  }
  return `${grams} g`;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
