import { z } from "zod";
import { withHandler, withValidatedHandler, ok, err, notFound, validateBody } from "@/lib/api-response";
import { requireAssistantBeta } from "@/lib/assistant/require-beta";
import { listMessages, postMessage } from "@/lib/assistant/assistant.service";

const postSchema = z.object({
  text: z.string().trim().max(2000).optional(),
  inputKind: z.enum(["text", "voice", "photo"]).default("text"),
  clientMessageId: z.string().trim().min(1).max(80),
  image: z.object({
    mediaType: z.literal("image/jpeg"),
    data: z.string().min(1),
  }).optional(),
});

export async function GET(
  req: Request,
  ctx: { params: Promise<{ conversationId: string }> },
) {
  return withHandler(async () => {
    const auth = await requireAssistantBeta(req);
    if (auth instanceof Response) return auth;
    const { conversationId } = await ctx.params;
    try {
      return ok(await listMessages(auth.user.sub, conversationId));
    } catch (error) {
      if (error instanceof Error && error.message === "not_found") return notFound();
      throw error;
    }
  });
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ conversationId: string }> },
) {
  return withValidatedHandler(async () => {
    const auth = await requireAssistantBeta(req);
    if (auth instanceof Response) return auth;
    const { conversationId } = await ctx.params;
    const body = await validateBody(req, postSchema);
    const text = body.text?.trim() ?? "";
    if (!text && !body.image) return err("Texto requerido", 400);
    try {
      return ok(await postMessage(auth.user.sub, conversationId, {
        text: text || "Foto",
        inputKind: body.image ? "photo" : body.inputKind,
        clientMessageId: body.clientMessageId,
        image: body.image,
      }));
    } catch (error) {
      if (error instanceof Error && error.message === "not_found") return notFound();
      throw error;
    }
  });
}
