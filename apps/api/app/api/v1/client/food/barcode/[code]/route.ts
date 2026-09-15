import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { err, notFound, ok, unauthorized, withHandler } from "@/lib/api-response";
import { lookupBarcode } from "@/lib/health/food-catalog.service";

type Ctx = { params: Promise<{ code: string }> };

export async function GET(req: NextRequest, { params }: Ctx) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);
    const { code } = await params;
    if (!code) return err("Código requerido", 400);
    const item = await lookupBarcode(code, auth.user.sub);
    if (!item) return notFound("No encontramos ese código. Podés cargarlo a mano.");
    return ok(item);
  });
}
