import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

export async function notifyCoachSessionCompleted(args: {
  clientUserId: string;
  sessionId: string;
  workoutTitle: string | null;
  energyRating: number | null;
}) {
  const rel = await prisma.coachClient.findFirst({
    where: { clientUserId: args.clientUserId, status: "active" },
    select: { coachUserId: true },
  });
  if (!rel) return;

  const [client, rpeAgg] = await Promise.all([
    prisma.user.findUnique({
      where: { id: args.clientUserId },
      select: { displayName: true, email: true },
    }),
    prisma.workoutSet.aggregate({
      where: { workoutSessionExercise: { workoutSessionId: args.sessionId }, rpe: { not: null } },
      _avg: { rpe: true },
    }),
  ]);

  const clientName = client?.displayName?.trim() || client?.email || "Tu alumno";
  const workoutTitle = args.workoutTitle?.trim() || "entrenamiento";
  const avg = rpeAgg._avg.rpe != null ? Number(rpeAgg._avg.rpe) : null;
  const rpe = avg != null && Number.isFinite(avg) ? Math.round(avg * 10) / 10 : null;
  const rpeLabel = rpe != null ? ` con RPE ${rpe}` : "";

  await notify({
    userId: rel.coachUserId,
    type: "session_completed",
    title: `${clientName} completó ${workoutTitle}${rpeLabel}`,
    body: args.energyRating != null ? `Energía ${args.energyRating}/5` : workoutTitle,
    linkUrl: `/coach/alumnos/${args.clientUserId}/sesiones/${args.sessionId}`,
    context: {
      clientUserId: args.clientUserId,
      clientName,
      sessionId: args.sessionId,
      workoutTitle,
      rpe,
    },
  });
}
