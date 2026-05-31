import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { ok, err, withHandler } from "@/lib/api-response";
import { createChallenge } from "@/lib/gamification/challenge.service";
import { z } from "zod";

const createChallengeSchema = z.object({
  type: z.enum(["30_day", "weekly_volume", "coach_challenge"]),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  targetValue: z.number().positive(),
  unit: z.string(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  durationDays: z.number().int().min(1).max(365).optional(),
  targetGroupId: z.string().uuid().optional(),
  xpReward: z.number().int().min(50).max(1000).default(200),
});

// POST /api/v1/coach/challenges - Create a new challenge
export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = await requireRole(req, ["coach", "gym"]);
    if (!auth.ok) return err(auth.message, auth.status);

    const body = await req.json().catch(() => ({}));
    const parsed = createChallengeSchema.safeParse(body);

    if (!parsed.success) {
      return err(parsed.error.issues[0]?.message ?? "Datos inválidos", 400);
    }

    const challenge = await createChallenge(auth.user.sub, {
      ...parsed.data,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
    });

    return ok(challenge, 201);
  });
}

// GET /api/v1/coach/challenges - List coach's challenges
export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = await requireRole(req, ["coach", "gym"]);
    if (!auth.ok) return err(auth.message, auth.status);

    const { prisma } = await import("@/lib/prisma");
    
    const challenges = await prisma.challenge.findMany({
      where: { createdByCoachId: auth.user.sub },
      include: {
        _count: { select: { participants: true } },
        group: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok(
      challenges.map((c) => ({
        id: c.id,
        title: c.title,
        type: c.type,
        targetValue: c.targetValue,
        unit: c.unit,
        startDate: c.startDate.toISOString(),
        endDate: c.endDate?.toISOString(),
        isActive: c.isActive,
        participantCount: c._count.participants,
        targetGroup: c.group?.name,
      }))
    );
  });
}
