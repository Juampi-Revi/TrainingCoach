import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";
import { getMealIdeasForUser } from "@/lib/health/meal-ideas.service";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);
    const mealType = req.nextUrl.searchParams.get("mealType");
    return ok(await getMealIdeasForUser(auth.user.sub, mealType));
  });
}
