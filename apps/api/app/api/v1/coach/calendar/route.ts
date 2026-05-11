import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";
import type { AssignmentStatus, CoachCalendarResponse, SessionStatus } from "@regen/types";
import { getCoachCalendar } from "@/lib/training/calendar.service";

function parseDateParam(raw: string | null): Date | null {
  if (!raw) return null;
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  return new Date(Date.UTC(y, mo - 1, d));
}

function isAssignmentStatus(val: string): val is AssignmentStatus {
  return val === "active" || val === "paused" || val === "finished";
}

function isSessionStatus(val: string): val is SessionStatus {
  return val === "in_progress" || val === "completed" || val === "discarded";
}

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const url = new URL(req.url);
    const start = parseDateParam(url.searchParams.get("start")) ?? new Date();
    const days = Math.max(1, Math.min(14, Number(url.searchParams.get("days") ?? "7") || 7));
    const clientId = url.searchParams.get("clientId")?.trim() || null;
    const planId = url.searchParams.get("planId")?.trim() || null;
    const assignmentStatusRaw = url.searchParams.get("assignmentStatus")?.trim() || null;
    const statusRaw = url.searchParams.get("status")?.trim() || null;
    const modeRaw = url.searchParams.get("mode")?.trim() || null;
    const mode = modeRaw === "fixed" ? "fixed" : "flex";

    const assignmentStatus: AssignmentStatus | null =
      assignmentStatusRaw && isAssignmentStatus(assignmentStatusRaw) ? assignmentStatusRaw : null;
    const filterStatus: "pending" | SessionStatus | null =
      statusRaw === "pending" ? "pending" : statusRaw && isSessionStatus(statusRaw) ? statusRaw : null;

    const data: CoachCalendarResponse = await getCoachCalendar({
      coachUserId: auth.user.sub,
      start,
      days,
      clientId,
      planId,
      assignmentStatus,
      status: filterStatus,
      mode,
    });

    return ok(data);
  });
}
