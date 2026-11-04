import { z } from "zod";
import { withValidatedHandler, ok, err, notFound, validateBody } from "@/lib/api-response";
import { requireAssistantBeta } from "@/lib/assistant/require-beta";
import { day, today, updateMealItem } from "@/lib/assistant/journal.service";

const schema = z.object({
  quantity: z.number().positive(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ itemId: string }> },
) {
  return withValidatedHandler(async () => {
    const auth = requireAssistantBeta(req);
    if (auth instanceof Response) return auth;
    const { itemId } = await ctx.params;
    const body = await validateBody(req, schema);
    const result = await updateMealItem(auth.user.sub, itemId, { quantity: body.quantity });
    if ("error" in result) return result.error === "not_found" ? notFound() : err("Cantidad inválida", 400);
    return ok({ day: await day(auth.user.sub, today()) });
  });
}
