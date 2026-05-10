import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { checkInactivityAndNotify, shouldSendWeeklySummary } from "@/lib/notifications/settings.service";
import { sendWeeklySummaryEmail, getAppUrl } from "@/lib/email";
import { getProgressDashboard } from "@/lib/training/analytics.service";
import { unauthorized, ok, withHandler } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    await checkInactivityAndNotify(auth.user.sub);

    if (await shouldSendWeeklySummary(auth.user.sub)) {
      const user = await prisma.user.findUnique({
        where: { id: auth.user.sub },
        select: { email: true, displayName: true },
      });

      if (user) {
        const now = new Date();
        const weekStart = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
        const weekEnd = now;

        const progress = await getProgressDashboard(auth.user.sub);
        const currentWeek = progress.weeklyProgress[progress.weeklyProgress.length - 1];

        await sendWeeklySummaryEmail({
          to: user.email,
          clientName: user.displayName ?? "Atleta",
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          data: {
            workoutsCompleted: currentWeek?.totalWorkouts ?? 0,
            totalVolume: currentWeek?.totalVolume ?? 0,
            prsCount: currentWeek?.prsCount ?? 0,
            topMuscles: (currentWeek?.topMuscles ?? []).map(m => ({ muscle: m.muscle, sets: m.sets })),
            avgEnergy: null,
            streakDays: 0,
          },
          appUrl: getAppUrl(),
        });
      }
    }

    return ok({ processed: true });
  });
}