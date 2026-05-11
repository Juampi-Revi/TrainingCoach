import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, forbidden, notFound, err, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ planId: string; assignmentId: string }> };

function startOfDayUTC(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function parseDateOnly(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { planId, assignmentId } = await params;

    const plan = await prisma.plan.findFirst({
      where: { id: planId, coachUserId: auth.user.sub },
      select: { id: true },
    });
    if (!plan) return forbidden();

    const existing = await prisma.planAssignment.findFirst({
      where: { id: assignmentId, planId },
      select: { id: true },
    });
    if (!existing) return notFound("Assignment not found");

    const body = await req.json().catch(() => ({}));
    const status = (body as Record<string, unknown>).status;
    const startDate = (body as Record<string, unknown>).startDate;

    const data: { status?: string; startDate?: Date | null } = {};

    if (status !== undefined) {
      if (status !== "active" && status !== "paused" && status !== "finished") {
        return err("status inválido", 400);
      }
      data.status = status;
    }

    if (startDate !== undefined) {
      if (startDate === null) {
        data.startDate = null;
      } else if (typeof startDate === "string") {
        const parsed = parseDateOnly(startDate);
        if (!parsed) return err("startDate inválido (YYYY-MM-DD)", 400);
        data.startDate = parsed;
      } else {
        return err("startDate inválido", 400);
      }
    }

    const updated = await prisma.planAssignment.update({
      where: { id: assignmentId },
      data,
      select: { id: true, status: true, startDate: true, clientUserId: true },
    });

    return ok({
      id: updated.id,
      status: updated.status,
      startDate: updated.startDate ? startOfDayUTC(updated.startDate).toISOString().slice(0, 10) : null,
    });
  });
}
