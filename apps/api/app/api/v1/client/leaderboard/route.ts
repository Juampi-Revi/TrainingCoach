import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { ok, err, withHandler } from "@/lib/api-response";
import {
  getLeaderboard,
  getFriendsLeaderboard,
  type LeaderboardMetric,
  type LeaderboardPeriod,
} from "@/lib/gamification/leaderboard.service";

// GET /api/v1/client/leaderboard?metric=workouts&period=weekly&friendsOnly=false
export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = await requireRole(req, ["client"]);
    if (!auth.ok) return err(auth.message, auth.status);

    const { searchParams } = new URL(req.url);
    const metric = (searchParams.get("metric") ?? "workouts") as LeaderboardMetric;
    const period = (searchParams.get("period") ?? "weekly") as LeaderboardPeriod;
    const friendsOnly = searchParams.get("friendsOnly") === "true";
    const limit = parseInt(searchParams.get("limit") ?? "20", 10);

    // Validate metric
    if (!["workouts", "volume", "xp", "streak"].includes(metric)) {
      return err("Métrica inválida", 400);
    }

    // Validate period
    if (!["weekly", "monthly", "allTime"].includes(period)) {
      return err("Período inválido", 400);
    }

    let result;
    if (friendsOnly) {
      result = await getFriendsLeaderboard(auth.user.sub, metric, period, limit);
    } else {
      result = await getLeaderboard(auth.user.sub, metric, period, limit);
    }

    return ok(result);
  });
}