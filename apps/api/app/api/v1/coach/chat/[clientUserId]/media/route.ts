import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { err, forbidden, ok, unauthorized, withHandler } from "@/lib/api-response";
import { uploadChatMedia } from "@/lib/messaging/chat-media.service";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ clientUserId: string }> };

async function verifyAccess(coachUserId: string, clientUserId: string) {
  const rel = await prisma.coachClient.findFirst({
    where: { coachUserId, clientUserId, status: "active" },
    select: { id: true },
  });
  return !!rel;
}

export async function POST(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { clientUserId } = await params;
    if (!(await verifyAccess(auth.user.sub, clientUserId))) return forbidden();

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return err("file required", 400);

    try {
      const uploaded = await uploadChatMedia({
        file,
        folder: `chat/${clientUserId}`,
        maxBytes: 25 * 1024 * 1024,
      });
      return ok(uploaded, 201);
    } catch (e) {
      const code = e instanceof Error ? e.message : "upload_failed";
      if (code === "invalid_file_type") return err("Tipo de archivo inválido", 400);
      if (code === "file_too_large") return err("Archivo demasiado grande", 400);
      return err("No se pudo subir el archivo", 500);
    }
  });
}
