import fs from "node:fs";
import path from "node:path";
import { prisma } from "../lib/prisma";
import { cloudinary } from "../lib/cloudinary";

type BasicExercise = { id: string; sourceId: string | null };

function usage() {
  throw new Error("Usage: tsx scripts/import-basic-exercise-media.ts <folder>");
}

function exists(p: string): boolean {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}

function resolveFolderInput(input: string): { abs: string; tried: string[] } {
  if (path.isAbsolute(input)) return { abs: input, tried: [input] };
  const tried = [
    path.resolve(process.cwd(), input),
    path.resolve(process.cwd(), "..", input),
    path.resolve(process.cwd(), "..", "..", input),
    path.resolve(process.cwd(), "..", "..", "..", input),
  ];
  const abs = tried.find(exists) ?? tried[0]!;
  return { abs, tried };
}

async function uploadFile(filePath: string, opts: { folder: string; resourceType: "image" | "video" }) {
  const uploaded = await cloudinary.uploader.upload(filePath, {
    folder: opts.folder,
    resource_type: opts.resourceType,
    transformation: [{ width: 1080, height: 1350, crop: "fill" }],
  });
  return {
    secureUrl: uploaded.secure_url,
    publicId: uploaded.public_id ?? null,
    width: uploaded.width ?? null,
    height: uploaded.height ?? null,
    bytes: uploaded.bytes ?? null,
    duration: (uploaded as unknown as { duration?: number }).duration ?? null,
  };
}

async function main() {
  const folder = process.argv[2];
  if (!folder) usage();

  const resolved = resolveFolderInput(folder);
  const abs = resolved.abs;
  const imagesDir = path.join(abs, "images");
  const videosDir = path.join(abs, "videos");
  if (!exists(abs)) {
    throw new Error(
      `Folder not found. cwd=${process.cwd()} input=${folder} tried=${resolved.tried.join(", ")}`,
    );
  }

  const basics = await prisma.exercise.findMany({
    where: { isSystem: true, source: "regen_basic_v1" },
    select: { id: true, sourceId: true },
    orderBy: [{ sourceId: "asc" }],
  });

  let uploadedImages = 0;
  let uploadedVideos = 0;
  let skipped = 0;

  for (const ex of basics as BasicExercise[]) {
    if (!ex.sourceId) {
      skipped += 1;
      continue;
    }

    const [hasImg, hasVid] = await Promise.all([
      prisma.exerciseMedia.count({ where: { exerciseId: ex.id, mediaType: "image" } }),
      prisma.exerciseMedia.count({ where: { exerciseId: ex.id, mediaType: "video" } }),
    ]);

    const imageCandidates = [
      path.join(imagesDir, `${ex.sourceId}.png`),
      path.join(imagesDir, `${ex.sourceId}.jpg`),
      path.join(imagesDir, `${ex.sourceId}.jpeg`),
      path.join(imagesDir, `${ex.sourceId}.webp`),
    ];
    const videoCandidates = [
      path.join(videosDir, `${ex.sourceId}.mp4`),
      path.join(videosDir, `${ex.sourceId}.mov`),
      path.join(videosDir, `${ex.sourceId}.webm`),
    ];

    if (hasImg === 0) {
      const imgPath = imageCandidates.find(exists) ?? null;
      if (imgPath) {
        const uploaded = await uploadFile(imgPath, { folder: `regen/exercises/${ex.id}`, resourceType: "image" });
        const maxOrder = await prisma.exerciseMedia.aggregate({ where: { exerciseId: ex.id }, _max: { displayOrder: true } });
        await prisma.exerciseMedia.create({
          data: {
            exerciseId: ex.id,
            mediaType: "image",
            url: uploaded.secureUrl,
            publicId: uploaded.publicId,
            width: uploaded.width,
            height: uploaded.height,
            fileSize: uploaded.bytes,
            isPrimary: true,
            displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
          },
        });
        uploadedImages += 1;
      }
    }

    if (hasVid === 0) {
      const vidPath = videoCandidates.find(exists) ?? null;
      if (vidPath) {
        const uploaded = await uploadFile(vidPath, { folder: `regen/exercises/${ex.id}`, resourceType: "video" });
        const maxOrder = await prisma.exerciseMedia.aggregate({ where: { exerciseId: ex.id }, _max: { displayOrder: true } });
        await prisma.exerciseMedia.create({
          data: {
            exerciseId: ex.id,
            mediaType: "video",
            url: uploaded.secureUrl,
            publicId: uploaded.publicId,
            width: uploaded.width,
            height: uploaded.height,
            fileSize: uploaded.bytes,
            duration: uploaded.duration,
            isPrimary: false,
            displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
          },
        });
        uploadedVideos += 1;
      }
    }
  }

  console.log(JSON.stringify({ uploadedImages, uploadedVideos, skipped, totalBasics: basics.length }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
