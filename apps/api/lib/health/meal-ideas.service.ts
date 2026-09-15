import { prisma } from "@/lib/prisma";
import { SYSTEM_FOODS } from "@/lib/health/food-catalog-data";
import { ensureSystemFoods } from "@/lib/health/food-catalog.service";
import { getNutritionToday } from "@/lib/health/nutrition.service";
import {
  buildMealIdeas,
  foodMapFromSeed,
  suggestedMealSlot,
  type MealSlot,
} from "@/lib/health/meal-ideas";

const SLOTS = new Set<MealSlot>(["breakfast", "lunch", "snack", "dinner"]);

export function parseMealSlot(value: string | null): MealSlot | null {
  if (!value || !SLOTS.has(value as MealSlot)) return null;
  return value as MealSlot;
}

export async function getMealIdeasForUser(clientUserId: string, requestedSlot?: string | null) {
  await ensureSystemFoods();
  const slot = parseMealSlot(requestedSlot ?? null) ?? suggestedMealSlot();
  const today = await getNutritionToday(clientUserId);
  const remaining = today.remaining;
  if (!today.target || !remaining) {
    return { mealType: slot, remaining: null, done: false, ideas: [] };
  }

  const need = remaining.proteinG;
  const done = need <= 8;
  if (done) {
    return { mealType: slot, remaining, done: true, ideas: [] };
  }

  const built = buildMealIdeas({
    slot,
    remaining,
    foods: foodMapFromSeed(SYSTEM_FOODS),
    take: 3,
  });

  const sourceIds = [...new Set(built.flatMap((idea) => idea.items.map((item) => item.foodId)))];
  const rows = await prisma.foodItem.findMany({
    where: { source: "system", sourceId: { in: sourceIds } },
    select: { id: true, sourceId: true },
  });
  const idBySource = new Map(
    rows.flatMap((row) => (row.sourceId ? [[row.sourceId, row.id] as const] : [])),
  );

  const ideas = built.flatMap((idea) => {
    const items = idea.items.map((item) => {
      const foodItemId = idBySource.get(item.foodId);
      if (!foodItemId) return null;
      return { ...item, foodItemId };
    });
    if (items.some((item) => item == null)) return [];
    return [{
      id: idea.templateId,
      title: idea.title,
      blurb: idea.blurb,
      mealType: slot,
      items: items.filter((item) => item != null),
      totals: idea.totals,
    }];
  });

  return { mealType: slot, remaining, done: false, ideas };
}
