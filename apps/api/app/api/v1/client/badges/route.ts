import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";
import { BADGE_DEFINITIONS, getBadgeById } from "@/lib/badges";

// GET - Obtener todos los badges disponibles y los del usuario
export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    // Get user's unlocked badges
    const userBadges = await prisma.userBadge.findMany({
      where: { userId: auth.user.sub },
      orderBy: { unlockedAt: "desc" },
    });

    const unlockedBadgeIds = new Set(userBadges.map((ub) => ub.badgeId));

    // Combine definitions with user's progress
    const badges = BADGE_DEFINITIONS.map((badge) => ({
      ...badge,
      unlocked: unlockedBadgeIds.has(badge.id),
      unlockedAt: userBadges.find((ub) => ub.badgeId === badge.id)?.unlockedAt || null,
      viewed: userBadges.find((ub) => ub.badgeId === badge.id)?.viewed || false,
    }));

    // Count unviewed badges
    const unviewedCount = userBadges.filter((ub) => !ub.viewed).length;

    return ok({
      badges,
      stats: {
        total: BADGE_DEFINITIONS.length,
        unlocked: userBadges.length,
        unviewed: unviewedCount,
      },
    });
  });
}

// POST - Marcar badge como visto
export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json();
    const { badgeId } = body;

    if (!badgeId) {
      return ok({ viewed: false }); // No badgeId provided, nothing to do
    }

    // Mark specific badge as viewed
    await prisma.userBadge.updateMany({
      where: {
        userId: auth.user.sub,
        badgeId,
      },
      data: { viewed: true },
    });

    return ok({ viewed: true });
  });
}

// PATCH - Marcar todos los badges como vistos
export async function PATCH(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    await prisma.userBadge.updateMany({
      where: {
        userId: auth.user.sub,
        viewed: false,
      },
      data: { viewed: true },
    });

    return ok({ allViewed: true });
  });
}
