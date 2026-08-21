import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getProvider } from "@/lib/health/registry";
import { verifyHealthOauthState } from "@/lib/health/oauth-state";
import { syncUserProvider } from "@/lib/health/sync-engine";
import { getApiBaseUrl, getWebBaseUrl } from "@/lib/public-urls";

const WEB_BASE = getWebBaseUrl();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const error = searchParams.get("error");

    if (error || !code) {
      return NextResponse.redirect(`${WEB_BASE}/cuenta/wearable?error=strava_denied`);
    }
    const oauthState = verifyHealthOauthState(state, "strava");
    if (!oauthState) {
      return NextResponse.redirect(`${WEB_BASE}/cuenta/wearable?error=invalid_state`);
    }

    const provider = getProvider("strava");
    if (!provider) {
      return NextResponse.redirect(`${WEB_BASE}/cuenta/wearable?error=provider_not_found`);
    }

    const redirectUri = `${getApiBaseUrl()}/api/v1/client/sync/strava/callback`;

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
      where: { provider: "strava", providerUserId: profileId, userId: { not: oauthState.userId }, isActive: true },
    });
    if (existingConnection) {
      return NextResponse.redirect(`${WEB_BASE}/cuenta/wearable?error=account_in_use`);
    }

    await prisma.healthProviderConnection.upsert({
      where: {
        userId_provider: { userId: oauthState.userId, provider: "strava" },
      },
      update: {
        isActive: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
        providerUserId: profileId,
        lastSyncAt: new Date(),
        lastSyncStatus: "pending",
      },
      create: {
        userId: oauthState.userId,
        provider: "strava",
        isActive: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
        providerUserId: profileId,
        lastSyncAt: new Date(),
        lastSyncStatus: "pending",
      },
    });

    await syncUserProvider(oauthState.userId, "strava");

    return NextResponse.redirect(`${WEB_BASE}/cuenta/wearable?connected=strava`);
  } catch (err) {
    console.error("[Strava OAuth Error]", err);
    return NextResponse.redirect(`${WEB_BASE}/cuenta/wearable?error=strava_failed`);
  }
}
