import { z } from "zod";
import { withValidatedHandler, ok, err, notFound, validateBody } from "@/lib/api-response";
import { requireAssistantBeta } from "@/lib/assistant/require-beta";
import { deleteDrink, updateDrink } from "@/lib/assistant/journal.service";

const schema = z.object({
  milliliters: z.number().positive(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ drinkId: string }> },
) {
  return withValidatedHandler(async () => {
    const auth = requireAssistantBeta(req);
    if (auth instanceof Response) return auth;
    const { drinkId } = await ctx.params;
    const body = await validateBody(req, schema);
    const result = await updateDrink(auth.user.sub, drinkId, body.milliliters);
    if ("error" in result) {
      return result.error === "not_found" ? notFound() : err("Los mililitros tienen que ser mayores a cero", 400);
    }
    return ok(result);
  });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ drinkId: string }> },
) {
  return withValidatedHandler(async () => {
    const auth = requireAssistantBeta(req);
    if (auth instanceof Response) return auth;
    const { drinkId } = await ctx.params;
    const result = await deleteDrink(auth.user.sub, drinkId);
    if ("error" in result) return notFound();
    return ok(result);
  });
}
