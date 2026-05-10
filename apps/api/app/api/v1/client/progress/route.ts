import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { unauthorized, ok, withHandler } from "@/lib/api-response";
import { getProgressDashboard } from "@/lib/training/analytics.service";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const dashboard = await getProgressDashboard(auth.user.sub);
    return ok(dashboard);
  });
}