import { prisma } from "@/lib/prisma";
import { localCalendarDate } from "./local-date";
import { progressExercise } from "./session-prescription";
import { staleSessionCloseStatus, summarizeSessionProgress } from "./session-status";

const ACTIVE_GRACE_MS = 12 * 60 * 60 * 1000;

const STALE_SELECT = {
  id: true,
  performedAt: true,
  updatedAt: true,
  exercises: {
    select: {
      prescription: true,
      _count: { select: { sets: true } },
      workoutExercise: { select: { targetSets: true, workoutBlock: { select: { type: true } } } },
    },
  },
} as const;

/** A leftover session: previous calendar day and idle for 12h. Keep today's gym session open. */
export function isStaleInProgressSession(args: {
  performedAt: Date;
  updatedAt: Date;
  now?: Date;
}): boolean {
  const now = args.now ?? new Date();
  const lastActive = args.updatedAt.getTime() > args.performedAt.getTime() ? args.updatedAt : args.performedAt;
  if (now.getTime() - lastActive.getTime() < ACTIVE_GRACE_MS) return false;
  return localCalendarDate(lastActive) !== localCalendarDate(now);
}

/** Close leftover in-progress sessions from a previous day. Never closes a session still being trained. */
export async function expireStaleInProgressSessions(clientUserId: string, now = new Date()) {
  const open = await prisma.workoutSession.findMany({
    where: { clientUserId, status: "in_progress" },
    select: STALE_SELECT,
  });
  const stale = open.filter((session) => isStaleInProgressSession({
    performedAt: session.performedAt,
    updatedAt: session.updatedAt,
    now,
  }));
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
