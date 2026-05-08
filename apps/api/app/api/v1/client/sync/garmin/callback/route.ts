import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProvider } from "@/lib/health/registry";
import { syncUserProvider } from "@/lib/health/sync-engine";

const WEB_BASE = process.env.NEXT_PUBLIC_WEB_URL || "http://localhost:3001";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error || !code) {
      return NextResponse.redirect(`${WEB_BASE}/cuenta/wearable?error=garmin_denied`);
    }

    // Find pending connection
    const pendingConnection = await prisma.healthProviderConnection.findFirst({
      where: { provider: "garmin" },
      orderBy: { createdAt: "desc" },
    });

    if (!pendingConnection) {
      return NextResponse.redirect(`${WEB_BASE}/cuenta/wearable?error=no_connection`);
    }

    const provider = getProvider("garmin");
    if (!provider) {
      return NextResponse.redirect(`${WEB_BASE}/cuenta/wearable?error=provider_not_found`);
    }

    const redirectUri = `${process.env.API_BASE_URL || "http://localhost:3003"}/api/v1/client/sync/garmin/callback`;

    const tokens = await provider.exchangeCode(code, redirectUri);
    
    let profileId = "garmin";
    try {
      const profile = await provider.getUserProfile(tokens);
      profileId = profile.id;
    } catch {
      // Profile endpoint may not be available, use default ID
    }

    await prisma.healthProviderConnection.update({
      where: {
        userId_provider: { userId: pendingConnection.userId, provider: "garmin" },
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

    // Trigger initial sync
    await syncUserProvider(pendingConnection.userId, "garmin");

    return NextResponse.redirect(`${WEB_BASE}/cuenta/wearable?connected=garmin`);
  } catch (err) {
    console.error("[Garmin OAuth Error]", err);
    return NextResponse.redirect(`${WEB_BASE}/cuenta/wearable?error=garmin_failed`);
  }
}
