import { z } from "zod";
import { withValidatedHandler, ok, notFound, validateBody } from "@/lib/api-response";
import { requireAssistantBeta } from "@/lib/assistant/require-beta";
import { day, setSupplementStatus, today } from "@/lib/assistant/journal.service";

const schema = z.object({
  status: z.enum(["planned", "taken", "skipped"]),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ supplementId: string }> },
) {
  return withValidatedHandler(async () => {
    const auth = requireAssistantBeta(req);
    if (auth instanceof Response) return auth;
    const { supplementId } = await ctx.params;
    const body = await validateBody(req, schema);
    const result = await setSupplementStatus(auth.user.sub, {
      supplementId,
      status: body.status,
    });
    if ("error" in result) return notFound();
    return ok({ ...result, day: await day(auth.user.sub, today()) });
  });
}
