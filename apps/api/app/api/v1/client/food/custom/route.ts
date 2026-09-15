import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { err, ok, unauthorized, withHandler } from "@/lib/api-response";
import { createCustomFood } from "@/lib/health/food-catalog.service";

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);
    const body = await req.json().catch(() => ({}));
    const name = typeof body.name === "string" ? body.name : "";
    const kcalPer100g = Number(body.kcalPer100g);
    const proteinPer100g = Number(body.proteinPer100g ?? 0);
    const carbsPer100g = Number(body.carbsPer100g ?? 0);
    const fatPer100g = Number(body.fatPer100g ?? 0);
    if (!name.trim() || !Number.isFinite(kcalPer100g)) return err("Nombre y calorías son requeridos", 400);
    try {
      const item = await createCustomFood(auth.user.sub, {
        name,
        kcalPer100g,
        proteinPer100g,
        carbsPer100g,
        fatPer100g,
        servingLabel: typeof body.servingLabel === "string" ? body.servingLabel : null,
        servingGrams: body.servingGrams != null ? Number(body.servingGrams) : null,
      });
      return ok(item, 201);
    } catch (e) {
      return err(e instanceof Error ? e.message : "No se pudo crear", 400);
    }
  });
}
