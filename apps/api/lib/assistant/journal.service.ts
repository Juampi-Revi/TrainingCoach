import { prisma } from "@/lib/prisma";
import { getFoodById, searchFoodsMany as catalogSearchMany } from "@/lib/health/food-catalog.service";
import { getNutritionProfile, getNutritionTarget } from "@/lib/health/nutrition.service";
import {
  argentinaDateTime,
  asDate,
  calendarMonthKey,
  eachDate,
  isoOf,
  localDate,
  localMidnight,
  monthBounds,
  weekBounds,
  weekdayLabel,
} from "./calendar";
import { nutrientsForGrams, remainingOf, sumNutrients, type NutrientVector } from "./nutrients";
import { assumedGrams, cleanPlateQuery, cleanServingUnit, defaultPlateGrams, gramsFor, millilitersForUnit, pickCatalogFood, volumeFor } from "./portions";
import { localHour, shouldRemindAt } from "./supplement-windows";

function n(value: { toString(): string } | number | null | undefined): number {
  if (value == null) return 0;
  return typeof value === "number" ? value : Number(value.toString());
}

export function today(): string {
  return localDate(new Date());
}

export function monthKey(): string {
  return calendarMonthKey(new Date());
}

export async function day(userId: string, isoDate: string) {
  const date = asDate(isoDate);
  const [meals, drinks, target, supplements] = await Promise.all([
    prisma.foodLogEntry.findMany({
      where: { clientUserId: userId, deletedAt: null, localDate: date },
      include: { items: { orderBy: { sortOrder: "asc" } } },
      orderBy: { loggedAt: "asc" },
    }),
    prisma.nutritionDrink.findMany({
      where: { clientUserId: userId, deletedAt: null, localDate: date },
      orderBy: { consumedAt: "asc" },
    }),
    getNutritionTarget(userId),
    prisma.nutritionSupplement.findMany({
      where: { clientUserId: userId, active: true },
      include: { logs: { where: { localDate: date } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const mealViews = meals.map((meal) => ({
    id: meal.id,
    note: meal.text,
    consumedAt: meal.loggedAt.toISOString(),
    items: meal.items.map((item) => ({
      id: item.id,
      displayName: item.name,
      quantity: n(item.quantity) || n(item.grams),
      unit: cleanServingUnit(item.unit ?? item.servingLabel ?? "g"),
      grams: n(item.grams),
      kcal: n(item.kcal),
      proteinG: n(item.proteinG),
      carbsG: n(item.carbsG),
      fatG: n(item.fatG),
      provenance: item.provenance ?? "catalog",
    })),
  }));
  const drinkViews = drinks.map(drinkView);
  const consumed = sumNutrients([
    ...mealViews.flatMap((meal) => meal.items.map((item) => ({
      kcal: item.kcal, proteinG: item.proteinG, carbsG: item.carbsG, fatG: item.fatG,
    }))),
    ...drinkViews.map((drink) => ({ kcal: drink.kcal, proteinG: 0, carbsG: 0, fatG: 0 })),
  ]);
  const goalValues = {
    kcal: target?.calories ?? null,
    proteinG: target?.proteinG ?? null,
    carbsG: target?.carbsG ?? null,
    fatG: target?.fatG ?? null,
  };

  return {
    localDate: isoDate,
    consumed,
    goals: goalValues,
    remaining: remainingOf(consumed, goalValues),
    liquidsMl: drinkViews.reduce((sum, drink) => sum + drink.milliliters, 0),
    meals: mealViews,
    drinks: drinkViews,
    supplements: supplements.map((supplement) => ({
      id: supplement.id,
      name: supplement.name,
      timeOfDay: supplement.timeOfDay,
      note: supplement.note,
      status: supplement.logs[0]?.status ?? null,
    })),
  };
}

export async function searchFoods(userId: string, queries: string[]) {
  const matches = await catalogSearchMany(queries, userId, 8);
  return {
    matches: matches.map((row) => ({
      query: row.query,
      results: row.results.map((food) => ({
        id: food.id,
        name: food.name,
        provenance: food.source === "custom" ? "user_defined" : "verified",
        servings: food.servingGrams
          ? [{ label: cleanServingUnit(food.servingLabel ?? "unidad"), grams: food.servingGrams }]
          : [{ label: "g", grams: 1 }],
      })),
    })),
  };
}

export async function logMeal(
  userId: string,
  input: {
    localDate?: string;
    note?: string;
    items: Array<
      | { kind: "catalog"; foodId: string; quantity: number; unit: string }
      | {
          kind: "estimated";
          displayName: string;
          grams: number;
          quantity?: number;
          unit?: string;
          per100g: { kcalPer100g: number; proteinPer100g: number; carbsPer100g: number; fatPer100g: number };
        }
    >;
  },
) {
  const isoDate = input.localDate ?? today();
  const lines = [];
  for (const item of input.items) {
    if (item.kind === "catalog") {
      const food = await getFoodById(item.foodId);
      if (!food) return { error: "food_not_found" as const };
      const unit = cleanServingUnit(item.unit);
      const catalogGrams = gramsFor(food.servingLabel, food.servingGrams, item.quantity, unit);
      const grams = catalogGrams ?? assumedGrams(food.name, item.quantity, unit);
      if (grams === null) return { error: "serving_not_found" as const };
      const usedStandard = catalogGrams == null;
      lines.push(lineFrom(
        item.quantity,
        unit,
        grams,
        food.name,
        usedStandard ? "estimated" : "catalog",
        per100Of(food),
        food.id,
      ));
    } else {
      lines.push(lineFrom(
        item.quantity ?? item.grams,
        item.unit ?? "g",
        item.grams,
        item.displayName,
        "estimated",
        {
          kcal: item.per100g.kcalPer100g,
          proteinG: item.per100g.proteinPer100g,
          carbsG: item.per100g.carbsPer100g,
          fatG: item.per100g.fatPer100g,
        },
        null,
      ));
    }
  }
  const meal = await prisma.foodLogEntry.create({
    data: {
      clientUserId: userId,
      loggedAt: new Date(),
      localDate: asDate(isoDate),
      text: input.note ?? null,
      source: "assistant",
      mealType: mealTypeForNow(),
      items: {
        create: lines.map((line, index) => ({
          foodItemId: line.foodId,
          name: line.displayName,
          grams: line.grams,
          servingLabel: line.unit,
          quantity: line.quantity,
          unit: line.unit,
          provenance: line.provenance,
          kcal: line.kcal,
          proteinG: line.proteinG,
          carbsG: line.carbsG,
          fatG: line.fatG,
          kcalPer100g: line.kcalPer100g,
          proteinPer100g: line.proteinPer100g,
          carbsPer100g: line.carbsPer100g,
          fatPer100g: line.fatPer100g,
          sortOrder: index,
        })),
      },
    },
    include: { items: true },
  });
  const payload = loggedMealPayload(meal);
  return {
    ...payload,
    assumedStandard: payload.items.some((item) => item.provenance === "estimated"),
    day: await day(userId, isoDate),
  };
}

export async function updateMealItem(
  userId: string,
  mealItemId: string,
  patch: { quantity?: number; unit?: string; foodId?: string },
) {
  const item = await prisma.foodLogItem.findFirst({
    where: { id: mealItemId, entry: { clientUserId: userId, deletedAt: null } },
  });
  if (!item) return { error: "not_found" as const };
  if (patch.quantity === undefined && !patch.unit && !patch.foodId) return { error: "patch_required" as const };

  const quantity = patch.quantity ?? (n(item.quantity) || n(item.grams));
  const unit = patch.unit ?? item.unit ?? "g";
  let foodId = item.foodItemId;
  let name = item.name;
  let per100 = {
    kcal: n(item.kcalPer100g) || (n(item.kcal) * 100) / Math.max(n(item.grams), 1),
    proteinG: n(item.proteinPer100g) || (n(item.proteinG) * 100) / Math.max(n(item.grams), 1),
    carbsG: n(item.carbsPer100g) || (n(item.carbsG) * 100) / Math.max(n(item.grams), 1),
    fatG: n(item.fatPer100g) || (n(item.fatG) * 100) / Math.max(n(item.grams), 1),
  };

  let grams: number | null = null;
  if (patch.foodId) {
    const food = await getFoodById(patch.foodId);
    if (!food) return { error: "food_not_found" as const };
    foodId = food.id;
    name = food.name;
    per100 = per100Of(food);
    grams = gramsFor(food.servingLabel, food.servingGrams, quantity, unit)
      ?? gramsFor(food.servingLabel, food.servingGrams, quantity, "unidad");
  } else if (patch.unit) {
    const food = foodId ? await getFoodById(foodId) : null;
    grams = food
      ? gramsFor(food.servingLabel, food.servingGrams, quantity, unit)
        ?? gramsFor(food.servingLabel, food.servingGrams, quantity, "unidad")
      : gramsFor(item.servingLabel, n(item.grams) / Math.max(n(item.quantity) || 1, 1), quantity, unit);
  } else {
    const oldQuantity = n(item.quantity) || n(item.grams);
    if (oldQuantity <= 0) return { error: "not_found" as const };
    grams = (n(item.grams) / oldQuantity) * quantity;
  }
  if (grams === null || grams <= 0) return { error: "serving_not_found" as const };

  const nutrients = nutrientsForGrams(per100, grams);
  await prisma.foodLogItem.update({
    where: { id: item.id },
    data: {
      foodItemId: foodId,
      name,
      quantity,
      unit,
      servingLabel: unit,
      grams,
      kcal: nutrients.kcal,
      proteinG: nutrients.proteinG,
      carbsG: nutrients.carbsG,
      fatG: nutrients.fatG,
      kcalPer100g: per100.kcal,
      proteinPer100g: per100.proteinG,
      carbsPer100g: per100.carbsG,
      fatPer100g: per100.fatG,
    },
  });

  const meal = await prisma.foodLogEntry.findFirst({
    where: { id: item.foodLogEntryId, clientUserId: userId, deletedAt: null },
    include: { items: { orderBy: { sortOrder: "asc" } } },
  });
  if (!meal) return { error: "not_found" as const };
  return {
    ...loggedMealPayload(meal),
    day: await day(userId, meal.localDate ? isoOf(meal.localDate) : today()),
  };
}

export async function deleteMeal(userId: string, mealId: string, confirmed: boolean) {
  const meal = await prisma.foodLogEntry.findFirst({
    where: { id: mealId, clientUserId: userId, deletedAt: null },
  });
  if (!meal) return { error: "meal_not_found" as const };
  if (!confirmed) {
    await prisma.nutritionPendingAction.create({
      data: {
        clientUserId: userId,
        kind: "delete_meal",
        payload: { mealId },
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });
    return { status: "confirmation_required" as const, mealId };
  }
  await prisma.foodLogEntry.update({ where: { id: meal.id }, data: { deletedAt: new Date() } });
  await prisma.nutritionPendingAction.updateMany({
    where: { clientUserId: userId, kind: "delete_meal", consumedAt: null },
    data: { consumedAt: new Date() },
  });
  return { status: "deleted" as const, mealId };
}

import { addSupplement, listSupplements, removeSupplement } from "./supplements.service";
export { addSupplement, listSupplements, removeSupplement };

export async function setSupplementStatus(
  userId: string,
  input: { supplementId: string; localDate?: string; status: string },
) {
  const supplement = await prisma.nutritionSupplement.findFirst({
    where: { id: input.supplementId, clientUserId: userId, active: true },
  });
  if (!supplement) return { error: "supplement_not_found" as const };
  const isoDate = input.localDate ?? today();
  await prisma.nutritionSupplementLog.upsert({
    where: { supplementId_localDate: { supplementId: supplement.id, localDate: asDate(isoDate) } },
    create: {
      clientUserId: userId,
      supplementId: supplement.id,
      localDate: asDate(isoDate),
      status: input.status,
    },
    update: { status: input.status },
  });
  return { status: input.status, name: supplement.name };
}

export async function listNotes(userId: string) {
  const notes = await prisma.nutritionNote.findMany({
    where: { clientUserId: userId, doneAt: null },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return { notes: notes.map(noteView) };
}

export async function addNote(
  userId: string,
  input: { text: string; remindLocal?: { localDate: string; hour: number; minute: number } },
) {
  const note = await prisma.nutritionNote.create({
    data: {
      clientUserId: userId,
      text: input.text.trim(),
      remindAt: input.remindLocal
        ? argentinaDateTime(input.remindLocal.localDate, input.remindLocal.hour, input.remindLocal.minute)
        : null,
    },
  });
  return noteView(note);
}

export async function completeNote(userId: string, noteId: string) {
  const note = await prisma.nutritionNote.findFirst({
    where: { id: noteId, clientUserId: userId, doneAt: null },
  });
  if (!note) return { error: "not_found" as const };
  await prisma.nutritionNote.update({
    where: { id: note.id },
    data: { doneAt: new Date() },
  });
  return listNotes(userId);
}

export async function logDrinks(
  userId: string,
  input: {
    localDate?: string;
    items: Array<{ foodId?: string; displayName: string; quantity: number; unit: string }>;
  },
) {
  const isoDate = input.localDate ?? today();
  const rows = [];
  for (const item of input.items) {
    const prepared = await prepareDrink(userId, item);
    if ("error" in prepared) return prepared;
    rows.push(prepared);
  }
  const created = await prisma.$transaction(rows.map((row) => prisma.nutritionDrink.create({
    data: {
      clientUserId: userId,
      localDate: asDate(isoDate),
      consumedAt: new Date(),
      ...row,
    },
  })));
  return { items: created.map(drinkView), day: await day(userId, isoDate) };
}

export async function updateDrink(userId: string, drinkId: string, milliliters: number) {
  if (!Number.isFinite(milliliters) || milliliters <= 0) return { error: "invalid_quantity" as const };
  const drink = await prisma.nutritionDrink.findFirst({
    where: { id: drinkId, clientUserId: userId, deletedAt: null },
  });
  if (!drink) return { error: "not_found" as const };
  const previous = n(drink.milliliters);
  const scale = previous > 0 ? milliliters / previous : 1;
  await prisma.nutritionDrink.update({
    where: { id: drink.id },
    data: {
      milliliters,
      grams: milliliters,
      quantity: previous > 0 ? n(drink.quantity) * scale : milliliters,
      unit: "ml",
      kcal: n(drink.kcal) * scale,
      proteinG: n(drink.proteinG) * scale,
      carbsG: n(drink.carbsG) * scale,
      fatG: n(drink.fatG) * scale,
    },
  });
  return { day: await day(userId, isoOf(drink.localDate)) };
}

export async function deleteDrink(userId: string, drinkId: string) {
  const drink = await prisma.nutritionDrink.findFirst({
    where: { id: drinkId, clientUserId: userId, deletedAt: null },
  });
  if (!drink) return { error: "not_found" as const };
  await prisma.nutritionDrink.update({
    where: { id: drink.id },
    data: { deletedAt: new Date() },
  });
  return { day: await day(userId, isoOf(drink.localDate)) };
}

export async function suggestMeals(
  userId: string,
  input: { options: Array<{ title: string; items: Array<{ foodId: string; quantity: number; unit: string }> }> },
) {
  const options = [];
  for (const option of input.options) {
    const lines = [];
    for (const item of option.items) {
      const food = await getFoodById(item.foodId);
      if (!food) return { error: "food_not_found" as const };
      const grams = gramsFor(food.servingLabel, food.servingGrams, item.quantity, item.unit)
        ?? gramsFor(food.servingLabel, food.servingGrams, item.quantity, "unidad");
      if (grams === null) return { error: "serving_not_found" as const };
      lines.push(lineFrom(item.quantity, item.unit, grams, food.name, "catalog", per100Of(food), food.id));
    }
    options.push({
      title: option.title.trim(),
      saved: false,
      items: lines.map((line) => ({
        displayName: line.displayName,
        quantity: line.quantity,
        unit: line.unit,
        grams: line.grams,
        kcal: line.kcal,
        proteinG: line.proteinG,
        carbsG: line.carbsG,
        fatG: line.fatG,
      })),
      totals: sumNutrients(lines.map(asVector)),
    });
  }
  return { options };
}

export async function logPlate(userId: string, input: { items: Array<{ query: string; grams?: number }> }) {
  const { matches } = await searchFoods(
    userId,
    input.items.map((item) => cleanPlateQuery(item.query)),
  );
  const resultsOf = async (query: string) => {
    const cleaned = cleanPlateQuery(query);
    const found = matches.find((row) => row.query === cleaned)?.results ?? [];
    if (found.length > 0) return found;
    if (cleaned.length < 6) return [];
    const retry = await searchFoods(userId, [cleaned.slice(0, 4)]);
    return retry.matches[0]?.results ?? [];
  };

  const resolved = await Promise.all(input.items.map(async (item) => {
    const results = await resultsOf(item.query);
    const match = pickCatalogFood(cleanPlateQuery(item.query), results);
    const food = match ? await getFoodById(match.id) : null;
    const catalogServing = food?.servingGrams != null ? n(food.servingGrams) : null;
    const portion = item.grams != null
      ? { grams: item.grams, assumed: false }
      : defaultPlateGrams(item.query, catalogServing);
    if (!food) {
      return {
        query: item.query,
        grams: portion.grams,
        assumedStandard: portion.assumed,
        status: results.length > 1 ? "ambiguous" as const : "not_found" as const,
        options: results.map((row) => row.name),
      };
    }
    const line = lineFrom(
      1,
      portion.assumed ? "porción" : "g",
      portion.grams,
      food.name,
      "estimated",
      per100Of(food),
      food.id,
    );
    return { query: item.query, grams: portion.grams, assumedStandard: portion.assumed, status: "ready" as const, line };
  }));
  if (resolved.some((item) => item.status !== "ready")) {
    return {
      saved: false as const,
      approximate: true as const,
      items: resolved.map((item) => ({
        query: item.query,
        grams: item.grams,
        assumedStandard: item.assumedStandard,
        status: item.status,
        options: item.status === "ready" ? [item.line.displayName] : item.options,
      })),
    };
  }
  const lines = resolved.flatMap((item) => item.status === "ready" ? [item.line] : []);
  const meal = await prisma.foodLogEntry.create({
    data: {
      clientUserId: userId,
      loggedAt: new Date(),
      localDate: asDate(today()),
      text: "foto",
      source: "assistant",
      mealType: mealTypeForNow(),
      items: {
        create: lines.map((line, index) => ({
          foodItemId: line.foodId,
          name: line.displayName,
          grams: line.grams,
          servingLabel: line.unit,
          quantity: line.quantity,
          unit: line.unit,
          provenance: "estimated",
          kcal: line.kcal,
          proteinG: line.proteinG,
          carbsG: line.carbsG,
          fatG: line.fatG,
          kcalPer100g: line.kcalPer100g,
          proteinPer100g: line.proteinPer100g,
          carbsPer100g: line.carbsPer100g,
          fatPer100g: line.fatPer100g,
          sortOrder: index,
        })),
      },
    },
  });
  return {
    saved: true as const,
    approximate: true as const,
    assumedStandard: true as const,
    mealId: meal.id,
    items: lines.map((line) => ({
      displayName: line.displayName,
      quantity: line.quantity,
      unit: line.unit,
      grams: line.grams,
      kcal: line.kcal,
      proteinG: line.proteinG,
      carbsG: line.carbsG,
      fatG: line.fatG,
    })),
    totals: sumNutrients(lines.map(asVector)),
  };
}

export async function briefing(userId: string): Promise<string> {
  const isoDate = today();
  const snapshot = await day(userId, isoDate);
  const pending = await prisma.nutritionPendingAction.findFirst({
    where: { clientUserId: userId, kind: "delete_meal", consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { expiresAt: "desc" },
  });
  const payload = pending?.payload as { mealId?: string } | null;
  const mealLines = snapshot.meals.map((meal) => {
    const label = meal.items
      .map((item) => `item ${item.id} | ${item.quantity} ${item.unit} (${item.grams} g) ${item.displayName}`)
      .join(", ");
    return `Comida ${meal.id} | ${label}`;
  });
  return [
    await accountBrief(userId),
    `Fecha local: ${isoDate}`,
    `Pendiente de borrar: ${payload?.mealId ?? "ninguno"}`,
    mealLines.length ? mealLines.join("\n") : "Comidas: ninguna",
    `Bebidas: ${snapshot.drinks.map((d) => `${d.quantity} ${d.unit} ${d.displayName}`).join(", ") || "ninguna"}`,
    `Suplementos: ${snapshot.supplements.map((s) => `${s.name} id ${s.id} (${s.status ?? "pendiente"}, ${s.timeOfDay})`).join(", ") || "ninguno"}`,
    pendingSupplementsLine(snapshot.supplements),
  ].join("\n");
}

function pendingSupplementsLine(supplements: Array<{ id: string; name: string; timeOfDay: string; status: string | null }>): string {
  const hour = localHour();
  const due = supplements.filter((item) => item.status === null && shouldRemindAt(item.timeOfDay, hour));
  if (due.length === 0) return "Suplementos pendientes ahora: ninguno. No preguntes si ya tienen respuesta.";
  const names = due.map((item) => `${item.name} id ${item.id}`).join(", ");
  return `Suplementos pendientes ahora: ${names}. Preguntá en una frase si los tomó hoy. Si dice que sí, set_supplement_status taken. Si dice que no, skipped. Si dice más tarde, planned.`;
}

export async function spentMicroUsd(): Promise<number> {
  const spent = await prisma.assistantUsageCharge.aggregate({
    where: { monthKey: monthKey() },
    _sum: { costMicroUsd: true },
  });
  return spent._sum.costMicroUsd ?? 0;
}

export async function photoCount(userId: string): Promise<number> {
  return kindCount(userId, "photo");
}

export async function voiceCount(userId: string): Promise<number> {
  return kindCount(userId, "voice");
}

async function kindCount(userId: string, inputKind: "photo" | "voice"): Promise<number> {
  const start = localMidnight(today());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return prisma.assistantMessage.count({
    where: { userId, role: "user", inputKind, createdAt: { gte: start, lt: end } },
  });
}

export async function reviewLastMeal(userId: string) {
  const snapshot = await day(userId, today());
  const meal = snapshot.meals.at(-1);
  if (!meal) return { error: "no_meal" as const };
  const totals = sumNutrients(meal.items.map((item) => ({
    kcal: item.kcal, proteinG: item.proteinG, carbsG: item.carbsG, fatG: item.fatG,
  })));
  return {
    meal: {
      id: meal.id,
      items: meal.items.map((item) => ({
        id: item.id,
        displayName: item.displayName,
        quantity: item.quantity,
        unit: item.unit,
        grams: item.grams,
        kcal: item.kcal,
        proteinG: item.proteinG,
        carbsG: item.carbsG,
        fatG: item.fatG,
      })),
      totals,
    },
    consumed: snapshot.consumed,
    goals: snapshot.goals,
    remaining: snapshot.remaining,
  };
}

export async function range(userId: string, kind: "week" | "month") {
  const bounds = kind === "week" ? weekBounds(today()) : monthBounds(today());
  const meals = await prisma.foodLogEntry.findMany({
    where: {
      clientUserId: userId,
      deletedAt: null,
      localDate: { gte: asDate(bounds.from), lte: asDate(bounds.to) },
    },
    include: { items: true },
  });
  const drinks = await prisma.nutritionDrink.findMany({
    where: {
      clientUserId: userId,
      deletedAt: null,
      localDate: { gte: asDate(bounds.from), lte: asDate(bounds.to) },
    },
  });
  const days = eachDate(bounds.from, bounds.to).map((isoDate) => {
    const dayMeals = meals.filter((meal) => meal.localDate && isoOf(meal.localDate) === isoDate);
    const dayDrinks = drinks.filter((drink) => isoOf(drink.localDate) === isoDate);
    const consumed = sumNutrients([
      ...dayMeals.flatMap((meal) => meal.items.map((item) => ({
        kcal: n(item.kcal), proteinG: n(item.proteinG), carbsG: n(item.carbsG), fatG: n(item.fatG),
      }))),
      ...dayDrinks.map((drink) => ({ kcal: n(drink.kcal), proteinG: 0, carbsG: 0, fatG: 0 })),
    ]);
    return {
      localDate: isoDate,
      weekday: weekdayLabel(isoDate),
      day: Number(isoDate.slice(8)),
      kcal: consumed.kcal,
      proteinG: consumed.proteinG,
      milliliters: dayDrinks.reduce((sum, drink) => sum + n(drink.milliliters), 0),
    };
  });
  return {
    kind,
    from: bounds.from,
    to: bounds.to,
    days,
    totals: {
      kcal: days.reduce((sum, row) => sum + row.kcal, 0),
      proteinG: days.reduce((sum, row) => sum + row.proteinG, 0),
      milliliters: days.reduce((sum, row) => sum + row.milliliters, 0),
    },
  };
}

const GOAL_LABEL: Record<string, string> = {
  lose: "bajar de peso",
  maintain: "mantener el peso",
  gain: "subir de peso",
};

const ACTIVITY_LABEL: Record<string, string> = {
  sedentary: "casi sin entreno",
  light: "1 a 3 días de entreno",
  moderate: "3 a 5 días de entreno",
  very: "6 a 7 días de entreno",
  extra: "doble turno",
};

export async function readAccount(userId: string) {
  const [user, profile, target, supplements, notes] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { displayName: true },
    }),
    getNutritionProfile(userId),
    getNutritionTarget(userId),
    listSupplements(userId),
    listNotes(userId),
  ]);
  return {
    displayName: user?.displayName ?? null,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    activityLevel: profile.activityLevel,
    sex: profile.sex,
    birthYear: profile.birthYear,
    intention: target?.goal ?? null,
    goals: target
      ? { kcal: target.calories, proteinG: target.proteinG, carbsG: target.carbsG, fatG: target.fatG }
      : { kcal: null, proteinG: null, carbsG: null, fatG: null },
    supplements: supplements.supplements,
    reminders: notes.notes.length,
  };
}

async function accountBrief(userId: string): Promise<string> {
  const account = await readAccount(userId);
  const macros = account.goals.kcal
    ? `Objetivo ${account.goals.kcal} kcal, ${account.goals.proteinG} g proteína, ${account.goals.carbsG} g carbos, ${account.goals.fatG} g grasas`
    : "Sin objetivo de macros";
  const intention = account.intention ? GOAL_LABEL[account.intention] ?? account.intention : "sin intención de peso";
  const training = account.activityLevel ? ACTIVITY_LABEL[account.activityLevel] ?? account.activityLevel : "días de entreno no dichos";
  const body = [
    account.heightCm != null ? `${account.heightCm} cm` : null,
    account.weightKg != null ? `${account.weightKg} kg` : null,
  ].filter(Boolean).join(", ") || "sin peso ni altura";
  return `Cuenta: ${account.displayName ?? "alumno"}. ${macros}. Busca ${intention}. Entrena ${training}. Cuerpo: ${body}.`;
}

async function prepareDrink(
  userId: string,
  item: { foodId?: string; displayName: string; quantity: number; unit: string },
) {
  if (item.foodId) {
    const food = await getFoodById(item.foodId);
    if (!food) return { error: "food_not_found" as const };
    const grams = volumeFor(food.servingLabel, food.servingGrams, item.quantity, item.unit);
    if (grams === null) return { error: "serving_not_found" as const };
    const line = lineFrom(item.quantity, item.unit, grams, food.name, "catalog", per100Of(food), food.id);
    return { ...toDrinkRow(line), milliliters: grams, foodItemId: food.id };
  }
  const grams = millilitersForUnit(item.quantity, item.unit);
  if (grams === null) return { error: "serving_not_found" as const };
  const zeros: NutrientVector = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };
  const line = lineFrom(item.quantity, item.unit, grams, item.displayName.trim(), "estimated", zeros, null);
  return { ...toDrinkRow(line), milliliters: grams, foodItemId: null };
}

function toDrinkRow(line: ReturnType<typeof lineFrom>) {
  return {
    name: line.displayName,
    quantity: line.quantity,
    unit: line.unit,
    grams: line.grams,
    provenance: line.provenance,
    kcal: line.kcal,
    proteinG: line.proteinG,
    carbsG: line.carbsG,
    fatG: line.fatG,
    kcalPer100g: line.kcalPer100g,
    proteinPer100g: line.proteinPer100g,
    carbsPer100g: line.carbsPer100g,
    fatPer100g: line.fatPer100g,
  };
}

function drinkView(drink: {
  id: string;
  name: string;
  quantity: { toString(): string } | number;
  unit: string;
  milliliters: { toString(): string } | number;
  kcal: { toString(): string } | number;
  provenance: string;
}) {
  return {
    id: drink.id,
    displayName: drink.name,
    quantity: n(drink.quantity),
    unit: drink.unit,
    milliliters: n(drink.milliliters),
    kcal: n(drink.kcal),
    provenance: drink.provenance,
  };
}

function noteView(note: { id: string; text: string; remindAt: Date | null; createdAt: Date }) {
  return {
    id: note.id,
    text: note.text,
    remindAt: note.remindAt?.toISOString() ?? null,
    createdAt: note.createdAt.toISOString(),
  };
}

function loggedMealPayload(meal: {
  id: string;
  text: string | null;
  items: Array<{
    id: string;
    name: string;
    quantity: { toString(): string } | number | null;
    unit: string | null;
    grams: { toString(): string } | number;
    provenance: string | null;
    kcal: { toString(): string } | number;
    proteinG: { toString(): string } | number;
    carbsG: { toString(): string } | number;
    fatG: { toString(): string } | number;
  }>;
}) {
  return {
    mealId: meal.id,
    note: meal.text,
    items: meal.items.map((item) => ({
      id: item.id,
      displayName: item.name,
      quantity: n(item.quantity) || n(item.grams),
      unit: cleanServingUnit(item.unit ?? "g"),
      grams: n(item.grams),
      provenance: item.provenance,
      kcal: n(item.kcal),
      proteinG: n(item.proteinG),
      carbsG: n(item.carbsG),
      fatG: n(item.fatG),
    })),
  };
}

function per100Of(food: { kcalPer100g: number; proteinPer100g: number; carbsPer100g: number; fatPer100g: number }): NutrientVector {
  return { kcal: food.kcalPer100g, proteinG: food.proteinPer100g, carbsG: food.carbsPer100g, fatG: food.fatPer100g };
}

function lineFrom(
  quantity: number,
  unit: string,
  grams: number,
  displayName: string,
  provenance: string,
  per100: NutrientVector,
  foodId: string | null,
) {
  const nutrients = nutrientsForGrams(per100, grams);
  return {
    foodId,
    displayName,
    quantity,
    unit: cleanServingUnit(unit),
    grams,
    provenance,
    kcal: nutrients.kcal,
    proteinG: nutrients.proteinG,
    carbsG: nutrients.carbsG,
    fatG: nutrients.fatG,
    kcalPer100g: per100.kcal,
    proteinPer100g: per100.proteinG,
    carbsPer100g: per100.carbsG,
    fatPer100g: per100.fatG,
  };
}

function asVector(line: { kcal: number; proteinG: number; carbsG: number; fatG: number }): NutrientVector {
  return { kcal: line.kcal, proteinG: line.proteinG, carbsG: line.carbsG, fatG: line.fatG };
}

function mealTypeForNow(): string {
  const hour = Number(new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date()).find((part) => part.type === "hour")?.value ?? "12");
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 20) return "snack";
  return "dinner";
}

