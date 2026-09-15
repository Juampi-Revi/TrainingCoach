import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/api-auth";
import { err, ok, unauthorized, withHandler } from "@/lib/api-response";
import { notify } from "@/lib/notify";
import { buildLogItems } from "@/lib/health/nutrition.service";
import { foodEntryInclude, serializeFoodEntry } from "@/lib/health/food-log.mapper";

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
      include: foodEntryInclude,
    });

    return ok({ items: items.map(serializeFoodEntry) });
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
    const rawItems = Array.isArray(body.items) ? body.items : [];
    const items = await buildLogItems(rawItems);
    if (!mealType) return err("Elegí el tipo de comida", 400);
    if (!quality && items.length === 0) return err("Calidad o alimentos requeridos", 400);

    const created = await prisma.foodLogEntry.create({
      data: {
        clientUserId: auth.user.sub,
        loggedAt,
        text,
        photoUrl,
        source,
        sourceRef,
        mealType,
        quality,
        macroTags,
        items: items.length ? { create: items } : undefined,
      },
      include: foodEntryInclude,
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
        body: text ?? (items[0]?.name ?? (photoUrl ? "Con foto" : "Sin descripción")),
        linkUrl: `/coach/alumnos/${auth.user.sub}`,
      });
    }

    return ok(serializeFoodEntry(created), 201);
  });
}
