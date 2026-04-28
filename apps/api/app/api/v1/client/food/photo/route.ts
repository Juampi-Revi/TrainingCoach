import { NextRequest } from "next/server";
import { requireRole } from "@/lib/api-auth";
import { err, ok, unauthorized, withHandler } from "@/lib/api-response";
import { cloudinary } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = requireRole(req, "client");
    if (!auth.ok) return unauthorized(auth.message);

    const form = await req.formData().catch(() => null);
    if (!form) return err("Form inválido", 400);

    const file = form.get("file");
    if (!(file instanceof File)) return err("file requerido", 400);
    if (!file.type.startsWith("image/")) return err("Solo imágenes", 400);
    if (file.size > 8 * 1024 * 1024) return err("Imagen demasiado grande (máx 8MB)", 400);

    const ab = await file.arrayBuffer();
    const b64 = Buffer.from(ab).toString("base64");
    const dataUri = `data:${file.type};base64,${b64}`;

    const uploaded = await cloudinary.uploader.upload(dataUri, {
      folder: "regen/food",
      resource_type: "image",
    });

    return ok({ url: uploaded.secure_url, publicId: uploaded.public_id });
  });
}

