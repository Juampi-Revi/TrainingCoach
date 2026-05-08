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
      return NextResponse.redirect(`${WEB_BASE}/cuenta/wearable?error=google_denied`);
    }

    const pendingConnection = await prisma.healthProviderConnection.findFirst({
      where: { provider: "google_health" },
      orderBy: { createdAt: "desc" },
    });

    if (!pendingConnection) {
      return NextResponse.redirect(`${WEB_BASE}/cuenta/wearable?error=no_connection`);
    }

    const provider = getProvider("google_health");
    if (!provider) {
      return NextResponse.redirect(`${WEB_BASE}/cuenta/wearable?error=provider_not_found`);
    }

    const redirectUri = `${process.env.API_BASE_URL || "http://localhost:3003"}/api/v1/client/sync/google-health/callback`;

    const tokens = await provider.exchangeCode(code, redirectUri);
    
    let profileId = "google_health";
    try {
      const profile = await provider.getUserProfile(tokens);
      profileId = profile.id;
    } catch {
      // Profile endpoint may not be available, use default ID
    }

    // Check if this Google account is already connected to another user
    const existingConnection = await prisma.healthProviderConnection.findFirst({
      where: { provider: "google_health", providerUserId: profileId, userId: { not: pendingConnection.userId } },
    });
    if (existingConnection) {
      return NextResponse.redirect(`${WEB_BASE}/cuenta/wearable?error=account_in_use`);
    }

    await prisma.healthProviderConnection.update({
      where: {
        userId_provider: { userId: pendingConnection.userId, provider: "google_health" },
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

    await syncUserProvider(pendingConnection.userId, "google_health");

    // Redirect to success
    return NextResponse.redirect(`${WEB_BASE}/cuenta/wearable?connected=google_health`);
  } catch (err) {
    console.error("[Google Health OAuth Error]", err);
    return NextResponse.redirect(`${WEB_BASE}/cuenta/wearable?error=google_failed`);
  }
}
