import { z } from "zod";
import { withHandler, withValidatedHandler, ok, err, validateBody } from "@/lib/api-response";
import { requireAssistantBeta } from "@/lib/assistant/require-beta";
import { addSupplement, listSupplements } from "@/lib/assistant/supplements.service";
import { supplementTimeOfDay } from "@/lib/assistant/tools";

const schema = z.object({
  name: z.string().trim().min(1).max(80),
  timeOfDay: supplementTimeOfDay,
  note: z.string().trim().max(160).optional(),
  remind: z.boolean().optional(),
});

export async function GET(req: Request) {
  return withHandler(async () => {
    const auth = await requireAssistantBeta(req);
    if (auth instanceof Response) return auth;
    return ok(await listSupplements(auth.user.sub));
  });
}

export async function POST(req: Request) {
  return withValidatedHandler(async () => {
    const auth = await requireAssistantBeta(req);
    if (auth instanceof Response) return auth;
    const body = await validateBody(req, schema);
    const result = await addSupplement(auth.user.sub, body);
    if ("error" in result) {
      return err(result.error === "name_required" ? "Nombre requerido" : "Horario inválido", 400);
    }
    return ok(result, 201);
  });
}
