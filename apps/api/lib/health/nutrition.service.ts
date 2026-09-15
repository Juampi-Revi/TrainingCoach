import { prisma } from "@/lib/prisma";
import {
  calculateMacros,
  remainingMacros,
  emptyMacros,
  addMacros,
  type ActivityLevel,
  type BiologicalSex,
  type NutritionGoal,
} from "@/lib/health/macros";
import { getFoodById, macrosForGrams } from "@/lib/health/food-catalog.service";
import { serializeFoodEntry, type FoodEntryRecord } from "@/lib/health/food-log.mapper";

const SEX = new Set(["male", "female"]);
const ACTIVITY = new Set(["sedentary", "light", "moderate", "very", "extra"]);
const GOAL = new Set(["lose", "maintain", "gain"]);

export async function getNutritionProfile(clientUserId: string) {
  const [user, latestWeight] = await Promise.all([
    prisma.user.findUnique({
      where: { id: clientUserId },
      select: { sex: true, birthYear: true, heightCm: true, activityLevel: true },
    }),
    prisma.bodyMetricEntry.findFirst({
      where: { clientUserId, weightKg: { not: null } },
      orderBy: { measuredAt: "desc" },
      select: { weightKg: true },
    }),
  ]);
  return {
    sex: (user?.sex as BiologicalSex | null) ?? null,
    birthYear: user?.birthYear ?? null,
    heightCm: user?.heightCm != null ? Number(user.heightCm) : null,
    activityLevel: (user?.activityLevel as ActivityLevel | null) ?? null,
    weightKg: latestWeight?.weightKg != null ? Number(latestWeight.weightKg) : null,
  };
}

export async function saveNutritionProfile(clientUserId: string, body: {
  sex?: string | null;
  birthYear?: number | null;
  heightCm?: number | null;
  activityLevel?: string | null;
  weightKg?: number | null;
}) {
  const data: {
    sex?: string | null;
    birthYear?: number | null;
    heightCm?: number | null;
    activityLevel?: string | null;
  } = {};
  if (body.sex !== undefined) {
    if (body.sex != null && !SEX.has(body.sex)) return { error: "Sexo inválido" };
    data.sex = body.sex;
  }
  if (body.birthYear !== undefined) {
    if (body.birthYear != null && (body.birthYear < 1930 || body.birthYear > new Date().getFullYear() - 10)) {
      return { error: "Año de nacimiento inválido" };
    }
    data.birthYear = body.birthYear;
  }
  if (body.heightCm !== undefined) {
    if (body.heightCm != null && (body.heightCm < 120 || body.heightCm > 230)) {
      return { error: "Altura inválida" };
    }
    data.heightCm = body.heightCm;
  }
  if (body.activityLevel !== undefined) {
    if (body.activityLevel != null && !ACTIVITY.has(body.activityLevel)) return { error: "Actividad inválida" };
    data.activityLevel = body.activityLevel;
  }

  if (Object.keys(data).length > 0) {
    await prisma.user.update({ where: { id: clientUserId }, data });
  }
  if (body.weightKg != null) {
    const weightError = await upsertTodayWeight(clientUserId, body.weightKg);
    if (weightError) return weightError;
  }
  return getNutritionProfile(clientUserId);
}

async function upsertTodayWeight(clientUserId: string, weightKg: number): Promise<{ error: string } | null> {
  if (!Number.isFinite(weightKg) || weightKg < 30 || weightKg > 300) {
    return { error: "Peso inválido" };
  }
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const existing = await prisma.bodyMetricEntry.findFirst({
    where: { clientUserId, measuredAt: { gte: start, lt: end } },
    orderBy: { measuredAt: "desc" },
  });
  if (existing) {
    await prisma.bodyMetricEntry.update({ where: { id: existing.id }, data: { weightKg } });
  } else {
    await prisma.bodyMetricEntry.create({
      data: { clientUserId, measuredAt: start, weightKg, shareWithCoach: true },
    });
  }
  return null;
}

export async function getNutritionTarget(clientUserId: string) {
  const row = await prisma.nutritionTarget.findUnique({ where: { clientUserId } });
  if (!row) return null;
  return {
    calories: row.calories,
    proteinG: row.proteinG,
    carbsG: row.carbsG,
    fatG: row.fatG,
    goal: row.goal as NutritionGoal,
    proteinPerKg: Number(row.proteinPerKg),
    activityLevel: (row.activityLevel as ActivityLevel | null) ?? null,
    updatedByRole: row.updatedByRole as "coach" | "client",
    updatedAt: row.updatedAt.toISOString(),
    notes: row.notes,
  };
}

