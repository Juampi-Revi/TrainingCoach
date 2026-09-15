import { prisma } from "@/lib/prisma";
import { emptySessionEffort, summarizeSets } from "@/lib/training/effort";

export async function getWeekEffort(clientUserId: string, days = 7) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (days - 1));

  const sessions = await prisma.workoutSession.findMany({
    where: {
      clientUserId,
      performedAt: { gte: start },
      status: { in: ["completed", "partial", "in_progress"] },
    },
    select: {
      id: true,
      exercises: {
        select: {
          performedExercise: { select: { primaryMuscle: true } },
          workoutExercise: { select: { workoutBlock: { select: { type: true } } } },
          sets: { select: { reps: true, weight: true, rpe: true, rir: true } },
        },
      },
    },
  });

  const sets = sessions.flatMap((session) =>
    session.exercises.flatMap((ex) =>
      ex.sets.map((set) => ({
        reps: set.reps,
        weight: set.weight != null ? Number(set.weight) : null,
        rpe: set.rpe != null ? Number(set.rpe) : null,
        rir: set.rir != null ? Number(set.rir) : null,
        blockType: ex.workoutExercise?.workoutBlock?.type ?? null,
        muscle: ex.performedExercise.primaryMuscle,
      })),
    ),
  );

  return {
    sessions: sessions.length,
    summary: sets.length ? summarizeSets(sets) : emptySessionEffort(),
  };
}

export function sessionEffortFromDetail(exercises: Array<{
  block?: { type?: string | null } | null;
  exercise?: { primaryMuscle?: string | null } | null;
  sets: Array<{ reps: number | null; weight: string | number | null; rpe: string | number | null; rir: string | number | null }>;
}>) {
  const sets = exercises.flatMap((ex) =>
    ex.sets.map((set) => ({
      reps: set.reps,
      weight: set.weight != null ? Number(set.weight) : null,
      rpe: set.rpe != null ? Number(set.rpe) : null,
      rir: set.rir != null ? Number(set.rir) : null,
      blockType: ex.block?.type ?? null,
      muscle: ex.exercise?.primaryMuscle ?? null,
    })),
  );
  return summarizeSets(sets);
}
