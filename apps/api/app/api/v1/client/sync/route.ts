import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err, withHandler } from "@/lib/api-response";
import { getProviderIds, getProvider } from "@/lib/health/registry";
import { syncUserProvider } from "@/lib/health/sync-engine";
import { getApiBaseUrl, getWebBaseUrl } from "@/lib/public-urls";
import { randomBytes } from "crypto";

const WEB_BASE = getWebBaseUrl();

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const connections = await prisma.healthProviderConnection.findMany({
      where: { userId: auth.user.sub },
      select: {
        provider: true,
        isActive: true,
        lastSyncAt: true,
        lastSyncStatus: true,
        lastError: true,
        providerUserId: true,
        scope: true,
        createdAt: true,
      },
    });

    const providerConfigs = [
      { id: "garmin", name: "Garmin Connect", description: "Sincroniza pasos, sueño, HR, stress y más", color: "#007CC3", icon: "watch", dataTypes: ["steps", "sleep", "heart_rate", "stress", "body_battery", "spo2"] },
      { id: "google_health", name: "Google Health", description: "Fitbit y Pixel Watch", color: "#4285F4", icon: "activity", dataTypes: ["steps", "sleep", "heart_rate", "calories", "distance"] },
      { id: "strava", name: "Strava", description: "Actividades: running, cycling, swimming", color: "#FC4C02", icon: "run", dataTypes: ["activities", "calories", "distance"] },
    ];

    const statusMap = new Map(connections.map((c) => [c.provider, c]));

    return ok({
      providers: providerConfigs.map((p) => ({
        ...p,
        connection: statusMap.get(p.id) || null,
      })),
    });
  });
}

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json();
    const { provider, email, password } = body as { provider: string; email?: string; password?: string };

    if (!getProviderIds().includes(provider)) {
      return err("Proveedor no soportado", 400);
    }

    // Garmin uses email/password instead of OAuth
    if (provider === "garmin" && email && password) {
      const providerInstance = getProvider(provider);
      if (!providerInstance) {
        return err("Proveedor no disponible", 400);
      }

      const credentials = Buffer.from(JSON.stringify({ email, password })).toString("base64");
      try {
        const tokens = await providerInstance.exchangeCode(credentials, "");

        // Check if this Garmin account is already connected to another user
        const existingConnection = await prisma.healthProviderConnection.findFirst({
          where: { provider, providerUserId: email, userId: { not: auth.user.sub }, isActive: true },
        });
        if (existingConnection) {
          return err("Esta cuenta de Garmin ya está conectada a otro usuario", 409);
        }
        
        await prisma.healthProviderConnection.upsert({
          where: { userId_provider: { userId: auth.user.sub, provider } },
          update: {
            isActive: true,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            tokenExpiresAt: tokens.expiresAt,
            providerUserId: email,
          },
          create: {
            userId: auth.user.sub,
            provider,
            isActive: true,
            accessToken: tokens.accessToken,
            tokenExpiresAt: tokens.expiresAt,
            providerUserId: email,
          },
        });

        // Trigger initial sync
        await syncUserProvider(auth.user.sub, "garmin");

        return ok({ success: true, message: "Garmin conectado exitosamente" });
      } catch (connectError) {
        const message = connectError instanceof Error ? connectError.message : "Error al conectar con Garmin";
        return err(message, 400);
      }
    }

    // OAuth flow for other providers
    const providerInstance = getProvider(provider);
    if (!providerInstance) {
      return err("Proveedor no disponible", 400);
    }

    const state = randomBytes(16).toString("hex");
    const providerPath = provider === "google_health" ? "google-health" : provider;
    const redirectUri = `${getApiBaseUrl()}/api/v1/client/sync/${providerPath}/callback`;

    await prisma.healthProviderConnection.upsert({
      where: { userId_provider: { userId: auth.user.sub, provider } },
      update: {},
      create: {
        userId: auth.user.sub,
        provider,
        isActive: false,
      },
    });

    const authUrl = providerInstance.getAuthUrl(state, redirectUri);

    return ok({
      authUrl,
      state,
      provider,
    });
  });
}

export async function DELETE(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json();
    const { provider } = body as { provider: string };

    if (!provider) {
      return err("Provider required", 400);
    }

    await prisma.healthProviderConnection.updateMany({
      where: { userId: auth.user.sub, provider },
      data: {
        isActive: false,
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
        lastSyncStatus: null,
        lastError: null,
      },
    });

    return ok({ success: true, message: `${provider} desconectado` });
  });
}
