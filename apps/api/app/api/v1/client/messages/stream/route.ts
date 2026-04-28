import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // SSE doesn't support custom headers — accept token via query param
  const token =
    req.headers.get("authorization")?.slice(7) ??
    req.nextUrl.searchParams.get("token") ??
    "";

  let userId: string;
  try {
    const payload = verifyToken(token);
    if (payload.role !== "client") throw new Error("not a client");
    userId = payload.sub;
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const encoder = new TextEncoder();
  const send = (controller: ReadableStreamDefaultController, data: unknown) => {
    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
  };

  const stream = new ReadableStream({
    async start(controller) {
      send(controller, { type: "connected" });

      // Track last seen message to detect new ones
      const latest = await prisma.sessionComment.findFirst({
        where: { session: { clientUserId: userId }, authorUserId: { not: userId } },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      });
      let since = latest?.createdAt ?? new Date();

      const interval = setInterval(async () => {
        try {
          const newCount = await prisma.sessionComment.count({
            where: {
              session: { clientUserId: userId },
              authorUserId: { not: userId },
              createdAt: { gt: since },
            },
          });

          if (newCount > 0) {
            since = new Date();
            send(controller, { type: "new_messages", count: newCount });
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
