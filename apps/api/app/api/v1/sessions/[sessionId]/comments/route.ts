import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractBearer } from "@/lib/api-auth";
import { ok, unauthorized, notFound, forbidden, err } from "@/lib/api-response";

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
}

export async function POST(req: NextRequest, { params }: Ctx) {
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

  return ok(
    {
      id: comment.id,
      text: comment.text,
      createdAt: comment.createdAt,
      author: { id: comment.author.id, name: comment.author.displayName, role: comment.author.role },
    },
    201,
  );
}
