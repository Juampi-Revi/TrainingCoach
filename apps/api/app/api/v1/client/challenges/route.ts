import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { ok, err, withHandler } from "@/lib/api-response";
import {
  getActiveChallenges,
  getChallengeHistory,
  joinChallenge,
} from "@/lib/gamification/challenge.service";

// GET /api/v1/client/challenges - List active challenges
export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = await requireRole(req, ["client"]);
    if (!auth.ok) return err(auth.message, auth.status);

    const { searchParams } = new URL(req.url);
    const history = searchParams.get("history") === "true";

    if (history) {
      const challenges = await getChallengeHistory(auth.user.sub);
      return ok(challenges);
    }

    const challenges = await getActiveChallenges(auth.user.sub);
    return ok(challenges);
  });
}

// POST /api/v1/client/challenges - Join a challenge
export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = await requireRole(req, ["client"]);
    if (!auth.ok) return err(auth.message, auth.status);

    const body = await req.json().catch(() => ({}));
    const { challengeId } = body;

    if (!challengeId) {
      return err("challengeId es requerido", 400);
    }

    await joinChallenge(auth.user.sub, challengeId);
    return ok({ message: "Te uniste al desafío" });
  });
}
