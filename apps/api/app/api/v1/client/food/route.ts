import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { ok, unauthorized, withHandler } from "@/lib/api-response";
import { notify } from "@/lib/notify";

export async function GET(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const sp = req.nextUrl.searchParams;
    const take = Math.min(60, Math.max(1, parseInt(sp.get("take") ?? "30", 10) || 30));

    const items = await prisma.foodLogEntry.findMany({
      where: { clientUserId: auth.user.sub },
      orderBy: { loggedAt: "desc" },
      take,
      select: {
        id: true,
        loggedAt: true,
        text: true,
        photoUrl: true,
        source: true,
        mealType: true,
        quality: true,
        macroTags: true,
        coachComments: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            text: true,
            createdAt: true,
            coach: { select: { id: true, displayName: true } },
          },
        },
      },
    });

    return ok({
      items: items.map((i) => ({
        id: i.id,
        loggedAt: i.loggedAt,
        text: i.text,
        photoUrl: i.photoUrl,
        source: i.source,
        mealType: i.mealType,
        quality: i.quality,
        macroTags: i.macroTags,
        coachComments: i.coachComments.map((c) => ({
          id: c.id,
          text: c.text,
          createdAt: c.createdAt,
          coach: { id: c.coach.id, name: c.coach.displayName },
        })),
      })),
    });
  });
}

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const body = await req.json().catch(() => ({}));
    const loggedAtIso = typeof body.loggedAt === "string" ? body.loggedAt : null;
    const loggedAt = loggedAtIso ? new Date(loggedAtIso) : new Date();

    const text = typeof body.text === "string" && body.text.trim() ? body.text.trim() : null;
    const photoUrl = typeof body.photoUrl === "string" && body.photoUrl.trim() ? body.photoUrl.trim() : null;
    const source = typeof body.source === "string" && body.source.trim() ? body.source.trim() : "manual";
    const sourceRef = typeof body.sourceRef === "string" && body.sourceRef.trim() ? body.sourceRef.trim() : null;
    const mealType = typeof body.mealType === "string" && body.mealType.trim() ? body.mealType.trim() : null;
    const quality = typeof body.quality === "string" && body.quality.trim() ? body.quality.trim() : null;
    const macroTags = Array.isArray(body.macroTags) ? body.macroTags.filter((t: unknown) => typeof t === "string") : [];

    const created = await prisma.foodLogEntry.create({
      data: { clientUserId: auth.user.sub, loggedAt, text, photoUrl, source, sourceRef, mealType, quality, macroTags },
      select: { id: true, loggedAt: true, text: true, photoUrl: true, source: true, mealType: true, quality: true, macroTags: true },
    });

    const rel = await prisma.coachClient.findFirst({
      where: { clientUserId: auth.user.sub, status: "active" },
      select: { coachUserId: true },
    });
    if (rel) {
      const client = await prisma.user.findUnique({
        where: { id: auth.user.sub },
        select: { displayName: true, email: true },
      });
      await notify({
        userId: rel.coachUserId,
        type: "food_logged",
        title: `${client?.displayName ?? client?.email ?? "Tu alumno"} registró una comida`,
        body: text ?? (photoUrl ? "Con foto" : "Sin descripción"),
        linkUrl: `/coach/alumnos/${auth.user.sub}`,
      });
    }

    return ok(created, 201);
  });
}
