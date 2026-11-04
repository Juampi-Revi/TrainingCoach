import { withHandler, ok, notFound } from "@/lib/api-response";
import { requireAssistantBeta } from "@/lib/assistant/require-beta";
import { day, deleteMeal, today } from "@/lib/assistant/journal.service";

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ mealId: string }> },
) {
  return withHandler(async () => {
    const auth = requireAssistantBeta(req);
    if (auth instanceof Response) return auth;
    const { mealId } = await ctx.params;
    const result = await deleteMeal(auth.user.sub, mealId, true);
    if ("error" in result) return notFound();
    return ok({ ...result, day: await day(auth.user.sub, today()) });
  });
}
