import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { asDate, isoOf, localDate } from "./calendar";
import { fold } from "./portions";
import { isSupplementTime, localHour, shouldRemindAt } from "./supplement-windows";

export { shouldRemindAt, localHour, isSupplementTime, SUPPLEMENT_TIMES } from "./supplement-windows";
export type { SupplementTime } from "./supplement-windows";

export async function listSupplements(userId: string) {
  const rows = await prisma.nutritionSupplement.findMany({
    where: { clientUserId: userId, active: true },
    orderBy: { createdAt: "asc" },
  });
  return { supplements: rows.map(view) };
}

export async function addSupplement(
  userId: string,
  input: { name: string; timeOfDay: string; note?: string; remind?: boolean },
) {
  const name = input.name.trim();
  if (!name) return { error: "name_required" as const };
  if (!isSupplementTime(input.timeOfDay)) return { error: "time_invalid" as const };
  const existing = await prisma.nutritionSupplement.findMany({
    where: { clientUserId: userId, active: true },
    select: { id: true, name: true, timeOfDay: true, note: true, remind: true },
  });
  const match = existing.find((row) => fold(row.name) === fold(name));
  if (match) {
    const updated = await prisma.nutritionSupplement.update({
      where: { id: match.id },
      data: {
        timeOfDay: input.timeOfDay,
        note: input.note?.trim() || match.note,
        remind: input.remind ?? match.remind,
      },
    });
    return view(updated);
  }
  const created = await prisma.nutritionSupplement.create({
    data: {
      clientUserId: userId,
      name,
      timeOfDay: input.timeOfDay,
      note: input.note?.trim() || null,
      remind: input.remind ?? true,
    },
  });
  return view(created);
}

export async function updateSupplement(
  userId: string,
  supplementId: string,
  patch: { name?: string; timeOfDay?: string; note?: string | null; remind?: boolean; active?: boolean },
) {
  const current = await prisma.nutritionSupplement.findFirst({
    where: { id: supplementId, clientUserId: userId },
  });
  if (!current) return { error: "not_found" as const };
  if (patch.timeOfDay && !isSupplementTime(patch.timeOfDay)) return { error: "time_invalid" as const };
  const updated = await prisma.nutritionSupplement.update({
    where: { id: current.id },
    data: {
      ...(patch.name?.trim() ? { name: patch.name.trim() } : {}),
      ...(patch.timeOfDay ? { timeOfDay: patch.timeOfDay } : {}),
      ...(patch.note !== undefined ? { note: patch.note?.trim() || null } : {}),
      ...(patch.remind !== undefined ? { remind: patch.remind } : {}),
      ...(patch.active !== undefined ? { active: patch.active } : {}),
    },
  });
  return view(updated);
}

export async function removeSupplement(userId: string, input: { supplementId?: string; name?: string }) {
  const rows = await prisma.nutritionSupplement.findMany({
    where: { clientUserId: userId, active: true },
  });
  const target = input.supplementId
    ? rows.find((row) => row.id === input.supplementId)
    : input.name
      ? rows.find((row) => fold(row.name) === fold(input.name ?? ""))
      : undefined;
  if (!target) return { error: "not_found" as const };
  await prisma.nutritionSupplement.update({
    where: { id: target.id },
    data: { active: false },
  });
  return { removed: true as const, id: target.id, name: target.name };
}

export async function sendDueSupplementReminders(now = new Date()) {
  const isoDate = localDate(now);
  const hour = localHour(now);
  const rows = await prisma.nutritionSupplement.findMany({
    where: { active: true, remind: true },
    include: { logs: { where: { localDate: asDate(isoDate) }, take: 1 } },
  });
  const due = rows.filter((row) => {
    if (row.logs.length > 0) return false;
    if (row.lastRemindedOn && isoOf(row.lastRemindedOn) === isoDate) return false;
    return shouldRemindAt(row.timeOfDay, hour);
  });
  const grouped = new Map<string, typeof due>();
  for (const row of due) {
    const list = grouped.get(row.clientUserId) ?? [];
    list.push(row);
    grouped.set(row.clientUserId, list);
  }
  let sent = 0;
  for (const [userId, items] of grouped) {
    const names = items.map((item) => item.name);
    await prisma.nutritionSupplement.updateMany({
      where: { id: { in: items.map((item) => item.id) } },
      data: { lastRemindedOn: asDate(isoDate) },
    });
    await notify({
      userId,
      type: "supplement_reminder",
      title: names.length === 1 ? `¿Tomaste ${names[0]}?` : "Suplementos pendientes",
      body: names.length === 1
        ? "Tocá para marcar si lo tomaste hoy."
        : `¿Tomaste ${joinNames(names)}?`,
      linkUrl: "/asistente",
    });
    sent += 1;
  }
  return { sent, pending: due.length };
}

function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  if (names.length === 2) return `${names[0]} y ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} y ${names[names.length - 1]}`;
}

function view(row: { id: string; name: string; timeOfDay: string; note: string | null; remind: boolean }) {
  return {
    id: row.id,
    name: row.name,
    timeOfDay: row.timeOfDay,
    note: row.note,
    remind: row.remind,
  };
}
