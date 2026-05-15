import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";
import { checkCoachClientInactivityAndNotify, sendCoachWeeklySummaryIfDue } from "@/lib/notifications/coach-alerts.service";

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const [inactivity, weekly] = await Promise.all([
      checkCoachClientInactivityAndNotify(auth.user.sub),
      sendCoachWeeklySummaryIfDue(auth.user.sub),
    ]);

    return ok({ inactivity, weekly });
  });
}

