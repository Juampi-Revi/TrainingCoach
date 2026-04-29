import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, forbidden, err, withHandler } from "@/lib/api-response";
import { notify } from "@/lib/notify";

type RefPayload = {
  kind: string;
  id: string;
  label?: string;
};

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const rel = await prisma.coachClient.findFirst({
      where: { clientUserId: auth.user.sub, status: "active" },
      select: { coachUserId: true, coach: { select: { id: true, displayName: true, email: true } } },
    });
    if (!rel) return forbidden("No coach relation");

    const thread = await prisma.chatThread.upsert({
      where: { coachUserId_clientUserId: { coachUserId: rel.coachUserId, clientUserId: auth.user.sub } },
      create: { coachUserId: rel.coachUserId, clientUserId: auth.user.sub },
      update: {},
      select: { id: true },
    });

    const { searchParams } = req.nextUrl;
    const take = Math.min(80, parseInt(searchParams.get("take") ?? "60"));
    const before = searchParams.get("before") ?? undefined; // cursor: load messages older than this id

    // Fetch one extra to detect if there's a previous page
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
    const ordered = page.reverse(); // restore chronological order

    return ok({
      thread: { id: thread.id },
      coach: { id: rel.coach.id, name: rel.coach.displayName ?? rel.coach.email },
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

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const rel = await prisma.coachClient.findFirst({
      where: { clientUserId: auth.user.sub, status: "active" },
      select: { coachUserId: true },
    });
    if (!rel) return forbidden("No coach relation");

    const body = await req.json().catch(() => ({}));
    const text = String(body?.text ?? "").trim();
    const reference = body?.reference as RefPayload | undefined;

    if (!text) return err("text required", 400);

    const thread = await prisma.chatThread.upsert({
      where: { coachUserId_clientUserId: { coachUserId: rel.coachUserId, clientUserId: auth.user.sub } },
      create: { coachUserId: rel.coachUserId, clientUserId: auth.user.sub },
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

    const client = await prisma.user.findUnique({
      where: { id: auth.user.sub },
      select: { displayName: true, email: true },
    });

    await notify({
      userId: rel.coachUserId,
      type: "new_message",
      title: `Nuevo mensaje de ${client?.displayName ?? client?.email ?? "tu alumno"}`,
      body: text.slice(0, 120),
      linkUrl: `/coach/mensajes/${auth.user.sub}`,
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
