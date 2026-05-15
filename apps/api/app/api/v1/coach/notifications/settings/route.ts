import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err, withHandler } from "@/lib/api-response";
import { getNotificationSettings, upsertNotificationSettings, type NotificationSettingsData } from "@/lib/notifications/settings.service";

function toBool(v: unknown) {
  return typeof v === "boolean" ? v : undefined;
}

function toInt(v: unknown) {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Math.trunc(Number(v));
  return undefined;
}

function toString(v: unknown) {
  return typeof v === "string" ? v : undefined;
}

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const existing = await getNotificationSettings(auth.user.sub);
    if (existing) return ok(existing);

    const created = await upsertNotificationSettings(auth.user.sub, {});
    return ok(created);
  });
}

export async function PUT(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return err("Body inválido", 400);

    const b = body as Record<string, unknown>;
    const data: NotificationSettingsData = {
      ...(toBool(b.inactivityAlert) !== undefined && { inactivityAlert: toBool(b.inactivityAlert) }),
      ...(toInt(b.inactivityDays) !== undefined && { inactivityDays: Math.max(1, toInt(b.inactivityDays)!) }),
      ...(toBool(b.weeklySummary) !== undefined && { weeklySummary: toBool(b.weeklySummary) }),
      ...(toString(b.weeklySummaryDay) !== undefined && { weeklySummaryDay: toString(b.weeklySummaryDay) }),
      ...(toBool(b.pushNotifications) !== undefined && { pushNotifications: toBool(b.pushNotifications) }),
      ...(toBool(b.emailNotifications) !== undefined && { emailNotifications: toBool(b.emailNotifications) }),
    };

    const updated = await upsertNotificationSettings(auth.user.sub, data);
    return ok(updated);
  });
}
