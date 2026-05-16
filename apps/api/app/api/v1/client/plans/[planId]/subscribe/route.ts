import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, notFound, err, withHandler } from "@/lib/api-response";

type Ctx = { params: Promise<{ planId: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const { planId } = await params;
    const plan = await prisma.plan.findFirst({
      where: { id: planId, isPublic: true, status: "published" },
      select: { id: true, title: true, coachUserId: true },
    });
    if (!plan) return notFound("Plan no encontrado o no es público");

    // Deactivate any existing active assignment
    await prisma.planAssignment.updateMany({
      where: { clientUserId: auth.user.sub, status: "active" },
      data: { status: "finished" },
    });

    await prisma.planAssignment.create({
      data: {
        planId,
        clientUserId: auth.user.sub,
        status: "active",
        startDate: new Date(),
      },
    });

    return ok({ planId, title: plan.title }, 201);
  });
}
