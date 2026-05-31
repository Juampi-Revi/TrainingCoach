import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { ok, err, withHandler } from "@/lib/api-response";
import { getStreakStats } from "@/lib/gamification/streaks.service";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = await requireRole(req, ["client"]);
    if (!auth.ok) return err(auth.message, auth.status);

    const stats = await getStreakStats(auth.user.sub);
    return ok(stats);
  });
}
