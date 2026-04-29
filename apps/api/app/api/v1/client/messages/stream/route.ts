import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { consumeSseToken } from "@/lib/sse-tokens";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Prefer short-lived SSE token (keeps JWT out of URLs/logs).
  // Fall back to Bearer for backwards compatibility.
  const sseToken = req.nextUrl.searchParams.get("token") ?? "";
  let userId: string | null = null;

  // Try SSE token first (one-time, 60s TTL)
  if (sseToken) {
    userId = consumeSseToken(sseToken);
  }

  // Fall back to JWT Bearer in header
  if (!userId) {
    const bearer = req.headers.get("authorization")?.slice(7) ?? "";
    try {
      const payload = verifyToken(bearer);
      if (payload.role !== "client") throw new Error("not a client");
      userId = payload.sub;
    } catch {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const resolvedUserId = userId;

  const encoder = new TextEncoder();
  const send = (controller: ReadableStreamDefaultController, data: unknown) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  const stream = new ReadableStream({
    async start(controller) {
      send(controller, { type: "connected" });

      // Watch ChatMessages (coach→client in the chat thread)
      const latestChat = await prisma.chatMessage.findFirst({
        where: {
          thread: { clientUserId: resolvedUserId },
          authorUserId: { not: resolvedUserId },
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
      let sinceChatAt = latestChat?.createdAt ?? new Date();

      // Also watch SessionComments (coach comments on sessions)
      const latestComment = await prisma.sessionComment.findFirst({
        where: { session: { clientUserId: resolvedUserId }, authorUserId: { not: resolvedUserId } },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
      let sinceCommentAt = latestComment?.createdAt ?? new Date();

      const interval = setInterval(async () => {
        try {
          const [chatCount, commentCount] = await Promise.all([
            prisma.chatMessage.count({
              where: {
                thread: { clientUserId: resolvedUserId },
                authorUserId: { not: resolvedUserId },
                createdAt: { gt: sinceChatAt },
              },
            }),
            prisma.sessionComment.count({
              where: {
                session: { clientUserId: resolvedUserId },
                authorUserId: { not: resolvedUserId },
                createdAt: { gt: sinceCommentAt },
              },
            }),
          ]);

          const total = chatCount + commentCount;
          if (total > 0) {
            sinceChatAt = new Date();
            sinceCommentAt = new Date();
            send(controller, { type: "new_messages", count: total });
          }
        } catch {
          // DB error — keep stream alive, next tick will retry
        }
      }, 8000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      "Connection": "keep-alive",
    },
  });
}
