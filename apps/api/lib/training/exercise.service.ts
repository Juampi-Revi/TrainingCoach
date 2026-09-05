import { prisma } from "@/lib/prisma";

type ListArgs = {
  coachUserId: string;
  q: string;
  muscles: string[] | null;
  equipments: string[] | null;
  difficulties: string[] | null;
  objectives: string[] | null;
  favoritesOnly: boolean;
  basicsOnly?: boolean;
  limit: number;
  offset?: number;
  mediaFilter?: "any" | "complete" | "missing" | "missingImage" | "missingVideo";
};

function messageOf(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

function looksLikeSchemaOutOfDate(msg: string): boolean {
  return (
    msg.includes("does not exist") &&
    (msg.includes("CoachExerciseFavorite") || msg.includes("difficulty") || msg.includes("objective"))
  );
}

const BASIC_SOURCE = "regen_basic_v1";
const GUIDE_SOURCE = "bryllim/workout-guide";

export async function listCoachExercises(args: ListArgs) {
  const {
    coachUserId,
    q,
    muscles,
    equipments,
    difficulties,
    objectives,
    favoritesOnly,
    basicsOnly = false,
    limit,
    offset = 0,
    mediaFilter = "any",
  } = args;

  const take = Math.min(1200, Math.max(limit, offset + (mediaFilter === "any" ? limit : Math.max(limit * 4, limit))));

  try {
    const exercises = await prisma.exercise.findMany({
      where: {
        OR: [{ isSystem: true }, { coachUserId }],
        ...(basicsOnly ? { source: BASIC_SOURCE } : {}),
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
        ...(muscles?.length ? { primaryMuscle: { in: muscles } } : {}),
        ...(equipments?.length ? { equipment: { in: equipments } } : {}),
        ...(difficulties?.length ? { difficulty: { in: difficulties } } : {}),
        ...(objectives?.length ? { objective: { in: objectives } } : {}),
        ...(favoritesOnly ? { favoritedBy: { some: { coachUserId } } } : {}),
      },
      orderBy: [{ name: "asc" }],
      take,
      select: {
        id: true,
        name: true,
        primaryMuscle: true,
        equipment: true,
        difficulty: true,
        objective: true,
        isSystem: true,
        source: true,
        sourceId: true,
        youtubeUrl: true,
        favoritedBy: { where: { coachUserId }, select: { id: true }, take: 1 },
        media: { select: { url: true, mediaType: true, publicId: true }, take: 4, orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }] },
      },
    });

    const mapped = exercises.map((e) => {
      let thumbnailUrl: string | null = null;
      const hasImage = e.media.some((m) => m.mediaType === "image") || false;
      const hasVideo = e.media.some((m) => m.mediaType === "video") || !!(e.youtubeUrl && e.youtubeUrl.trim());
      const isBasic = e.source === BASIC_SOURCE;
      const isGuide = e.source === GUIDE_SOURCE;
      const firstMedia = e.media[0];
      if (firstMedia?.mediaType === "image") thumbnailUrl = firstMedia.url;
      if (firstMedia?.mediaType === "video" && firstMedia.publicId) {
        if (firstMedia.url.includes("youtube.com") || firstMedia.url.includes("youtu.be")) {
          thumbnailUrl = `https://img.youtube.com/vi/${firstMedia.publicId}/mqdefault.jpg`;
        } else if (process.env.CLOUDINARY_CLOUD_NAME) {
          thumbnailUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/so_0,c_fill,w_200,h_250,q_auto,f_jpg/${firstMedia.publicId}.jpg`;
        }
      }
      return {
        id: e.id,
        name: e.name,
        primaryMuscle: e.primaryMuscle,
        equipment: e.equipment,
        difficulty: e.difficulty ?? null,
        objective: e.objective ?? null,
        isSystem: e.isSystem,
        isBasic,
        isGuide,
        source: e.source,
        sourceId: e.sourceId,
        youtubeUrl: e.youtubeUrl,
        thumbnailUrl,
        isFavorite: e.favoritedBy.length > 0,
        hasImage,
        hasVideo,
      };
    });

    mapped.sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      if (a.isBasic !== b.isBasic) return a.isBasic ? -1 : 1;
      if (a.isGuide !== b.isGuide) return a.isGuide ? -1 : 1;
      if (a.isSystem !== b.isSystem) return a.isSystem ? -1 : 1;
      return a.name.localeCompare(b.name, "es");
    });

    if (mediaFilter === "any") return mapped.slice(offset, offset + limit);

    const filtered = mapped.filter((e) => {
      const complete = e.hasImage && e.hasVideo;
      if (mediaFilter === "complete") return complete;
      if (mediaFilter === "missing") return !complete;
      if (mediaFilter === "missingImage") return !e.hasImage;
      if (mediaFilter === "missingVideo") return !e.hasVideo;
      return true;
    });

    return filtered.slice(offset, offset + limit);
  } catch (e) {
    const msg = messageOf(e);
    if (!looksLikeSchemaOutOfDate(msg)) throw e;
    if (favoritesOnly) return [];

    const exercises = await prisma.exercise.findMany({
      where: {
        OR: [{ isSystem: true }, { coachUserId }],
        ...(basicsOnly ? { source: BASIC_SOURCE } : {}),
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
        ...(muscles?.length ? { primaryMuscle: { in: muscles } } : {}),
        ...(equipments?.length ? { equipment: { in: equipments } } : {}),
      },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      take,
      select: {
        id: true,
        name: true,
        primaryMuscle: true,
        equipment: true,
        isSystem: true,
        source: true,
        sourceId: true,
        youtubeUrl: true,
        media: { select: { url: true, mediaType: true, publicId: true }, take: 4, orderBy: [{ isPrimary: "desc" }, { displayOrder: "asc" }] },
      },
    });

    const mapped = exercises.map((e) => {
      let thumbnailUrl: string | null = null;
      const hasImage = e.media.some((m) => m.mediaType === "image") || false;
      const hasVideo = e.media.some((m) => m.mediaType === "video") || !!(e.youtubeUrl && e.youtubeUrl.trim());
      const isBasic = e.source === BASIC_SOURCE;
      const isGuide = e.source === GUIDE_SOURCE;
      const firstMedia = e.media[0];
      if (firstMedia?.mediaType === "image") thumbnailUrl = firstMedia.url;
      if (firstMedia?.mediaType === "video" && firstMedia.publicId) {
        if (firstMedia.url.includes("youtube.com") || firstMedia.url.includes("youtu.be")) {
          thumbnailUrl = `https://img.youtube.com/vi/${firstMedia.publicId}/mqdefault.jpg`;
        } else if (process.env.CLOUDINARY_CLOUD_NAME) {
          thumbnailUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/video/upload/so_0,c_fill,w_200,h_250,q_auto,f_jpg/${firstMedia.publicId}.jpg`;
        }
      }
      return {
        id: e.id,
        name: e.name,
        primaryMuscle: e.primaryMuscle,
        equipment: e.equipment,
        difficulty: null,
        objective: null,
        isSystem: e.isSystem,
        isBasic,
        isGuide,
        source: e.source,
        sourceId: e.sourceId,
        youtubeUrl: e.youtubeUrl,
        thumbnailUrl,
        isFavorite: false,
        hasImage,
        hasVideo,
      };
    });

    if (mediaFilter === "any") return mapped.slice(offset, offset + limit);
    const filtered = mapped.filter((e) => {
      const complete = e.hasImage && e.hasVideo;
      if (mediaFilter === "complete") return complete;
      if (mediaFilter === "missing") return !complete;
      if (mediaFilter === "missingImage") return !e.hasImage;
      if (mediaFilter === "missingVideo") return !e.hasVideo;
      return true;
    });
    return filtered.slice(offset, offset + limit);
  }
}

export async function getCoachExerciseFacets(coachUserId: string) {
  const baseWhere = { OR: [{ isSystem: true }, { coachUserId }] };

  try {
    const [muscles, equipments, difficulties, objectives] = await Promise.all([
      prisma.exercise.groupBy({
        by: ["primaryMuscle"],
        where: { ...baseWhere, primaryMuscle: { not: null } },
        _count: { primaryMuscle: true },
        orderBy: [{ _count: { primaryMuscle: "desc" } }],
        take: 100,
      }),
      prisma.exercise.groupBy({
        by: ["equipment"],
        where: { ...baseWhere, equipment: { not: null } },
        _count: { equipment: true },
        orderBy: [{ _count: { equipment: "desc" } }],
        take: 200,
      }),
      prisma.exercise.groupBy({
        by: ["difficulty"],
        where: { ...baseWhere, difficulty: { not: null } },
        _count: { difficulty: true },
        orderBy: [{ _count: { difficulty: "desc" } }],
        take: 20,
      }),
      prisma.exercise.groupBy({
        by: ["objective"],
        where: { ...baseWhere, objective: { not: null } },
        _count: { objective: true },
        orderBy: [{ _count: { objective: "desc" } }],
        take: 50,
      }),
    ]);

    return {
      muscles: muscles.map((m) => m.primaryMuscle).filter((v): v is string => !!v),
      equipments: equipments.map((m) => m.equipment).filter((v): v is string => !!v),
      difficulties: difficulties.map((m) => m.difficulty).filter((v): v is string => !!v),
      objectives: objectives.map((m) => m.objective).filter((v): v is string => !!v),
    };
  } catch (e) {
    const msg = messageOf(e);
    if (!looksLikeSchemaOutOfDate(msg)) throw e;

    const [muscles, equipments] = await Promise.all([
      prisma.exercise.groupBy({
        by: ["primaryMuscle"],
        where: { ...baseWhere, primaryMuscle: { not: null } },
        _count: { primaryMuscle: true },
        orderBy: [{ _count: { primaryMuscle: "desc" } }],
        take: 100,
      }),
      prisma.exercise.groupBy({
        by: ["equipment"],
        where: { ...baseWhere, equipment: { not: null } },
        _count: { equipment: true },
        orderBy: [{ _count: { equipment: "desc" } }],
        take: 200,
      }),
    ]);

    return {
      muscles: muscles.map((m) => m.primaryMuscle).filter((v): v is string => !!v),
      equipments: equipments.map((m) => m.equipment).filter((v): v is string => !!v),
      difficulties: [],
      objectives: [],
    };
  }
}
