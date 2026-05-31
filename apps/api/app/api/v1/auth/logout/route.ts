import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { ok, err, withHandler } from "@/lib/api-response";
import { revokeRefreshToken } from "@/lib/auth/refresh-token.service";

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = await requireRole(req, ["coach", "client", "gym"]);
    if (!auth.ok) return err(auth.message, auth.status);

    // Revoke the user's refresh token
    await revokeRefreshToken(auth.user.sub);

    return ok({ message: "Sesión cerrada exitosamente" });
  });
}
