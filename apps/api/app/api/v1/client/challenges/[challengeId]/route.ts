import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { ok, err, withHandler, notFound } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { getChallengeLeaderboard } from "@/lib/gamification/challenge.service";

// GET /api/v1/client/challenges/[challengeId] - Get challenge details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ challengeId: string }> }
) {
  return withHandler(async () => {
    const auth = await requireRole(req, ["client"]);
    if (!auth.ok) return err(auth.message, auth.status);

    const { challengeId } = await params;

    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        participants: {
          where: { userId: auth.user.sub },
          select: {
            currentValue: true,
            completedAt: true,
            rank: true,
          },
        },
        _count: {
          select: { participants: true },
        },
        coach: {
          select: {
            displayName: true,
          },
        },
      },
    });

    if (!challenge) {
      return notFound("Desafío no encontrado");
    }

    // Get leaderboard
    const leaderboard = await getChallengeLeaderboard(challengeId, 10);

    const userProgress = challenge.participants[0];

    return ok({
      id: challenge.id,
      title: challenge.title,
      description: challenge.description,
      type: challenge.type,
      targetValue: challenge.targetValue,
      unit: challenge.unit,
      startDate: challenge.startDate.toISOString(),
      endDate: challenge.endDate?.toISOString(),
      xpReward: challenge.xpReward,
      participantCount: challenge._count.participants,
      createdBy: challenge.coach?.displayName ?? "YourCoachFit",
      joined: userProgress !== undefined,
      progress: userProgress
        ? {
            currentValue: userProgress.currentValue,
            targetValue: challenge.targetValue,
            percentComplete: Math.min(100, (userProgress.currentValue / challenge.targetValue) * 100),
            completed: !!userProgress.completedAt,
            rank: userProgress.rank,
          }
        : null,
      leaderboard,
    });
  });
}
