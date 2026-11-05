export type FoodLine = {
  name: string;
  quantity: number | null;
  unit: string;
  grams: number | null;
  kcal: number;
  proteinG: number;
  carbsG: number | null;
  fatG: number | null;
};

export type MacroTotals = {
  kcal: number;
  proteinG: number;
  carbsG: number | null;
  fatG: number | null;
};

export type ChatCard =
  | { kind: "meal"; title: string; approximate: boolean; standardPortion?: boolean; updated?: boolean; items: FoodLine[]; totals: MacroTotals }
  | { kind: "drinks"; items: Array<{ name: string; milliliters: number; kcal: number }> }
  | {
      kind: "options";
      options: Array<{
        title: string;
        items: Array<{ name: string; quantity: number; unit: string; grams: number | null }>;
        totals: MacroTotals;
      }>;
    }
  | { kind: "supplements"; items: Array<{ id: string; name: string; timeOfDay: string }> };

type Trace = {
  toolName: string;
  arguments: unknown;
  result: unknown;
  status: string;
};

export function cardsFromTraces(traces: Trace[]): ChatCard[] {
  return traces.flatMap((trace) => {
    if (trace.status !== "succeeded") return [];
    const card = cardOf(trace);
    return card ? [card] : [];
  });
}

function cardOf(trace: Trace): ChatCard | null {
  if (trace.toolName === "log_meal") return mealCard(trace, false);
  if (trace.toolName === "update_meal_item") return mealCard(trace, true);
  if (trace.toolName === "log_plate") return plateCard(trace.result);
  if (trace.toolName === "log_drink") return drinkCard(trace.result);
  if (trace.toolName === "suggest_meals") return optionsCard(trace.result);
  if (trace.toolName === "list_pending_supplements") return supplementsCard(trace.result);
  return null;
}

function mealCard(trace: Trace, updated: boolean): ChatCard | null {
  const result = record(trace.result);
  if (!result || typeof result.mealId !== "string" || "error" in result) return null;
  const items = lines(result.items);
  if (items.length === 0) return null;
  return {
    kind: "meal",
    title: titleOf(text(result.note) || text(record(trace.arguments)?.note)),
    approximate: loggedItemsEstimated(result.items),
    standardPortion: result.assumedStandard === true,
    updated,
    items,
    totals: totalsOf(items),
  };
}

function plateCard(result: unknown): ChatCard | null {
  const row = record(result);
  if (!row || row.saved !== true || "error" in row) return null;
  const items = lines(row.items).map((item) => ({ ...item, unit: item.unit || "g" }));
  if (items.length === 0) return null;
  return { kind: "meal", title: "Plato", approximate: true, standardPortion: row.assumedStandard === true, items, totals: totalsOf(items) };
}

function drinkCard(result: unknown): ChatCard | null {
  const row = record(result);
  if (!row || !Array.isArray(row.items) || "error" in row) return null;
  const items = row.items.flatMap((item) => {
    const drink = record(item);
    const milliliters = drink ? numberOf(drink.milliliters) : null;
    const kcal = drink ? numberOf(drink.kcal) : null;
    if (!drink || typeof drink.displayName !== "string" || milliliters === null || kcal === null) return [];
    return [{ name: drink.displayName, milliliters, kcal }];
  });
  return items.length === 0 ? null : { kind: "drinks", items };
}

function optionsCard(result: unknown): ChatCard | null {
  const row = record(result);
  if (!row || !Array.isArray(row.options) || "error" in row) return null;
  const options = row.options.flatMap((option) => {
    const entry = record(option);
    if (!entry || typeof entry.title !== "string" || !Array.isArray(entry.items)) return [];
    const items = entry.items.flatMap((item) => {
      const food = record(item);
      const quantity = food ? numberOf(food.quantity) : null;
      if (!food || typeof food.displayName !== "string" || quantity === null) return [];
      return [{
        name: food.displayName,
        quantity,
        unit: text(food.unit) || "g",
        grams: numberOf(food.grams),
      }];
    });
    if (items.length === 0) return [];
    const totals = record(entry.totals);
    return [{
      title: entry.title.trim(),
      items,
      totals: {
        kcal: numberOf(totals?.kcal) ?? 0,
        proteinG: numberOf(totals?.proteinG) ?? 0,
        carbsG: numberOf(totals?.carbsG),
        fatG: numberOf(totals?.fatG),
      },
    }];
  });
  return options.length === 0 ? null : { kind: "options", options };
}

function supplementsCard(result: unknown): ChatCard | null {
  const row = record(result);
  if (!row || !Array.isArray(row.supplements)) return null;
  const items = row.supplements.flatMap((item) => {
    const entry = record(item);
    if (!entry || typeof entry.id !== "string" || typeof entry.name !== "string") return [];
    return [{ id: entry.id, name: entry.name, timeOfDay: text(entry.timeOfDay) }];
  });
  return items.length === 0 ? null : { kind: "supplements", items };
}

function lines(value: unknown): FoodLine[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const row = record(item);
    const kcal = row ? numberOf(row.kcal) : null;
    const proteinG = row ? numberOf(row.proteinG) : null;
    if (!row || typeof row.displayName !== "string" || kcal === null || proteinG === null) return [];
    const grams = numberOf(row.grams);
    const quantity = numberOf(row.quantity);
    const unit = text(row.unit);
    return [{
      name: row.displayName,
      quantity: quantity ?? grams,
      unit: unit || (grams === null ? "" : "g"),
      grams,
      kcal,
      proteinG,
      carbsG: numberOf(row.carbsG),
      fatG: numberOf(row.fatG),
    }];
  });
}

function loggedItemsEstimated(value: unknown): boolean {
  return Array.isArray(value) && value.some((item) => record(item)?.provenance === "estimated");
}

function totalsOf(items: FoodLine[]): MacroTotals {
  const carbs = items.every((item) => item.carbsG !== null);
  const fat = items.every((item) => item.fatG !== null);
  return {
    kcal: items.reduce((sum, item) => sum + item.kcal, 0),
    proteinG: items.reduce((sum, item) => sum + item.proteinG, 0),
    carbsG: carbs ? items.reduce((sum, item) => sum + (item.carbsG ?? 0), 0) : null,
    fatG: fat ? items.reduce((sum, item) => sum + (item.fatG ?? 0), 0) : null,
  };
}

function titleOf(note: string): string {
  const trimmed = note.trim();
  if (!trimmed) return "Comida";
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function numberOf(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}
