import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { ok, err, withHandler } from "@/lib/api-response";
import { 
  createAthleteOnboarding, 
  getAthleteOnboarding,
  createSelfGuidedPlan,
  OnboardingData 
} from "@/lib/gamification/athlete-solo.service";
import { z } from "zod";

const onboardingSchema = z.object({
  goal: z.enum(["lose_weight", "build_muscle", "maintain", "improve_endurance", "general_fitness"]),
  experience: z.enum(["beginner", "intermediate", "advanced"]),
  daysPerWeek: z.number().int().min(2).max(6),
  sessionDuration: z.union([z.literal(30), z.literal(45), z.literal(60), z.literal(90)]),
  equipment: z.array(z.enum(["gym", "dumbbells", "home", "bodyweight"])).min(1),
  focusAreas: z.array(z.enum(["upper", "lower", "core", "cardio", "full_body"])).min(1),
});

// POST /api/v1/client/onboarding - Save onboarding data
export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = await requireRole(req, ["client"]);
    if (!auth.ok) return err(auth.message, auth.status);

    const body = await req.json().catch(() => ({}));
    const parsed = onboardingSchema.safeParse(body);

    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "Datos inválidos", 400);
    }

    const data: OnboardingData = parsed.data;
    
    // Save onboarding data
    await createAthleteOnboarding(auth.user.sub, data);
    
    // Generate self-guided plan
    const plan = await createSelfGuidedPlan(auth.user.sub, data);

    return ok({ 
      message: "Onboarding completado",
      planId: plan.planId,
      workoutsCreated: plan.workouts.length
    }, 201);
  });
}

// GET /api/v1/client/onboarding - Get onboarding status
export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = await requireRole(req, ["client"]);
    if (!auth.ok) return err(auth.message, auth.status);

    const onboarding = await getAthleteOnboarding(auth.user.sub);

    if (!onboarding) {
      return ok({ completed: false });
    }

    return ok({
      completed: true,
      data: onboarding,
    });
  });
}