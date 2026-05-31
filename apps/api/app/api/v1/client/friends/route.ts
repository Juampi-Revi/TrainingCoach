import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { ok, err, withHandler } from "@/lib/api-response";
import {
  followUser,
  unfollowUser,
  getFriends,
  getFollowers,
  searchUsers,
  getFriendCounts,
} from "@/lib/gamification/friends.service";

// GET /api/v1/client/friends - List friends and followers
export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = await requireRole(req, ["client"]);
    if (!auth.ok) return err(auth.message, auth.status);

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") ?? "following";
    const search = searchParams.get("search");

    if (search) {
      // Search for users
      const users = await searchUsers(auth.user.sub, search);
      return ok(users);
    }

    if (type === "followers") {
      const followers = await getFollowers(auth.user.sub);
      return ok(followers);
    }

    // Default: get friends (following)
    const friends = await getFriends(auth.user.sub);
    const counts = await getFriendCounts(auth.user.sub);

    return ok({
      friends,
      counts,
    });
  });
}

// POST /api/v1/client/friends - Follow a user
export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = await requireRole(req, ["client"]);
    if (!auth.ok) return err(auth.message, auth.status);

    const body = await req.json().catch(() => ({}));
    const { userId } = body;

    if (!userId) {
      return err("userId es requerido", 400);
    }

    await followUser(auth.user.sub, userId);
    return ok({ message: "Ahora seguís a este usuario" });
  });
}

// DELETE /api/v1/client/friends?userId=xxx - Unfollow a user
export async function DELETE(req: NextRequest) {
  return withHandler(async () => {
    const auth = await requireRole(req, ["client"]);
    if (!auth.ok) return err(auth.message, auth.status);

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return err("userId es requerido", 400);
    }

    await unfollowUser(auth.user.sub, userId);
    return ok({ message: "Dejaste de seguir a este usuario" });
  });
}