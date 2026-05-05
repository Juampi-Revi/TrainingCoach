import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err, withHandler } from "@/lib/api-response";
import { sendPushNotification, isPushConfigured } from "@/lib/push-notifications";

// POST - Enviar notificación de prueba
export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    if (!isPushConfigured()) {
      return err("Push notifications no están configuradas", 503);
    }

    const body = await req.json();
    const { title, body: message, type } = body;

    const result = await sendPushNotification(auth.user.sub, {
      title: title || "¡Hola! 👋",
      body: message || "Esta es una notificación de prueba",
      tag: type || "test",
      data: {
        url: "/panel",
        type: type || "test",
      },
    });

    return ok({
      sent: result.success,
      failed: result.failed,
      total: result.success + result.failed,
    });
  });
}
