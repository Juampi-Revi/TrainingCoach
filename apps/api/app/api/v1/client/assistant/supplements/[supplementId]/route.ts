import { z } from "zod";
import { withValidatedHandler, ok, err, notFound, validateBody } from "@/lib/api-response";
import { requireAssistantBeta } from "@/lib/assistant/require-beta";
import { day, setSupplementStatus, today } from "@/lib/assistant/journal.service";
import { removeSupplement, updateSupplement } from "@/lib/assistant/supplements.service";
import { supplementTimeOfDay } from "@/lib/assistant/tools";

const schema = z.object({
  status: z.enum(["planned", "taken", "skipped"]).optional(),
  name: z.string().trim().min(1).max(80).optional(),
  timeOfDay: supplementTimeOfDay.optional(),
  note: z.string().trim().max(160).nullable().optional(),
  remind: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ supplementId: string }> },
) {
  return withValidatedHandler(async () => {
    const auth = await requireAssistantBeta(req);
    if (auth instanceof Response) return auth;
    const { supplementId } = await ctx.params;
    const body = await validateBody(req, schema);
    if (body.status) {
      const result = await setSupplementStatus(auth.user.sub, {
        supplementId,
        status: body.status,
      });
      if ("error" in result) return notFound();
      return ok({ ...result, day: await day(auth.user.sub, today()) });
    }
    const result = await updateSupplement(auth.user.sub, supplementId, {
      name: body.name,
      timeOfDay: body.timeOfDay,
      note: body.note,
      remind: body.remind,
    });
    if ("error" in result) {
      if (result.error === "not_found") return notFound();
      return err("Horario inválido", 400);
    }
    return ok(result);
  });
}

export async function DELETE(
  req: Request,
  ctx: { params: Promise<{ supplementId: string }> },
) {
  return withValidatedHandler(async () => {
    const auth = await requireAssistantBeta(req);
    if (auth instanceof Response) return auth;
    const { supplementId } = await ctx.params;
    const result = await removeSupplement(auth.user.sub, { supplementId });
    if ("error" in result) return notFound();
    return ok(result);
  });
}
