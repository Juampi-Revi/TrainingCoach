import { prisma } from "@/lib/prisma";
import { localCalendarDate } from "./local-date";
import { progressExercise } from "./session-prescription";
import { staleSessionCloseStatus, summarizeSessionProgress } from "./session-status";

const STALE_SELECT = {
  id: true,
  performedAt: true,
  exercises: {
    select: {
      prescription: true,
      _count: { select: { sets: true } },
      workoutExercise: { select: { targetSets: true, workoutBlock: { select: { type: true } } } },
    },
  },
} as const;

/** Close leftover in-progress sessions that were not started today. */
export async function expireStaleInProgressSessions(clientUserId: string, now = new Date()) {
  const today = localCalendarDate(now);
  const open = await prisma.workoutSession.findMany({
    where: { clientUserId, status: "in_progress" },
    select: STALE_SELECT,
  });
  const stale = open.filter((session) => localCalendarDate(session.performedAt) !== today);
  if (stale.length === 0) return;

  await prisma.$transaction(
    stale.map((session) => {
      const summary = summarizeSessionProgress(session.exercises.map((exercise) => progressExercise(exercise)));
      const status = staleSessionCloseStatus(summary);
      return prisma.workoutSession.update({
        where: { id: session.id },
        data: {
          status,
          completedAt: status === "discarded" ? null : now,
        },
      });
    }),
  );
}
