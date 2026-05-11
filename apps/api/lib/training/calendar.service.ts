import { prisma } from "@/lib/prisma";
import type { AssignmentStatus, CoachCalendarResponse, SessionStatus } from "@regen/types";

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function isoDateUTC(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function getCoachCalendar(args: {
  coachUserId: string;
  start: Date;
  days: number;
  clientId?: string | null;
  planId?: string | null;
  assignmentStatus?: AssignmentStatus | null;
  status?: "pending" | SessionStatus | null;
  mode?: "fixed" | "flex";
}): Promise<CoachCalendarResponse> {
  const { coachUserId, start, days, clientId, planId, assignmentStatus, status, mode = "flex" } = args;
  const rangeStart = startOfDayUTC(start);
  const rangeEnd = new Date(rangeStart.getTime() + days * 86_400_000);

  const coachClients = await prisma.coachClient.findMany({
    where: { coachUserId, status: "active", ...(clientId ? { clientUserId: clientId } : {}) },
    include: { client: { select: { id: true, email: true, displayName: true } } },
  });
  const allowedClientIds = coachClients.map((c) => c.clientUserId);
  if (allowedClientIds.length === 0) return { range: { start: isoDateUTC(rangeStart), days }, mode, items: [], weekOverview: [] };

  const assignments = await prisma.planAssignment.findMany({
    where: {
      clientUserId: { in: allowedClientIds },
      ...(assignmentStatus ? { status: assignmentStatus } : { OR: [{ status: "active" }, { status: "paused" }] }),
      ...(planId ? { planId } : {}),
      plan: { coachUserId },
    },
    include: { plan: { select: { id: true, title: true, periodDays: true, weeksCount: true } } },
    orderBy: { createdAt: "desc" },
  });

  const assignmentByClient = new Map<string, (typeof assignments)[number]>();
  for (const a of assignments) {
    if (!assignmentByClient.has(a.clientUserId)) assignmentByClient.set(a.clientUserId, a);
  }

  const clientById = new Map(coachClients.map((c) => [c.clientUserId, c.client]));

  function computeWeekAndDay(a: (typeof assignments)[number], date: Date) {
    const planDays = Math.max(1, a.plan.periodDays);
    const baseStart = a.startDate ? startOfDayUTC(a.startDate) : rangeStart;
    const startMs = baseStart.getTime();
    const diffDays = Math.floor((startOfDayUTC(date).getTime() - startMs) / 86_400_000);
    if (diffDays < 0) return null;
    const totalWeeks = a.plan.weeksCount > 0 ? a.plan.weeksCount : 1;
    const weekNumberRaw = Math.floor(diffDays / planDays) + 1;
    const weekNumber = Math.max(1, Math.min(totalWeeks, weekNumberRaw));
    const sortOrder = diffDays % planDays;
    const weekStart = new Date(startMs + (weekNumber - 1) * planDays * 86_400_000);
    const weekEnd = new Date(weekStart.getTime() + planDays * 86_400_000);
    return { weekNumber, sortOrder, planDays, baseStart, weekStart, weekEnd };
  }

  const weekPairs: Array<{ planId: string; weekNumber: number }> = [];
  const seenPairs = new Set<string>();
  const weekAtRangeStartByClient = new Map<string, { weekNumber: number; weekStart: Date; weekEnd: Date }>();
  let minSessionStart = rangeStart;
  let maxSessionEnd = rangeEnd;

  for (const [clientUserId, a] of assignmentByClient.entries()) {
    const atStart = computeWeekAndDay(a, rangeStart);
    if (atStart) {
      weekAtRangeStartByClient.set(clientUserId, { weekNumber: atStart.weekNumber, weekStart: atStart.weekStart, weekEnd: atStart.weekEnd });
      if (atStart.weekStart.getTime() < minSessionStart.getTime()) minSessionStart = atStart.weekStart;
      if (atStart.weekEnd.getTime() > maxSessionEnd.getTime()) maxSessionEnd = atStart.weekEnd;
    }

    for (let i = 0; i < days; i++) {
      const day = new Date(rangeStart.getTime() + i * 86_400_000);
      const wd = computeWeekAndDay(a, day);
      if (!wd) continue;
      const key = `${a.plan.id}:${wd.weekNumber}`;
      if (seenPairs.has(key)) continue;
      seenPairs.add(key);
      weekPairs.push({ planId: a.plan.id, weekNumber: wd.weekNumber });
    }
  }

  const planWeeks = weekPairs.length
    ? await prisma.planWeek.findMany({
        where: { OR: weekPairs },
        include: {
          workouts: {
            orderBy: { sortOrder: "asc" },
            include: {
              workoutTemplate: {
                select: { id: true, title: true, tags: true, workoutExercises: { select: { id: true } } },
              },
            },
          },
        },
      })
    : [];

  const cellBySlot = new Map<
    string,
    { pwwId: string; workoutTemplateId: string; title: string; tags: string[]; exerciseCount: number; progressionNote: string | null }
  >();
  const cellQueuesByTemplate = new Map<
    string,
    Array<{ pwwId: string; workoutTemplateId: string; title: string; tags: string[]; exerciseCount: number; progressionNote: string | null }>
  >();

  for (const w of planWeeks) {
    for (const pw of w.workouts) {
      const tpl = pw.workoutTemplate;
      const cell = {
        pwwId: pw.id,
        workoutTemplateId: tpl.id,
        title: tpl.title,
        tags: tpl.tags,
        exerciseCount: tpl.workoutExercises.length,
        progressionNote: pw.progressionNote ?? null,
      };
      cellBySlot.set(`${w.planId}:${w.weekNumber}:${pw.sortOrder}`, cell);
      const k = `${w.planId}:${w.weekNumber}:${tpl.id}`;
      const q = cellQueuesByTemplate.get(k) ?? [];
      q.push(cell);
      cellQueuesByTemplate.set(k, q);
    }
  }

  const sessions = await prisma.workoutSession.findMany({
    where: {
      clientUserId: { in: Array.from(assignmentByClient.keys()) },
      performedAt: { gte: minSessionStart, lt: maxSessionEnd },
      status: { not: "discarded" },
    },
    select: { id: true, clientUserId: true, workoutTemplateId: true, status: true, performedAt: true },
    orderBy: { performedAt: "asc" },
  });

  const sessionTemplateIds = Array.from(new Set(sessions.map((s) => s.workoutTemplateId).filter((x): x is string => !!x)));
  const templates = sessionTemplateIds.length
    ? await prisma.workoutTemplate.findMany({
        where: { id: { in: sessionTemplateIds } },
        select: { id: true, title: true, tags: true, workoutExercises: { select: { id: true } } },
      })
    : [];
  const templateById = new Map(templates.map((t) => [t.id, t]));

  const sessionsByClientDate: Map<string, Map<string, Array<{ id: string; status: string; performedAt: Date; workoutTemplateId: string }>>> = new Map();
  const sessionsByClientDateTemplate = new Map<string, Array<{ id: string; status: string; performedAt: Date }>>();

  for (const s of sessions) {
    if (!s.workoutTemplateId) continue;
    const dateKey = isoDateUTC(startOfDayUTC(s.performedAt));
    const byDate = sessionsByClientDate.get(s.clientUserId) ?? new Map();
    const arr = byDate.get(dateKey) ?? [];
    arr.push({ id: s.id, status: s.status, performedAt: s.performedAt, workoutTemplateId: s.workoutTemplateId });
    byDate.set(dateKey, arr);
    sessionsByClientDate.set(s.clientUserId, byDate);

    const k = `${s.clientUserId}:${dateKey}:${s.workoutTemplateId}`;
    const q = sessionsByClientDateTemplate.get(k) ?? [];
    q.push({ id: s.id, status: s.status, performedAt: s.performedAt });
    sessionsByClientDateTemplate.set(k, q);
  }

  const weekOverview: NonNullable<CoachCalendarResponse["weekOverview"]> = [];
  for (const [clientUserId, a] of assignmentByClient.entries()) {
    const client = clientById.get(clientUserId);
    const ww = weekAtRangeStartByClient.get(clientUserId);
    if (!client || !ww) continue;

    const planWeek = planWeeks.find((w) => w.planId === a.plan.id && w.weekNumber === ww.weekNumber) ?? null;

    const weekSessions = sessions.filter((s) => {
      if (s.clientUserId !== clientUserId) return false;
      return s.performedAt >= ww.weekStart && s.performedAt < ww.weekEnd && s.workoutTemplateId != null;
    });

    const sessionsByTemplate = new Map<string, typeof weekSessions>();
    for (const s of weekSessions) {
      if (!s.workoutTemplateId) continue;
      const arr = sessionsByTemplate.get(s.workoutTemplateId) ?? [];
      arr.push(s);
      sessionsByTemplate.set(s.workoutTemplateId, arr);
    }

    const workouts = (planWeek?.workouts ?? []).map((pw) => {
      const tpl = pw.workoutTemplate;
      const ss = sessionsByTemplate.get(tpl.id) ?? [];
      const session = ss.shift() ?? null;
      return {
        pwwId: pw.id,
        workoutTemplateId: tpl.id,
        title: tpl.title,
        description: null,
        tags: tpl.tags,
        exerciseCount: tpl.workoutExercises.length,
        progressionNote: pw.progressionNote ?? null,
        session: session
          ? { id: session.id, status: session.status as SessionStatus, performedAt: session.performedAt.toISOString() }
          : null,
      };
    });

    weekOverview.push({
      client: { id: client.id, name: client.displayName ?? null, email: client.email },
      assignment: { id: a.id, status: a.status as AssignmentStatus, plan: { id: a.plan.id, title: a.plan.title }, startDate: a.startDate ? isoDateUTC(a.startDate) : null },
      weekNumber: ww.weekNumber,
      workouts,
    });
  }

  const items: CoachCalendarResponse["items"] = [];
  for (const [clientUserId, a] of assignmentByClient.entries()) {
    const client = clientById.get(clientUserId);
    if (!client) continue;

    for (let i = 0; i < days; i++) {
      const day = new Date(rangeStart.getTime() + i * 86_400_000);
      const dateKey = isoDateUTC(day);

      if (mode === "fixed") {
        const wd = computeWeekAndDay(a, day);
        if (!wd) continue;
        const workout = cellBySlot.get(`${a.plan.id}:${wd.weekNumber}:${wd.sortOrder}`) ?? null;
        if (!workout) continue;

        const sk = `${clientUserId}:${dateKey}:${workout.workoutTemplateId}`;
        const session = (sessionsByClientDateTemplate.get(sk) ?? []).shift() ?? null;

        const row = {
          date: dateKey,
          client: { id: client.id, name: client.displayName ?? null, email: client.email },
          assignment: { id: a.id, status: a.status as AssignmentStatus, plan: { id: a.plan.id, title: a.plan.title }, startDate: a.startDate ? isoDateUTC(a.startDate) : null },
          weekNumber: wd.weekNumber,
          sortOrder: wd.sortOrder,
          workout,
          session: session ? { id: session.id, status: session.status as SessionStatus, performedAt: session.performedAt.toISOString() } : null,
        } satisfies CoachCalendarResponse["items"][number];

        if (status === "pending" && row.session) continue;
        if (status && status !== "pending" && row.session?.status !== status) continue;
        items.push(row);
        continue;
      }

      const byDate = sessionsByClientDate.get(clientUserId)?.get(dateKey) ?? [];
      for (const s of byDate) {
        const wd = computeWeekAndDay(a, s.performedAt);
        const weekNumber = wd?.weekNumber ?? null;
        const queueKey = weekNumber ? `${a.plan.id}:${weekNumber}:${s.workoutTemplateId}` : null;
        const planned = queueKey ? (cellQueuesByTemplate.get(queueKey) ?? []).shift() ?? null : null;
        const tpl = templateById.get(s.workoutTemplateId) ?? null;

        const workout =
          planned ??
          (tpl
            ? {
                pwwId: "",
                workoutTemplateId: tpl.id,
                title: tpl.title,
                tags: tpl.tags,
                exerciseCount: tpl.workoutExercises.length,
                progressionNote: null,
              }
            : null);

        if (!workout) continue;

        const row = {
          date: dateKey,
          client: { id: client.id, name: client.displayName ?? null, email: client.email },
          assignment: { id: a.id, status: a.status as AssignmentStatus, plan: { id: a.plan.id, title: a.plan.title }, startDate: a.startDate ? isoDateUTC(a.startDate) : null },
          weekNumber,
          sortOrder: null,
          workout,
          session: { id: s.id, status: s.status as SessionStatus, performedAt: s.performedAt.toISOString() },
        } satisfies CoachCalendarResponse["items"][number];

        const desired = status === "pending" ? null : status;
        if (desired && row.session?.status !== desired) continue;
        items.push(row);
      }
    }
  }

  return { range: { start: isoDateUTC(rangeStart), days }, mode, items, weekOverview };
}
