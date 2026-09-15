import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { err, ok, unauthorized, withHandler } from "@/lib/api-response";
import { getNutritionProfile, saveNutritionProfile } from "@/lib/health/nutrition.service";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);
    return ok(await getNutritionProfile(auth.user.sub));
  });
}

export async function PUT(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);
    const body = await req.json().catch(() => ({}));
    const result = await saveNutritionProfile(auth.user.sub, {
      sex: body.sex ?? undefined,
      birthYear: body.birthYear !== undefined ? (body.birthYear == null ? null : Number(body.birthYear)) : undefined,
      heightCm: body.heightCm !== undefined ? (body.heightCm == null ? null : Number(body.heightCm)) : undefined,
      activityLevel: body.activityLevel ?? undefined,
      weightKg: body.weightKg !== undefined ? (body.weightKg == null ? null : Number(body.weightKg)) : undefined,
    });
    if ("error" in result) return err(result.error ?? "No se pudo guardar", 400);
    return ok(result);
  });
}
