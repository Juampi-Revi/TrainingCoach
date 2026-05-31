import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, withHandler } from "@/lib/api-response";
import { duplicateWorkoutTemplate } from "@/lib/training/workout-template.service";

type Ctx = { params: Promise<{ workoutTemplateId: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { workoutTemplateId } = await params;
    const created = await duplicateWorkoutTemplate({ coachUserId: auth.user.sub, workoutTemplateId });
    if (!created) return notFound("Workout template not found");

    return ok({ id: created.id }, 201);
  });
}
