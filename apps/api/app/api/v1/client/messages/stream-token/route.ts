import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";
import { createSseToken } from "@/lib/sse-tokens";

// POST /api/v1/client/messages/stream-token
// Exchange a Bearer JWT for a short-lived (60s) one-time SSE token.
// This keeps the JWT out of browser history and proxy access logs.
export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const token = createSseToken(auth.user.sub);
    return ok({ token });
  });
}
