import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const clients = await prisma.coachClient.findMany({
      where: { coachUserId: auth.user.sub, status: "active" },
      include: { client: { select: { id: true, displayName: true, email: true } } },
      orderBy: { createdAt: "asc" },
    });

    const threads = await prisma.chatThread.findMany({
      where: { coachUserId: auth.user.sub, clientUserId: { in: clients.map((c) => c.clientUserId) } },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { author: { select: { id: true, displayName: true, role: true } } },
        },
      },
    });

    const byClient = new Map(threads.map((t) => [t.clientUserId, t]));

    const items = clients.map((rel) => {
      const t = byClient.get(rel.clientUserId) ?? null;
      const last = t?.messages[0] ?? null;
      return {
        threadId: t?.id ?? null,
        client: { id: rel.client.id, name: rel.client.displayName ?? rel.client.email },
        lastMessage: last
          ? {
            id: last.id,
            text: last.text,
            createdAt: last.createdAt,
            author: { id: last.author.id, name: last.author.displayName, role: last.author.role },
            reference: last.refKind && last.refId ? { kind: last.refKind, id: last.refId, label: last.refLabel } : null,
          }
          : null,
      };
    });

    items.sort((a, b) => {
      const at = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bt = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bt - at;
    });

    return ok(items);
  });
}
