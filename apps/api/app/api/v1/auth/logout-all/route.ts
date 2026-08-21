import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { ok, err, withHandler } from "@/lib/api-response";
import { revokeAllUserTokens } from "@/lib/auth/refresh-token.service";

/** Revoke the current user's refresh token (single-session storage today = logout everywhere). */
export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = await requireRole(req, ["coach", "client", "gym"]);
    if (!auth.ok) return err(auth.message, auth.status);

    await revokeAllUserTokens(auth.user.sub);

    return ok({ message: "Todas las sesiones fueron cerradas" });
  });
}
