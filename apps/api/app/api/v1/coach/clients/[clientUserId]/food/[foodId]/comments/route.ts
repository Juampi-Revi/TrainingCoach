import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { err, forbidden, notFound, ok, unauthorized, withHandler } from "@/lib/api-response";
import { notify } from "@/lib/notify";

type Ctx = { params: Promise<{ clientUserId: string; foodId: string }> };

export async function POST(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "coach");
    if (!auth.ok) return unauthorized(auth.message);

    const { clientUserId, foodId } = await params;

    const rel = await prisma.coachClient.findFirst({
      where: { coachUserId: auth.user.sub, clientUserId, status: "active" },
      select: { id: true },
    });
    if (!rel) return forbidden();

    const food = await prisma.foodLogEntry.findFirst({
      where: { id: foodId, clientUserId },
      select: { id: true, text: true },
    });
    if (!food) return notFound();

    const body = await req.json().catch(() => ({}));
    const text = typeof body.text === "string" && body.text.trim() ? body.text.trim() : null;
    if (!text) return err("Texto requerido", 400);

    const created = await prisma.foodCoachComment.create({
      data: { foodId, coachUserId: auth.user.sub, text },
      select: {
        id: true,
        text: true,
        createdAt: true,
        coach: { select: { id: true, displayName: true } },
      },
    });

    const coach = await prisma.user.findUnique({
      where: { id: auth.user.sub },
      select: { displayName: true, email: true },
    });

    await notify({
      userId: clientUserId,
      type: "food_comment",
      title: `${coach?.displayName ?? coach?.email ?? "Tu coach"} comentó una comida`,
      body: text,
      linkUrl: "/progreso",
    });

    return ok({ ...created, coach: { id: created.coach.id, name: created.coach.displayName } }, 201);
  });
}

