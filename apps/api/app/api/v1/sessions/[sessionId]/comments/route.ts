import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBearer } from "@/lib/api-auth";
import { ok, unauthorized, notFound, forbidden, err, withHandler } from "@/lib/api-response";
import { notify } from "@/lib/notify";
import { sendCommentEmail, getAppUrl } from "@/lib/email";

type Ctx = { params: Promise<{ sessionId: string }> };

async function canAccessSession(userId: string, role: string, sessionId: string) {
  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    select: { clientUserId: true },
  });
  if (!session) return null;

  if (role === "client" && session.clientUserId !== userId) return null;

  if (role === "coach") {
    const rel = await prisma.coachClient.findFirst({
      where: { coachUserId: userId, clientUserId: session.clientUserId, status: "active" },
      select: { id: true },
    });
    if (!rel) return null;
  }

  return session;
}

export async function GET(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = extractBearer(req);
    if (!auth.ok) return unauthorized(auth.message);

    const { sessionId } = await params;
    const session = await canAccessSession(auth.user.sub, auth.user.role, sessionId);
    if (!session) return forbidden();

    const comments = await prisma.sessionComment.findMany({
      where: { sessionId },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { id: true, displayName: true, role: true } } },
    });

    return ok(
      comments.map((c) => ({
        id: c.id,
        text: c.text,
        createdAt: c.createdAt,
        author: { id: c.author.id, name: c.author.displayName, role: c.author.role },
      })),
    );
  });
}

export async function POST(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = extractBearer(req);
    if (!auth.ok) return unauthorized(auth.message);

    const { sessionId } = await params;
    const session = await canAccessSession(auth.user.sub, auth.user.role, sessionId);
    if (!session) return forbidden();

    const body = await req.json().catch(() => ({}));
    const { text } = body;
    if (!text?.trim()) return err("text required", 400);

    const comment = await prisma.sessionComment.create({
      data: { sessionId, authorUserId: auth.user.sub, text: text.trim() },
      include: { author: { select: { id: true, displayName: true, role: true } } },
    });

    // Notify the other party
    const recipientId = auth.user.role === "coach" ? session.clientUserId : await (async () => {
      const rel = await prisma.coachClient.findFirst({
        where: { clientUserId: session.clientUserId, status: "active" },
        select: { coachUserId: true },
      });
      return rel?.coachUserId ?? null;
    })();
    if (recipientId) {
      const authorName = comment.author.displayName ?? (auth.user.role === "coach" ? "Tu coach" : "Tu alumno");
      await notify({
        userId: recipientId,
        type: "new_message",
        title: auth.user.role === "coach" ? "Nuevo mensaje de tu coach" : `Nuevo mensaje de ${authorName}`,
        body: text.trim().slice(0, 120),
        linkUrl: auth.user.role === "coach" ? `/comentarios/${sessionId}` : `/coach/alumnos/${session.clientUserId}/sesiones/${sessionId}`,
      });

      // Send email if coach commented on client's session
      if (auth.user.role === "coach" && recipientId) {
        const recipient = await prisma.user.findUnique({
          where: { id: recipientId },
          select: { email: true, displayName: true },
        });
        if (recipient) {
          const frontendUrl = process.env.FRONTEND_URL?.trim() || "http://localhost:3001";
          sendCommentEmail({
            to: recipient.email,
            clientName: recipient.displayName ?? "Alumno",
            coachName: comment.author.displayName ?? "Coach",
            sessionTitle: "Tu sesión",
            commentText: text.trim(),
            sessionUrl: `${frontendUrl}/sesion/${sessionId}`,
          }).catch(() => {});
        }
      }
    }

    return ok(
      {
        id: comment.id,
        text: comment.text,
        createdAt: comment.createdAt,
        author: { id: comment.author.id, name: comment.author.displayName, role: comment.author.role },
      },
      201,
    );
  });
}
