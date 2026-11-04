import { withHandler, ok } from "@/lib/api-response";
import { requireAssistantBeta } from "@/lib/assistant/require-beta";
import { openConversation } from "@/lib/assistant/assistant.service";

export async function POST(req: Request) {
  return withHandler(async () => {
    const auth = await requireAssistantBeta(req);
    if (auth instanceof Response) return auth;
    return ok(await openConversation(auth.user.sub), 201);
  });
}
