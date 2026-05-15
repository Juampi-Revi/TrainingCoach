import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBearer } from "@/lib/api-auth";
import { ok, unauthorized, err, withHandler } from "@/lib/api-response";
import { vapidPublicKey, isPushConfigured } from "@/lib/push-notifications";

// GET - Obtener VAPID public key
export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = extractBearer(req);
    if (!auth.ok) return unauthorized(auth.message);

    return ok({
      publicKey: vapidPublicKey,
      configured: isPushConfigured(),
    });
  });
}

// POST - Suscribirse a notificaciones push
export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = extractBearer(req);
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return err("endpoint, keys.p256dh y keys.auth son requeridos", 400);
    }

    // Buscar si ya existe esta suscripción
    const existing = await prisma.pushSubscription.findUnique({
      where: { endpoint },
    });

    if (existing) {
      // Actualizar usuario si cambió
      if (existing.userId !== auth.user.sub) {
        await prisma.pushSubscription.update({
          where: { id: existing.id },
          data: { userId: auth.user.sub },
        });
      }
      return ok({ subscribed: true, updated: true });
    }

    // Crear nueva suscripción
    await prisma.pushSubscription.create({
      data: {
        userId: auth.user.sub,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      },
    });

    return ok({ subscribed: true, created: true });
  });
}

// DELETE - Cancelar suscripción
export async function DELETE(req: NextRequest) {
  return withHandler(async () => {
    const auth = extractBearer(req);
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return err("endpoint es requerido", 400);
    }

    await prisma.pushSubscription.deleteMany({
      where: {
        userId: auth.user.sub,
        endpoint,
      },
    });

    return ok({ unsubscribed: true });
  });
}
