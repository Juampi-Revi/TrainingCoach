import { cloudinary } from "@/lib/cloudinary";

export type UploadedChatMedia = {
  kind: "image" | "video";
  url: string;
  publicId: string;
  bytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
};

function toNumberOrNull(v: unknown): number | null {
  if (typeof v !== "number") return null;
  if (!Number.isFinite(v)) return null;
  return v;
}

export async function uploadChatMedia(args: {
  file: File;
  folder: string;
  maxBytes: number;
}): Promise<UploadedChatMedia> {
  const mime = args.file.type || "";
  const isImage = mime.startsWith("image/");
  const isVideo = mime.startsWith("video/");
  if (!isImage && !isVideo) throw new Error("invalid_file_type");
  if (args.file.size > args.maxBytes) throw new Error("file_too_large");

  const buf = Buffer.from(await args.file.arrayBuffer());

  const uploaded = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        folder: args.folder,
      },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("upload_failed"));
        else resolve(result as unknown as Record<string, unknown>);
      },
    );
    stream.end(buf);
  });

  const resourceType = String(uploaded.resource_type ?? "");
  const kind = resourceType === "video" ? "video" : "image";

  return {
    kind,
    url: String(uploaded.secure_url ?? uploaded.url ?? ""),
    publicId: String(uploaded.public_id ?? ""),
    bytes: typeof uploaded.bytes === "number" ? uploaded.bytes : args.file.size,
    width: toNumberOrNull(uploaded.width),
    height: toNumberOrNull(uploaded.height),
    durationSeconds: toNumberOrNull(uploaded.duration),
  };
}
