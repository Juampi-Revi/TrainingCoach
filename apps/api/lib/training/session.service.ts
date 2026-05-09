import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

export async function createSession(clientUserId: string, data: { workoutTemplateId?: string; performedAt?: string }) {
  if (data.workoutTemplateId) {
    const active = await prisma.workoutSession.findFirst({
      where: { clientUserId, workoutTemplateId: data.workoutTemplateId, status: "in_progress" },
    });
    if (active) return { error: "Ya hay una sesión activa para este entrenamiento", existing: active };
  }

  const session = await prisma.workoutSession.create({
    data: {
      clientUserId,
      workoutTemplateId: data.workoutTemplateId,
      performedAt: data.performedAt ? new Date(data.performedAt) : new Date(),
      status: "in_progress",
    },
  });

  if (data.workoutTemplateId) {
    const workoutExercises = await prisma.workoutExercise.findMany({
      where: { workoutTemplateId: data.workoutTemplateId },
      orderBy: { sortOrder: "asc" },
    });
    for (const we of workoutExercises) {
      await prisma.workoutSessionExercise.create({
        data: {
          workoutSessionId: session.id,
          workoutExerciseId: we.id,
          plannedExerciseId: we.exerciseId,
          performedExerciseId: we.exerciseId,
          sortOrder: we.sortOrder,
        },
      });
    }
  }

  return session;
}

export function getSessionDetail(sessionId: string, clientUserId: string) {
  return prisma.workoutSession.findFirst({
    where: { id: sessionId, clientUserId },
    include: {
      exercises: {
        orderBy: { sortOrder: "asc" },
        include: {
          sets: { orderBy: { setNumber: "asc" } },
        },
      },
    },
  });
}

export async function updateSessionStatus(sessionId: string, clientUserId: string, status: string) {
  const session = await prisma.workoutSession.update({
    where: { id: sessionId, clientUserId },
    data: {
      status,
      completedAt: status === "completed" ? new Date() : undefined,
    },
  });

  if (status === "completed") {
    const coachLink = await prisma.coachClient.findFirst({
      where: { clientUserId, status: "active" },
    });
    if (coachLink) {
      notify({
        userId: coachLink.coachUserId,
        type: "session_completed",
        title: "Sesión completada",
        body: "Tu alumno completó una sesión",
        linkUrl: `/coach/alumnos/${clientUserId}/sesiones/${sessionId}`,
      });
    }
  }

  return session;
}

export async function addFreeExerciseToSession(sessionId: string, exerciseId: string, sortOrder: number = 0) {
  return prisma.workoutSessionExercise.create({
    data: { workoutSessionId: sessionId, performedExerciseId: exerciseId, sortOrder },
  });
}

export async function swapExercise(wseId: string, newExerciseId: string) {
  return prisma.workoutSessionExercise.update({
    where: { id: wseId },
    data: { performedExerciseId: newExerciseId, swapReason: "user_selection" },
  });
}

export async function createSet(wseId: string) {
  const maxSet = await prisma.workoutSet.aggregate({
    where: { workoutSessionExerciseId: wseId },
    _max: { setNumber: true },
  });
  return prisma.workoutSet.create({
    data: { workoutSessionExerciseId: wseId, setNumber: (maxSet._max.setNumber ?? 0) + 1 },
  });
}

export async function upsertSet(wseId: string, setNumber: number, data: { reps?: number; durationSeconds?: number; weight?: string; rpe?: string; rir?: string; notes?: string }) {
  return prisma.workoutSet.upsert({
    where: { workoutSessionExerciseId_setNumber: { workoutSessionExerciseId: wseId, setNumber } },
    create: { workoutSessionExerciseId: wseId, setNumber, ...data },
    update: data,
  });
}

export async function deleteSet(wseId: string, setNumber: number) {
  const deleted = await prisma.workoutSet.delete({
    where: { workoutSessionExerciseId_setNumber: { workoutSessionExerciseId: wseId, setNumber } },
  });
  const remaining = await prisma.workoutSet.findMany({
    where: { workoutSessionExerciseId: wseId },
    orderBy: { setNumber: "asc" },
  });
  const updates = remaining.map((s: { id: string }, i: number) =>
    prisma.workoutSet.update({ where: { id: s.id }, data: { setNumber: i + 1 } })
  );
  await prisma.$transaction(updates);
  return deleted;
}

export async function addComment(sessionId: string, authorUserId: string, text: string) {
  return prisma.sessionComment.create({ data: { sessionId, authorUserId, text } });
}

export function getSessionComments(sessionId: string) {
  return prisma.sessionComment.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });
}