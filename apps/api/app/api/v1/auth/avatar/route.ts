import { NextRequest } from "next/server";
import { extractBearer } from "@/lib/api-auth";
import { err, ok, unauthorized, withHandler } from "@/lib/api-response";
import { cloudinary } from "@/lib/cloudinary";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB for avatars

export async function POST(req: NextRequest) {
  return withHandler(async () => {
    const auth = extractBearer(req);
    if (!auth.ok) return unauthorized(auth.message);

    const form = await req.formData().catch(() => null);
    if (!form) return err("Form inválido", 400);

    const file = form.get("file");
    if (!(file instanceof File)) return err("file requerido", 400);
    if (!file.type.startsWith("image/")) return err("Solo imágenes permitidas", 400);
    if (file.size > MAX_SIZE) return err(`Imagen demasiado grande (máx ${MAX_SIZE / 1024 / 1024}MB)`, 400);

    const ab = await file.arrayBuffer();
    const b64 = Buffer.from(ab).toString("base64");
    const dataUri = `data:${file.type};base64,${b64}`;

    const uploaded = await cloudinary.uploader.upload(dataUri, {
      folder: "regen/avatars",
      resource_type: "image",
      transformation: [
        { width: 400, height: 400, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "webp" },
      ],
    });

    return ok({ url: uploaded.secure_url, publicId: uploaded.public_id });
  });
}
