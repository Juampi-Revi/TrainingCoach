import { addMacros, emptyMacros } from "@/lib/health/macros";

export interface FoodEntryRecord {
  id: string;
  loggedAt: Date;
  text: string | null;
  photoUrl: string | null;
  source: string;
  mealType: string | null;
  quality: string | null;
  macroTags: string[];
  items?: Array<{
    id: string;
    foodItemId: string | null;
    name: string;
    grams: { toString(): string } | number;
    servingLabel: string | null;
    kcal: { toString(): string } | number;
    proteinG: { toString(): string } | number;
    carbsG: { toString(): string } | number;
    fatG: { toString(): string } | number;
    sortOrder: number;
  }>;
  coachComments?: Array<{
    id: string;
    text: string;
    createdAt: Date;
    coach: { id: string; displayName: string | null };
  }>;
}

function n(value: { toString(): string } | number): number {
  return typeof value === "number" ? value : Number(value.toString());
}

export function serializeFoodEntry(entry: FoodEntryRecord) {
  const items = (entry.items ?? []).map((item) => ({
    id: item.id,
    foodItemId: item.foodItemId,
    name: item.name,
    grams: n(item.grams),
    servingLabel: item.servingLabel,
    kcal: n(item.kcal),
    proteinG: n(item.proteinG),
    carbsG: n(item.carbsG),
    fatG: n(item.fatG),
    sortOrder: item.sortOrder,
  }));
  const totals = items.reduce(
    (acc, item) => addMacros(acc, { kcal: item.kcal, proteinG: item.proteinG, carbsG: item.carbsG, fatG: item.fatG }),
    emptyMacros(),
  );
  return {
    id: entry.id,
    loggedAt: entry.loggedAt.toISOString(),
    text: entry.text,
    photoUrl: entry.photoUrl,
    source: entry.source,
    mealType: entry.mealType,
    quality: entry.quality,
    macroTags: entry.macroTags,
    items,
    totals,
    coachComments: (entry.coachComments ?? []).map((c) => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt.toISOString(),
      coach: { id: c.coach.id, name: c.coach.displayName },
    })),
  };
}

export const foodEntryInclude = {
  items: { orderBy: { sortOrder: "asc" as const } },
  coachComments: {
    orderBy: { createdAt: "desc" as const },
    take: 5,
    include: { coach: { select: { id: true, displayName: true } } },
  },
};
