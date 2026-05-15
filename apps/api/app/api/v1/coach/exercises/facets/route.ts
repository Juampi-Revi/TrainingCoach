import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";
import { getCoachExerciseFacets } from "@/lib/training/exercise.service";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    return ok(await getCoachExerciseFacets(auth.user.sub));
  });
}
