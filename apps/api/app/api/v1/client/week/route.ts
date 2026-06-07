import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";
import { getClientWeek } from "@/lib/training/client-week.service";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const data = await getClientWeek({ clientUserId: auth.user.sub });
    return ok(data);
  });
}
