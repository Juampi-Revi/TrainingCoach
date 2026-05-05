import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";

// GET - Obtener estado de sincronización
export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const syncs = await prisma.healthDataSync.findMany({
      where: { userId: auth.user.sub },
      select: {
        provider: true,
        isActive: true,
        lastSyncAt: true,
        createdAt: true,
      },
    });

    return ok({ syncs });
  });
}

// POST - Conectar nuevo proveedor (placeholder para OAuth)
export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json();
    const { provider, authCode } = body;

    if (!provider || !authCode) {
      return ok({ 
        success: false, 
        message: "OAuth flow not fully implemented yet. This is a placeholder endpoint." 
      });
    }

    // Placeholder: In a real implementation, you would:
    // 1. Exchange authCode for access_token with the provider
    // 2. Store tokens securely
    // 3. Start data sync process

    // For now, create a placeholder sync record
    await prisma.healthDataSync.upsert({
      where: {
        userId_provider: {
          userId: auth.user.sub,
          provider,
        },
      },
      update: {
        isActive: true,
        lastSyncAt: new Date(),
      },
      create: {
        userId: auth.user.sub,
        provider,
        isActive: true,
        lastSyncAt: new Date(),
      },
    });

    return ok({ 
      success: true, 
      message: `${provider} connected successfully (demo mode)` 
    });
  });
}

// DELETE - Desconectar proveedor
export async function DELETE(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json();
    const { provider } = body;

    if (!provider) {
      return ok({ success: false, message: "Provider required" });
    }

    await prisma.healthDataSync.updateMany({
      where: {
        userId: auth.user.sub,
        provider,
      },
      data: {
        isActive: false,
        accessToken: null,
        refreshToken: null,
      },
    });

    return ok({ success: true, message: `${provider} disconnected` });
  });
}
