import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";
import { searchCoachCatalog } from "@/lib/training/coach-search.service";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const q = req.nextUrl.searchParams.get("q") ?? "";
    const data = await searchCoachCatalog(auth.user.sub, q);
    return ok(data);
  });
}
