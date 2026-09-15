export type BiologicalSex = "male" | "female";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "very" | "extra";
export type NutritionGoal = "lose" | "maintain" | "gain";

export const ACTIVITY_FACTOR: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extra: 1.9,
};

export const GOAL_CALORIE_DELTA: Record<NutritionGoal, number> = {
  lose: -0.15,
  maintain: 0,
  gain: 0.12,
};

export const DEFAULT_PROTEIN_PER_KG: Record<NutritionGoal, number> = {
  lose: 2.0,
  maintain: 1.8,
  gain: 1.6,
};

export interface MacrosInput {
  sex: BiologicalSex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: NutritionGoal;
  proteinPerKg?: number;
}

export interface MacrosResult {
  bmr: number;
  tdee: number;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  proteinPerKg: number;
}

export function mifflinBmr(sex: BiologicalSex, weightKg: number, heightCm: number, ageYears: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  return sex === "male" ? base + 5 : base - 161;
}

export function calculateMacros(input: MacrosInput): MacrosResult {
  const bmr = mifflinBmr(input.sex, input.weightKg, input.heightCm, input.ageYears);
  const tdee = bmr * ACTIVITY_FACTOR[input.activityLevel];
  const calories = Math.max(1200, Math.round(tdee * (1 + GOAL_CALORIE_DELTA[input.goal])));
  const proteinPerKg = input.proteinPerKg ?? DEFAULT_PROTEIN_PER_KG[input.goal];
  const proteinG = Math.max(40, Math.round(input.weightKg * proteinPerKg));
  const fatFloor = Math.round(input.weightKg * 0.8);
  const fatFromPct = Math.round((calories * 0.25) / 9);
  const fatG = Math.max(fatFloor, fatFromPct);
  const proteinKcal = proteinG * 4;
  const fatKcal = fatG * 9;
  const remaining = calories - proteinKcal - fatKcal;
  const carbsG = Math.max(0, Math.round(remaining / 4));

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    calories,
    proteinG,
    fatG,
    carbsG,
    proteinPerKg,
  };
}

export type MacroSplitKey = "proteinPct" | "carbsPct" | "fatPct";

export interface MacroSplitPct {
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
}

export const MACRO_SPLIT_PRESETS: Array<{
  id: string;
  label: string;
  hint: string;
  split: MacroSplitPct | null;
}> = [
  { id: "suggested", label: "Sugerido", hint: "Según tu objetivo", split: null },
  { id: "high-protein", label: "Más prote", hint: "35 / 35 / 30", split: { proteinPct: 35, carbsPct: 35, fatPct: 30 } },
  { id: "high-carb", label: "Más carbos", hint: "25 / 50 / 25", split: { proteinPct: 25, carbsPct: 50, fatPct: 25 } },
  { id: "balanced", label: "Equilibrado", hint: "30 / 40 / 30", split: { proteinPct: 30, carbsPct: 40, fatPct: 30 } },
];

export function splitFromGrams(calories: number, proteinG: number, carbsG: number, fatG: number): MacroSplitPct {
  if (calories <= 0) return { proteinPct: 30, carbsPct: 45, fatPct: 25 };
  const proteinPct = Math.round((proteinG * 4 / calories) * 100);
  const fatPct = Math.round((fatG * 9 / calories) * 100);
  const carbsPct = Math.max(0, 100 - proteinPct - fatPct);
  return { proteinPct, carbsPct, fatPct };
}

export function gramsFromSplit(calories: number, split: MacroSplitPct) {
  const proteinG = Math.max(0, Math.round((calories * split.proteinPct) / 100 / 4));
  const fatG = Math.max(0, Math.round((calories * split.fatPct) / 100 / 9));
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatG * 9) / 4));
  return { proteinG, carbsG, fatG };
}

export function sameSplit(a: MacroSplitPct, b: MacroSplitPct, tolerance = 1): boolean {
  return Math.abs(a.proteinPct - b.proteinPct) <= tolerance
    && Math.abs(a.carbsPct - b.carbsPct) <= tolerance
    && Math.abs(a.fatPct - b.fatPct) <= tolerance;
}

export function adjustSplit(split: MacroSplitPct, key: MacroSplitKey, raw: number): MacroSplitPct {
  const min = 10;
  const max = 80;
  const next = Math.min(max, Math.max(min, Math.round(raw)));
  const others = (["proteinPct", "carbsPct", "fatPct"] as const).filter((k) => k !== key);
  const remaining = 100 - next;
  const a0 = split[others[0]];
  const b0 = split[others[1]];
  const sum = a0 + b0;
  let a = sum <= 0 ? Math.round(remaining / 2) : Math.round((remaining * a0) / sum);
  let b = remaining - a;
  if (a < min) {
    a = min;
    b = remaining - a;
  }
  if (b < min) {
    b = min;
    a = remaining - b;
  }
  const nextSplit: MacroSplitPct = { ...split };
  nextSplit[key] = next;
  nextSplit[others[0]] = a;
  nextSplit[others[1]] = b;
  return nextSplit;
}

export function scaleMacros(per100g: { kcal: number; proteinG: number; carbsG: number; fatG: number }, grams: number) {
  const factor = grams / 100;
  return {
    kcal: round1(per100g.kcal * factor),
    proteinG: round1(per100g.proteinG * factor),
    carbsG: round1(per100g.carbsG * factor),
    fatG: round1(per100g.fatG * factor),
  };
}

export function emptyMacros() {
  return { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 };
}

export function addMacros<T extends { kcal: number; proteinG: number; carbsG: number; fatG: number }>(a: T, b: T): T {
  return {
    ...a,
    kcal: round1(a.kcal + b.kcal),
    proteinG: round1(a.proteinG + b.proteinG),
    carbsG: round1(a.carbsG + b.carbsG),
    fatG: round1(a.fatG + b.fatG),
  };
}

export function remainingMacros(
  target: { calories: number; proteinG: number; carbsG: number; fatG: number },
  consumed: { kcal: number; proteinG: number; carbsG: number; fatG: number },
) {
  return {
    kcal: Math.round(target.calories - consumed.kcal),
    proteinG: round1(target.proteinG - consumed.proteinG),
    carbsG: round1(target.carbsG - consumed.carbsG),
    fatG: round1(target.fatG - consumed.fatG),
  };
}

export function normalizeFoodName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
