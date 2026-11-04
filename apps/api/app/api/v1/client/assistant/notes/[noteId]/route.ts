import { z } from "zod";
import { withValidatedHandler, ok, notFound, validateBody } from "@/lib/api-response";
import { requireAssistantBeta } from "@/lib/assistant/require-beta";
import { completeNote } from "@/lib/assistant/journal.service";

const schema = z.object({
  done: z.literal(true),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ noteId: string }> },
) {
  return withValidatedHandler(async () => {
    const auth = requireAssistantBeta(req);
    if (auth instanceof Response) return auth;
    const { noteId } = await ctx.params;
    await validateBody(req, schema);
    const result = await completeNote(auth.user.sub, noteId);
    if ("error" in result) return notFound();
    return ok(result);
  });
}
