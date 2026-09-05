import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { getNotificationSettings, shouldSendWeeklySummary } from "@/lib/notifications/settings.service";

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function isoDateUTC(date: Date) {
  return date.toISOString().slice(0, 10);
}

function daysSince(date: Date) {
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

function parseClientIdFromLinkUrl(linkUrl: string | null) {
  if (!linkUrl) return null;
  const m = linkUrl.match(/^\/coach\/alumnos\/([^/]+)/);
  return m?.[1] ?? null;
}

async function getCoachActiveClientIds(coachUserId: string) {
  const rels = await prisma.coachClient.findMany({
    where: { coachUserId, status: "active" },
    select: { clientUserId: true },
  });
  return rels.map((r) => r.clientUserId);
}

async function computeCoachInactiveClients(args: { coachUserId: string; thresholdDays: number }) {
  const { coachUserId, thresholdDays } = args;
  const clientIds = await getCoachActiveClientIds(coachUserId);
  if (clientIds.length === 0) return { clientIds, inactiveClients: [] as Array<{ clientUserId: string; days: number }> };

  const lastCompleted = await prisma.workoutSession.groupBy({
    by: ["clientUserId"],
    where: { clientUserId: { in: clientIds }, status: "completed" },
    _max: { performedAt: true },
  });
  const lastCompletedByClient = new Map(lastCompleted.map((r) => [r.clientUserId, r._max.performedAt ?? null]));

  const assignments = await prisma.planAssignment.findMany({
    where: {
      clientUserId: { in: clientIds },
      OR: [{ status: "active" }, { status: "paused" }],
      plan: { coachUserId },
    },
    orderBy: { createdAt: "desc" },
    select: { clientUserId: true, startDate: true },
  });
  const startDateByClient = new Map<string, Date>();
  for (const a of assignments) {
    if (!startDateByClient.has(a.clientUserId) && a.startDate) startDateByClient.set(a.clientUserId, startOfDayUTC(a.startDate));
  }

  const inactiveClients: Array<{ clientUserId: string; days: number }> = [];
  for (const clientUserId of clientIds) {
    const last = lastCompletedByClient.get(clientUserId) ?? null;
    const base = last ?? startDateByClient.get(clientUserId) ?? null;
    if (!base) continue;
    const d = daysSince(base);
    if (d >= thresholdDays) inactiveClients.push({ clientUserId, days: d });
  }
  inactiveClients.sort((a, b) => b.days - a.days);

  return { clientIds, inactiveClients };
}

export async function checkCoachClientInactivityAndNotify(coachUserId: string) {
  const settings = await getNotificationSettings(coachUserId);
  if (!settings?.inactivityAlert) return { inactive: 0, sent: 0, skipped: 0 };

  const thresholdDays = Math.max(1, settings.inactivityDays ?? 3);
  const { clientIds, inactiveClients } = await computeCoachInactiveClients({ coachUserId, thresholdDays });
  if (clientIds.length === 0) return { inactive: 0, sent: 0, skipped: 0 };

  const users = await prisma.user.findMany({
    where: { id: { in: clientIds } },
    select: { id: true, email: true, displayName: true },
  });
  const userById = new Map(users.map((u) => [u.id, u]));

  const windowStart = new Date(Date.now() - 2 * 86_400_000);
  const recent = await prisma.notification.findMany({
    where: { userId: coachUserId, type: "client_inactive", createdAt: { gte: windowStart } },
    select: { linkUrl: true },
  });
  const recentlyNotifiedClientIds = new Set(recent.map((n) => parseClientIdFromLinkUrl(n.linkUrl)).filter((x): x is string => !!x));

  let sent = 0;
  let skipped = 0;
  const maxSends = 20;
  for (const it of inactiveClients) {
    if (sent >= maxSends) break;
    if (recentlyNotifiedClientIds.has(it.clientUserId)) {
      skipped++;
      continue;
    }
    const u = userById.get(it.clientUserId);
    const label = u?.displayName?.trim() || u?.email || "Alumno";
    await notify({
      userId: coachUserId,
      type: "client_inactive",
      title: `${label} no entrena hace ${it.days} días`,
      body: "Abrí el chat o ajustá el plan.",
      linkUrl: `/coach/alumnos/${it.clientUserId}`,
      context: { clientUserId: it.clientUserId, clientName: label, daysInactive: it.days },
    });
    sent++;
  }

  return { inactive: inactiveClients.length, sent, skipped };
}

export async function sendCoachWeeklySummaryIfDue(coachUserId: string) {
  if (!(await shouldSendWeeklySummary(coachUserId))) return { sent: false };

  const settings = await getNotificationSettings(coachUserId);
  if (!settings?.weeklySummary) return { sent: false };

  const clientIds = await getCoachActiveClientIds(coachUserId);
  if (clientIds.length === 0) return { sent: false };

  const now = new Date();
  const weekStart = new Date(now.getTime() - 6 * 86_400_000);

  const thresholdDays = Math.max(1, settings.inactivityDays ?? 3);
  const [{ inactiveClients }, completedCount] = await Promise.all([
    computeCoachInactiveClients({ coachUserId, thresholdDays }),
    prisma.workoutSession.count({
      where: { clientUserId: { in: clientIds }, status: "completed", performedAt: { gte: weekStart } },
    }),
  ]);

  const dedupStart = new Date(Date.now() - 5 * 86_400_000);
  const already = await prisma.notification.findFirst({
    where: { userId: coachUserId, type: "coach_weekly_summary", createdAt: { gte: dedupStart } },
    select: { id: true },
  });
  if (already) return { sent: false };

  await notify({
    userId: coachUserId,
    type: "coach_weekly_summary",
    title: "Resumen semanal",
    body: `Sesiones completadas: ${completedCount} · Inactivos: ${inactiveClients.length}`,
    linkUrl: "/coach/notificaciones",
  });

  return { sent: true, weekStart: isoDateUTC(weekStart), weekEnd: isoDateUTC(now) };
}
