import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { ok, err, withHandler } from "@/lib/api-response";
import { 
  generateWorkoutRecommendations,
  getAthleteOnboarding 
} from "@/lib/gamification/athlete-solo.service";

// GET /api/v1/client/routines/recommendations - Get AI recommendations
export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = await requireRole(req, ["client"]);
    if (!auth.ok) return err(auth.message, auth.status);

    const onboarding = await getAthleteOnboarding(auth.user.sub);

    if (!onboarding) {
      return err("Primero completá el onboarding", 400);
    }

    const recommendations = generateWorkoutRecommendations(onboarding);

    return ok({
      recommendations,
      basedOn: {
        goal: onboarding.goal,
        experience: onboarding.experience,
        daysPerWeek: onboarding.daysPerWeek,
      },
    });
  });
}