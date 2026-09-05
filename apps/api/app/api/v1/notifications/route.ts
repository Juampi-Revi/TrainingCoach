import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBearer } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = extractBearer(req);
    if (!auth.ok) return unauthorized(auth.message);

    const notifications = await prisma.notification.findMany({
      where: { userId: auth.user.sub },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        linkUrl: true,
        context: true,
        readAt: true,
        createdAt: true,
      },
    });

    const unreadCount = notifications.filter((n) => !n.readAt).length;

    return ok({ notifications, unreadCount });
  });
}
