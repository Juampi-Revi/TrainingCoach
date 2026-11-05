import { z } from "zod";

export const localDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");

const per100gSchema = z.strictObject({
  kcalPer100g: z.number().nonnegative(),
  proteinPer100g: z.number().nonnegative(),
  carbsPer100g: z.number().nonnegative(),
  fatPer100g: z.number().nonnegative(),
  fiberPer100g: z.number().nonnegative().optional(),
});

export const searchFoodsInput = z.strictObject({
  query: z.string().trim().min(1).max(120),
});

export const catalogMealItemInput = z.strictObject({
  kind: z.literal("catalog"),
  foodId: z.string().uuid(),
  quantity: z.number().positive(),
  unit: z.string().trim().min(1).max(40),
});

export const estimatedMealItemInput = z.strictObject({
  kind: z.literal("estimated"),
  displayName: z.string().trim().min(1).max(120),
  grams: z.number().positive(),
  quantity: z.number().positive().optional(),
  unit: z.string().trim().min(1).max(40).optional(),
  per100g: per100gSchema,
});

export const logMealInput = z.strictObject({
  localDate: localDateSchema.optional(),
  note: z.string().trim().min(1).max(80).optional(),
  items: z.array(z.union([catalogMealItemInput, estimatedMealItemInput])).min(1).max(20),
});

export const getDaySummaryInput = z.strictObject({
  localDate: localDateSchema.optional(),
});

export const updateMealItemInput = z.strictObject({
  mealItemId: z.string().uuid(),
  quantity: z.number().positive().optional(),
  unit: z.string().trim().min(1).max(40).optional(),
  foodId: z.string().uuid().optional(),
});

export const deleteMealInput = z.strictObject({
  mealId: z.string().uuid(),
  confirmed: z.boolean(),
});

export const supplementTimeOfDay = z.enum([
  "morning",
  "with_breakfast",
  "afternoon",
  "with_dinner",
  "night",
]);

export const addSupplementInput = z.strictObject({
  name: z.string().trim().min(1).max(80),
  timeOfDay: supplementTimeOfDay,
  note: z.string().trim().max(160).optional(),
  remind: z.boolean().optional(),
});

export const removeSupplementInput = z.strictObject({
  supplementId: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(80).optional(),
});

export const setSupplementStatusInput = z.strictObject({
  supplementId: z.string().uuid(),
  localDate: localDateSchema.optional(),
  status: z.enum(["planned", "taken", "skipped"]),
});

export const addNoteInput = z.strictObject({
  text: z.string().trim().min(1).max(280),
  remindLocal: z.strictObject({
    localDate: localDateSchema,
    hour: z.number().int().min(0).max(23),
    minute: z.number().int().min(0).max(59),
  }).optional(),
});

export const logDrinkInput = z.strictObject({
  localDate: localDateSchema.optional(),
  items: z.array(z.strictObject({
    foodId: z.string().uuid().optional(),
    displayName: z.string().trim().min(1).max(80),
    quantity: z.number().positive(),
    unit: z.string().trim().min(1).max(40),
  })).min(1).max(8),
});

export const logPlateInput = z.strictObject({
  items: z.array(z.strictObject({
    query: z.string().trim().min(1).max(80),
    grams: z.number().positive().max(2000).optional(),
  })).min(1).max(6),
});

export const suggestMealsInput = z.strictObject({
  options: z.array(z.strictObject({
    title: z.string().trim().min(1).max(80),
    items: z.array(z.strictObject({
      foodId: z.string().uuid(),
      quantity: z.number().positive(),
      unit: z.string().trim().min(1).max(40),
    })).min(1).max(5),
  })).min(1).max(3),
});

export const emptyInput = z.strictObject({});

export const toolNames = [
  "search_foods",
  "log_meal",
  "get_day_summary",
  "list_meals",
  "update_meal_item",
  "delete_meal",
  "list_supplements",
  "add_supplement",
  "remove_supplement",
  "set_supplement_status",
  "list_pending_supplements",
  "add_note",
  "list_notes",
  "log_drink",
  "suggest_meals",
  "log_plate",
  "review_last_meal",
  "get_account",
] as const;

export type ToolName = (typeof toolNames)[number];

export const toolInputs = {
  search_foods: searchFoodsInput,
  log_meal: logMealInput,
  get_day_summary: getDaySummaryInput,
  list_meals: getDaySummaryInput,
  update_meal_item: updateMealItemInput,
  delete_meal: deleteMealInput,
  list_supplements: emptyInput,
  add_supplement: addSupplementInput,
  remove_supplement: removeSupplementInput,
  set_supplement_status: setSupplementStatusInput,
  list_pending_supplements: getDaySummaryInput,
  add_note: addNoteInput,
  list_notes: emptyInput,
  log_drink: logDrinkInput,
  suggest_meals: suggestMealsInput,
  log_plate: logPlateInput,
  review_last_meal: emptyInput,
  get_account: emptyInput,
} as const;
