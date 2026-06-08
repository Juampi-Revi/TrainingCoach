import { cloudinary } from "@/lib/cloudinary";

export function isYouTubeUrl(url: string): boolean {
  return url.includes("youtube.com") || url.includes("youtu.be");
}

function cloudName(): string | null {
  return process.env.CLOUDINARY_CLOUD_NAME ?? null;
}

export function cloudinaryImageThumb(publicId: string): string | null {
  const name = cloudName();
  if (!name) return null;
  return `https://res.cloudinary.com/${name}/image/upload/c_fill,w_200,h_250,q_auto,f_webp/${publicId}`;
}

export function cloudinaryImagePreview(publicId: string): string | null {
  const name = cloudName();
  if (!name) return null;
  return `https://res.cloudinary.com/${name}/image/upload/c_fill,w_900,h_1125,q_auto,f_webp/${publicId}`;
}

export function youTubeThumb(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

export function cloudinaryVideoThumb(publicId: string): string | null {
  const name = cloudName();
  if (!name) return null;
  return `https://res.cloudinary.com/${name}/video/upload/so_0,c_fill,w_200,h_250,q_auto,f_jpg/${publicId}.jpg`;
}

export async function uploadFromFile(
  file: File,
  options: { folder: string; resourceType: "image" | "video" }
): Promise<{ secureUrl: string; publicId: string | null; width: number | null; height: number | null; bytes: number | null; duration: number | null }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const uploaded = await new Promise<Record<string, unknown>>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: options.resourceType,
        transformation: [{ width: 1080, height: 1350, crop: "fill" }],
      },
      (error, result) => {
        if (error || !result) reject(error ?? new Error("Upload failed"));
        else resolve(result as unknown as Record<string, unknown>);
      },
    );
    stream.end(buffer);
  });

  const secureUrl = String(uploaded.secure_url ?? "");
  const publicId = typeof uploaded.public_id === "string" ? uploaded.public_id : null;
  const width = typeof uploaded.width === "number" ? uploaded.width : null;
  const height = typeof uploaded.height === "number" ? uploaded.height : null;
  const bytes = typeof uploaded.bytes === "number" ? uploaded.bytes : null;
  const duration = typeof uploaded.duration === "number" ? uploaded.duration : null;

  return { secureUrl, publicId, width, height, bytes, duration };
}

