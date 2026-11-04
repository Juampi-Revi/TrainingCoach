import { z } from "zod";
import { withValidatedHandler, ok, err, validateBody } from "@/lib/api-response";
import { requireAssistantBeta } from "@/lib/assistant/require-beta";
import { logDrinks } from "@/lib/assistant/journal.service";

const schema = z.object({
  displayName: z.string().trim().min(1).max(80),
  quantity: z.number().positive(),
  unit: z.string().trim().min(1).max(40),
});

export async function POST(req: Request) {
  return withValidatedHandler(async () => {
    const auth = await requireAssistantBeta(req);
    if (auth instanceof Response) return auth;
    const body = await validateBody(req, schema);
    const result = await logDrinks(auth.user.sub, { items: [body] });
    if ("error" in result) return err("No pude sumar esa bebida", 400);
    return ok(result, 201);
  });
}
