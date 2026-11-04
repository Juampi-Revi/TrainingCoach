import { withHandler, ok } from "@/lib/api-response";
import { requireAssistantBeta } from "@/lib/assistant/require-beta";
import { range } from "@/lib/assistant/journal.service";

export async function GET(req: Request) {
  return withHandler(async () => {
    const auth = requireAssistantBeta(req);
    if (auth instanceof Response) return auth;
    const url = new URL(req.url);
    const kind = url.searchParams.get("kind") === "month" ? "month" : "week";
    return ok(await range(auth.user.sub, kind));
  });
}
