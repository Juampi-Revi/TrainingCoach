import { prisma } from "@/lib/prisma";
import type { GlobalSearchResponse } from "@regen/types";

const LIMIT = 5;

export async function searchCoachCatalog(coachUserId: string, q: string): Promise<GlobalSearchResponse> {
  const query = q.trim();
  if (query.length < 1) {
    return { clients: [], plans: [], workouts: [], exercises: [] };
  }

  const contains = { contains: query, mode: "insensitive" as const };

  const [relations, plans, workouts, exercises] = await Promise.all([
    prisma.coachClient.findMany({
      where: {
        coachUserId,
        status: "active",
        client: { OR: [{ displayName: contains }, { email: contains }] },
      },
      take: LIMIT,
      include: { client: { select: { id: true, displayName: true, email: true } } },
    }),
    prisma.plan.findMany({
      where: { coachUserId, title: contains },
      take: LIMIT,
      select: { id: true, title: true, status: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.workoutTemplate.findMany({
      where: { coachUserId, title: contains },
      take: LIMIT,
      select: { id: true, title: true, tags: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.exercise.findMany({
      where: {
        AND: [
          { OR: [{ coachUserId }, { isSystem: true }] },
          { name: contains },
        ],
      },
      take: LIMIT,
      select: { id: true, name: true, primaryMuscle: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    clients: relations.map((r) => ({
      id: r.client.id,
      kind: "client" as const,
      title: r.client.displayName?.trim() || r.client.email,
      subtitle: r.client.displayName ? r.client.email : null,
      href: `/coach/alumnos/${r.client.id}`,
    })),
    plans: plans.map((p) => ({
      id: p.id,
      kind: "plan" as const,
      title: p.title,
      subtitle: p.status,
      href: `/coach/planes/${p.id}`,
    })),
    workouts: workouts.map((w) => ({
      id: w.id,
      kind: "workout" as const,
      title: w.title,
      subtitle: w.tags[0] ?? null,
      href: `/coach/workouts/${w.id}`,
    })),
    exercises: exercises.map((e) => ({
      id: e.id,
      kind: "exercise" as const,
      title: e.name,
      subtitle: e.primaryMuscle,
      href: `/coach/ejercicios?q=${encodeURIComponent(e.name)}`,
    })),
  };
}
