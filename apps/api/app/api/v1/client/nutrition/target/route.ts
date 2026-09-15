import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { err, ok, unauthorized, withHandler } from "@/lib/api-response";
import { getNutritionTarget, upsertNutritionTarget } from "@/lib/health/nutrition.service";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);
    return ok(await getNutritionTarget(auth.user.sub));
  });
}

export async function PUT(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);
    const body = await req.json().catch(() => ({}));
    const result = await upsertNutritionTarget({
      clientUserId: auth.user.sub,
      actorUserId: auth.user.sub,
      actorRole: "client",
      calories: Number(body.calories),
      proteinG: Number(body.proteinG),
      carbsG: Number(body.carbsG),
      fatG: Number(body.fatG),
      goal: String(body.goal ?? "maintain"),
      proteinPerKg: Number(body.proteinPerKg ?? 1.8),
      activityLevel: typeof body.activityLevel === "string" ? body.activityLevel : null,
      notes: typeof body.notes === "string" ? body.notes : null,
    });
    if ("error" in result) return err(result.error ?? "No se pudo guardar", 400);
    return ok(result);
  });
}
