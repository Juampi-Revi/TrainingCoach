import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err, withHandler } from "@/lib/api-response";
import { syncUserProvider } from "@/lib/health/sync-engine";

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const result = await syncUserProvider(auth.user.sub, "strava");

    if (!result.success) {
      return err(result.errors.join(", "), 500);
    }

    return ok({
      success: true,
      syncedDays: result.syncedDays,
      message: `${result.syncedDays} días sincronizados`,
    });
  });
}
