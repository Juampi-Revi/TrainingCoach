import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, forbidden, err, withHandler } from "@/lib/api-response";
import { notify } from "@/lib/notify";

type Ctx = { params: Promise<{ clientUserId: string }> };

type RefPayload = {
  kind: string;
  id: string;
  label?: string;
};

async function verifyAccess(coachUserId: string, clientUserId: string) {
  const rel = await prisma.coachClient.findFirst({
    where: { coachUserId, clientUserId, status: "active" },
    select: { id: true },
  });
  return !!rel;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { clientUserId } = await params;
    if (!(await verifyAccess(auth.user.sub, clientUserId))) return forbidden();

    const client = await prisma.user.findUnique({
      where: { id: clientUserId },
      select: { id: true, displayName: true, email: true },
    });
    if (!client) return err("Client not found", 404);

    const thread = await prisma.chatThread.upsert({
      where: { coachUserId_clientUserId: { coachUserId: auth.user.sub, clientUserId } },
      create: { coachUserId: auth.user.sub, clientUserId },
      update: {},
      select: { id: true },
    });

    const { searchParams } = req.nextUrl;
    const take = Math.min(80, parseInt(searchParams.get("take") ?? "60"));
    const before = searchParams.get("before") ?? undefined;

    const messages = await prisma.chatMessage.findMany({
      where: {
        threadId: thread.id,
        ...(before ? { createdAt: { lt: (await prisma.chatMessage.findUnique({ where: { id: before }, select: { createdAt: true } }))?.createdAt } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: take + 1,
      include: { author: { select: { id: true, displayName: true, role: true } } },
    });

    const hasMore = messages.length > take;
    const page = hasMore ? messages.slice(0, take) : messages;
    const ordered = page.reverse();

    return ok({
      thread: { id: thread.id },
      client: { id: client.id, name: client.displayName ?? client.email },
      hasMore,
      oldestCursor: ordered[0]?.id ?? null,
      messages: ordered.map((m) => ({
        id: m.id,
        text: m.text,
        createdAt: m.createdAt,
        author: { id: m.author.id, name: m.author.displayName, role: m.author.role },
        reference: m.refKind && m.refId ? { kind: m.refKind, id: m.refId, label: m.refLabel, meta: m.refMeta } : null,
      })),
    });
  });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { clientUserId } = await params;
    if (!(await verifyAccess(auth.user.sub, clientUserId))) return forbidden();

    const body = await req.json().catch(() => ({}));
    const text = String(body?.text ?? "").trim();
    const reference = body?.reference as RefPayload | undefined;
    if (!text) return err("text required", 400);

    const thread = await prisma.chatThread.upsert({
      where: { coachUserId_clientUserId: { coachUserId: auth.user.sub, clientUserId } },
      create: { coachUserId: auth.user.sub, clientUserId },
      update: {},
      select: { id: true },
    });

    const msg = await prisma.chatMessage.create({
      data: {
        threadId: thread.id,
        authorUserId: auth.user.sub,
        text,
        refKind: reference?.kind ?? null,
        refId: reference?.id ?? null,
        refLabel: reference?.label ?? null,
        refMeta: undefined,
      },
      include: { author: { select: { id: true, displayName: true, role: true } } },
    });

    await notify({
      userId: clientUserId,
      type: "new_message",
      title: "Nuevo mensaje de tu coach",
      body: text.slice(0, 120),
      linkUrl: "/mensajes",
    });

    return ok(
      {
        id: msg.id,
        text: msg.text,
        createdAt: msg.createdAt,
        author: { id: msg.author.id, name: msg.author.displayName, role: msg.author.role },
        reference: msg.refKind && msg.refId ? { kind: msg.refKind, id: msg.refId, label: msg.refLabel } : null,
      },
      201,
    );
  });
}
