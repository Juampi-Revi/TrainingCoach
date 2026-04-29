import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { notify } from "@/lib/notify";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, err, notFound, withHandler } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const relations = await prisma.coachClient.findMany({
      where: { coachUserId: auth.user.sub, status: "active" },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            displayName: true,
            planAssignments: {
              where: { OR: [{ status: "active" }, { status: "paused" }] },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                status: true,
                plan: { select: { id: true, title: true, weeksCount: true } },
              },
            },
            workoutSessions: {
              where: { status: { not: "discarded" } },
              orderBy: { performedAt: "desc" },
              take: 1,
              select: { performedAt: true, status: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return ok(
      relations.map((r) => {
        const assignment = r.client.planAssignments[0] ?? null;
        const lastSession = r.client.workoutSessions[0] ?? null;
        return {
          id: r.client.id,
          email: r.client.email,
          name: r.client.displayName,
          relationStatus: r.status,
          assignment: assignment
            ? { status: assignment.status, plan: assignment.plan }
            : null,
          lastSession: lastSession
            ? { performedAt: lastSession.performedAt, status: lastSession.status }
            : null,
        };
      }),
    );
  });
}

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json().catch(() => ({}));
    const { email } = body as { email?: string };
    if (!email?.trim()) return err("email requerido", 400);

    const target = await prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true, displayName: true, role: true },
    });
    if (!target) return notFound("No existe un usuario con ese email");
    if (target.role !== "client") return err("El usuario no es un cliente", 422);
    if (target.id === auth.user.sub) return err("No podés agregarte a vos mismo", 422);

    // Look up this specific coach↔client relation (composite unique)
    const existing = await prisma.coachClient.findUnique({
      where: { coachUserId_clientUserId: { coachUserId: auth.user.sub, clientUserId: target.id } },
      select: { status: true },
    });
    if (existing?.status === "active") return err("El alumno ya está en tu lista", 409);

    // Reactivate existing inactive relation or create new one
    await prisma.coachClient.upsert({
      where: { coachUserId_clientUserId: { coachUserId: auth.user.sub, clientUserId: target.id } },
      create: { coachUserId: auth.user.sub, clientUserId: target.id, status: "active" },
      update: { status: "active" },
    });

    await notify({
      userId: target.id,
      type: "client_added",
      title: "Un coach te agregó",
      body: "Ya podés ver tu plan y empezar a entrenar.",
      linkUrl: "/semana",
    });

    return ok(
      { id: target.id, email: target.email, name: target.displayName, assignment: null, lastSession: null },
      201,
    );
  });
}
