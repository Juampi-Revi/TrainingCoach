import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";
import { searchFoods } from "@/lib/health/food-catalog.service";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);
    const q = req.nextUrl.searchParams.get("q") ?? "";
    const take = Math.min(40, Math.max(5, parseInt(req.nextUrl.searchParams.get("take") ?? "20", 10) || 20));
    const items = await searchFoods(q, auth.user.sub, take);
    return ok({ items });
  });
}
