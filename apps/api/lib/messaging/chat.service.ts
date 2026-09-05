import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";

export async function getOrCreateThread(coachUserId: string, clientUserId: string) {
  let thread = await prisma.chatThread.findUnique({
    where: { coachUserId_clientUserId: { coachUserId, clientUserId } },
  });
  if (!thread) {
    thread = await prisma.chatThread.create({
      data: { coachUserId, clientUserId },
    });
  }
  return thread;
}

export function getCoachThreads(coachUserId: string) {
  return prisma.chatThread.findMany({
    where: { coachUserId },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

export async function getThreadMessages(coachUserId: string, clientUserId: string, take: number = 160) {
  const thread = await getOrCreateThread(coachUserId, clientUserId);
  const rawMessages = await prisma.chatMessage.findMany({
    where: { threadId: thread.id },
    orderBy: { createdAt: "desc" },
    take: take + 1,
  });
  const hasMore = rawMessages.length > take;
  const messages = rawMessages.slice(0, take).reverse();

  const authorIds = [...new Set(messages.map(m => m.authorUserId))];
  const authors = await prisma.user.findMany({
    where: { id: { in: authorIds } },
    select: { id: true, displayName: true, role: true },
  });
  const authorMap = new Map(authors.map(a => [a.id, a]));

  return {
    thread,
    messages: messages.map(m => {
      const author = authorMap.get(m.authorUserId);
      return {
        id: m.id,
        text: m.text,
        createdAt: m.createdAt.toISOString(),
        author: { id: m.authorUserId, name: author?.displayName ?? null, role: author?.role ?? "" },
        reference: m.refKind ? { kind: m.refKind, id: m.refId!, label: m.refLabel ?? undefined } : null,
      };
    }),
    hasMore,
  };
}

async function sendMessage(threadId: string, authorUserId: string, text: string, reference?: { kind: string; id: string; label?: string }) {
  const message = await prisma.chatMessage.create({
    data: {
      threadId,
      authorUserId,
      text,
      refKind: reference?.kind,
      refId: reference?.id,
      refLabel: reference?.label,
    },
  });

  const [thread, author] = await Promise.all([
    prisma.chatThread.findUnique({ where: { id: threadId } }),
    prisma.user.findUnique({
      where: { id: authorUserId },
      select: { id: true, displayName: true, role: true },
    }),
  ]);

  if (thread) {
    const recipientId = thread.coachUserId === authorUserId ? thread.clientUserId : thread.coachUserId;
    const linkUrl = recipientId === thread.coachUserId ? `/coach/mensajes/${thread.clientUserId}` : "/mensajes";
    const sender = author?.displayName?.trim() || "Nuevo mensaje";
    notify({
      userId: recipientId,
      type: "new_message",
      title: `${sender} te escribió`,
      body: text.slice(0, 100),
      linkUrl,
      context: { clientName: sender, clientUserId: thread.clientUserId },
    });
  }

  return {
    id: message.id,
    text: message.text,
    createdAt: message.createdAt.toISOString(),
    author: { id: authorUserId, name: author?.displayName ?? null, role: author?.role ?? "" },
    reference: message.refKind ? { kind: message.refKind, id: message.refId!, label: message.refLabel ?? undefined } : null,
  };
}

export async function sendCoachMessage(coachUserId: string, clientUserId: string, text: string, reference?: { kind: string; id: string; label?: string }) {
  const thread = await getOrCreateThread(coachUserId, clientUserId);
  return sendMessage(thread.id, coachUserId, text, reference);
}

export async function sendClientMessage(coachUserId: string, clientUserId: string, text: string, reference?: { kind: string; id: string; label?: string }) {
  const thread = await getOrCreateThread(coachUserId, clientUserId);
  return sendMessage(thread.id, clientUserId, text, reference);
}