export async function upsertNutritionTarget(args: {
  clientUserId: string;
  actorUserId: string;
  actorRole: "coach" | "client";
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  goal: string;
  proteinPerKg: number;
  activityLevel?: string | null;
  notes?: string | null;
}) {
  if (!GOAL.has(args.goal)) return { error: "Objetivo inválido" };
  if (args.calories < 1000 || args.calories > 6000) return { error: "Calorías fuera de rango" };
  if (args.proteinG < 30 || args.carbsG < 0 || args.fatG < 20) return { error: "Macros inválidos" };

  const row = await prisma.nutritionTarget.upsert({
    where: { clientUserId: args.clientUserId },
    update: {
      calories: Math.round(args.calories),
      proteinG: Math.round(args.proteinG),
      carbsG: Math.round(args.carbsG),
      fatG: Math.round(args.fatG),
      goal: args.goal,
      proteinPerKg: args.proteinPerKg,
      activityLevel: args.activityLevel ?? null,
      updatedByRole: args.actorRole,
      updatedByUserId: args.actorUserId,
      notes: args.notes ?? null,
    },
    create: {
      clientUserId: args.clientUserId,
      calories: Math.round(args.calories),
      proteinG: Math.round(args.proteinG),
      carbsG: Math.round(args.carbsG),
      fatG: Math.round(args.fatG),
      goal: args.goal,
      proteinPerKg: args.proteinPerKg,
      activityLevel: args.activityLevel ?? null,
      updatedByRole: args.actorRole,
      updatedByUserId: args.actorUserId,
      notes: args.notes ?? null,
    },
  });

  return {
    calories: row.calories,
    proteinG: row.proteinG,
    carbsG: row.carbsG,
    fatG: row.fatG,
    goal: row.goal as NutritionGoal,
    proteinPerKg: Number(row.proteinPerKg),
    activityLevel: (row.activityLevel as ActivityLevel | null) ?? null,
    updatedByRole: row.updatedByRole as "coach" | "client",
    updatedAt: row.updatedAt.toISOString(),
    notes: row.notes,
  };
}

export function previewMacros(input: {
  sex: BiologicalSex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: NutritionGoal;
  proteinPerKg?: number;
}) {
  return calculateMacros(input);
}

export async function getNutritionToday(clientUserId: string, day = new Date()) {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const [profile, target, meals] = await Promise.all([
    getNutritionProfile(clientUserId),
    getNutritionTarget(clientUserId),
    prisma.foodLogEntry.findMany({
      where: { clientUserId, loggedAt: { gte: start, lt: end } },
      orderBy: { loggedAt: "asc" },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        coachComments: {
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { coach: { select: { id: true, displayName: true } } },
        },
      },
    }),
  ]);

  const serialized = meals.map((m) => serializeFoodEntry(m as FoodEntryRecord));
  const consumed = serialized.reduce((acc, meal) => addMacros(acc, meal.totals), emptyMacros());
  return {
    profile,
    target,
    consumed,
    remaining: target ? remainingMacros(target, consumed) : null,
    meals: serialized,
  };
}

export async function buildLogItems(rawItems: unknown[]) {
  const items: Array<{
    foodItemId: string | null;
    name: string;
    grams: number;
    servingLabel: string | null;
    kcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    sortOrder: number;
  }> = [];

  for (let i = 0; i < rawItems.length; i += 1) {
    const row = rawItems[i];
    if (!row || typeof row !== "object") continue;
    const body = row as Record<string, unknown>;
    const grams = Number(body.grams);
    if (!Number.isFinite(grams) || grams <= 0 || grams > 5000) continue;
    const foodItemId = typeof body.foodItemId === "string" ? body.foodItemId : null;
    const catalog = foodItemId ? await getFoodById(foodItemId) : null;
    const scaled = catalog
      ? macrosForGrams(catalog, grams)
      : {
          kcal: Number(body.kcal) || 0,
          proteinG: Number(body.proteinG) || 0,
          carbsG: Number(body.carbsG) || 0,
          fatG: Number(body.fatG) || 0,
        };
    const name = (typeof body.name === "string" && body.name.trim())
      ? body.name.trim()
      : catalog?.name ?? "Alimento";
    items.push({
      foodItemId: catalog?.id ?? null,
      name,
      grams,
      servingLabel: typeof body.servingLabel === "string" ? body.servingLabel : catalog?.servingLabel ?? null,
      kcal: scaled.kcal,
      proteinG: scaled.proteinG,
      carbsG: scaled.carbsG,
      fatG: scaled.fatG,
      sortOrder: i,
    });
  }
  return items;
}
