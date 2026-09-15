import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { err, forbidden, ok, unauthorized, withHandler } from "@/lib/api-response";
import { verifyCoachClientRelation } from "@/lib/training/ownership.service";
import { getNutritionToday, upsertNutritionTarget } from "@/lib/health/nutrition.service";

type Ctx = { params: Promise<{ clientUserId: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);
    const { clientUserId } = await params;
    const rel = await verifyCoachClientRelation(auth.user.sub, clientUserId);
    if (!rel) return forbidden();
    return ok(await getNutritionToday(clientUserId));
  });
}

export async function PUT(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);
    const { clientUserId } = await params;
    const rel = await verifyCoachClientRelation(auth.user.sub, clientUserId);
    if (!rel) return forbidden();
    const body = await req.json().catch(() => ({}));
    const result = await upsertNutritionTarget({
      clientUserId,
      actorUserId: auth.user.sub,
      actorRole: "coach",
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
