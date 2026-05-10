import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { unauthorized, ok, err, withHandler } from "@/lib/api-response";
import { getNotificationSettings, upsertNotificationSettings } from "@/lib/notifications/settings.service";

const VALID_DAYS = ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"];

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const existing = await getNotificationSettings(auth.user.sub);
    if (existing) return ok(existing);

    const created = await upsertNotificationSettings(auth.user.sub, {});
    return ok(created);
  });
}

export async function PUT(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json();

    if (body.reminderTime) {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRegex.test(body.reminderTime)) {
        return err("reminderTime debe estar en formato HH:MM", 400);
      }
    }

    if (body.reminderDays) {
      if (!Array.isArray(body.reminderDays)) {
        return err("reminderDays debe ser un array", 400);
      }
      const invalidDays = body.reminderDays.filter((d: unknown) => !VALID_DAYS.includes(String(d)));
      if (invalidDays.length > 0) {
        return err(`Días inválidos: ${invalidDays.join(", ")}`, 400);
      }
    }

    if (body.weeklySummaryDay && !VALID_DAYS.includes(body.weeklySummaryDay)) {
      return err(`weeklySummaryDay inválido. Usar: ${VALID_DAYS.join(", ")}`, 400);
    }

    const updated = await upsertNotificationSettings(auth.user.sub, body);
    return ok(updated);
  });
}
