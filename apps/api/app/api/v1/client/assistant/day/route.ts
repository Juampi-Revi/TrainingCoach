import { withHandler, ok } from "@/lib/api-response";
import { requireAssistantBeta } from "@/lib/assistant/require-beta";
import { day, today } from "@/lib/assistant/journal.service";

export async function GET(req: Request) {
  return withHandler(async () => {
    const auth = await requireAssistantBeta(req);
    if (auth instanceof Response) return auth;
    const url = new URL(req.url);
    const date = url.searchParams.get("date") ?? today();
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : today();
    return ok(await day(auth.user.sub, iso));
  });
}
