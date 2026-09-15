import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { err, ok, unauthorized, withHandler } from "@/lib/api-response";
import { previewMacros } from "@/lib/health/nutrition.service";
import type { ActivityLevel, BiologicalSex, NutritionGoal } from "@/lib/health/macros";

const SEX = new Set(["male", "female"]);
const ACTIVITY = new Set(["sedentary", "light", "moderate", "very", "extra"]);
const GOAL = new Set(["lose", "maintain", "gain"]);

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);
    const body = await req.json().catch(() => ({}));
    if (!SEX.has(body.sex) || !ACTIVITY.has(body.activityLevel) || !GOAL.has(body.goal)) {
      return err("Datos incompletos para calcular", 400);
    }
    const ageYears = Number(body.ageYears);
    const heightCm = Number(body.heightCm);
    const weightKg = Number(body.weightKg);
    if (![ageYears, heightCm, weightKg].every((n) => Number.isFinite(n) && n > 0)) {
      return err("Edad, altura y peso son requeridos", 400);
    }
    return ok(previewMacros({
      sex: body.sex as BiologicalSex,
      ageYears,
      heightCm,
      weightKg,
      activityLevel: body.activityLevel as ActivityLevel,
      goal: body.goal as NutritionGoal,
      proteinPerKg: body.proteinPerKg != null ? Number(body.proteinPerKg) : undefined,
    }));
  });
}
