import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProvider } from "@/lib/health/registry";
import { syncUserProvider } from "@/lib/health/sync-engine";

const WEB_BASE = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3001";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error || !code) {
      return NextResponse.redirect(`${WEB_BASE}/cuenta/wearable?error=strava_denied`);
    }

    const pendingConnection = await prisma.healthProviderConnection.findFirst({
      where: { provider: "strava" },
      orderBy: { createdAt: "desc" },
    });

    if (!pendingConnection) {
      return NextResponse.redirect(`${WEB_BASE}/cuenta/wearable?error=no_connection`);
    }

    const provider = getProvider("strava");
    if (!provider) {
      return NextResponse.redirect(`${WEB_BASE}/cuenta/wearable?error=provider_not_found`);
    }

    const redirectUri = `${process.env.API_BASE_URL || "http://localhost:3003"}/api/v1/client/sync/strava/callback`;

    const tokens = await provider.exchangeCode(code, redirectUri);
    
    let profileId = "strava";
    try {
      const profile = await provider.getUserProfile(tokens);
      profileId = profile.id;
    } catch {
      // Profile endpoint may not be available, use default ID
    }

    // Check if this Strava account is already connected to another user
    const existingConnection = await prisma.healthProviderConnection.findFirst({
      where: { provider: "strava", providerUserId: profileId, userId: { not: pendingConnection.userId }, isActive: true },
    });
    if (existingConnection) {
      return NextResponse.redirect(`${WEB_BASE}/cuenta/wearable?error=account_in_use`);
    }

    await prisma.healthProviderConnection.update({
      where: {
        userId_provider: { userId: pendingConnection.userId, provider: "strava" },
      },
      data: {
        isActive: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
        providerUserId: profileId,
        lastSyncAt: new Date(),
        lastSyncStatus: "pending",
      },
    });

    await syncUserProvider(pendingConnection.userId, "strava");

    return NextResponse.redirect(`${WEB_BASE}/cuenta/wearable?connected=strava`);
  } catch (err) {
    console.error("[Strava OAuth Error]", err);
    return NextResponse.redirect(`${WEB_BASE}/cuenta/wearable?error=strava_failed`);
  }
}
