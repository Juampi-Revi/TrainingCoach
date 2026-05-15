import { prisma } from "@/lib/prisma";

type ListArgs = {
  coachUserId: string;
  q: string;
  muscles: string[] | null;
  equipments: string[] | null;
  difficulties: string[] | null;
  objectives: string[] | null;
  favoritesOnly: boolean;
  limit: number;
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

export async function listCoachExercises(args: ListArgs) {
  const { coachUserId, q, muscles, equipments, difficulties, objectives, favoritesOnly, limit } = args;

  try {
    const exercises = await prisma.exercise.findMany({
      where: {
        OR: [{ isSystem: true }, { coachUserId }],
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
        ...(muscles?.length ? { primaryMuscle: { in: muscles } } : {}),
        ...(equipments?.length ? { equipment: { in: equipments } } : {}),
        ...(difficulties?.length ? { difficulty: { in: difficulties } } : {}),
        ...(objectives?.length ? { objective: { in: objectives } } : {}),
        ...(favoritesOnly ? { favoritedBy: { some: { coachUserId } } } : {}),
      },
      orderBy: [{ name: "asc" }],
      take: limit,
      select: {
        id: true,
        name: true,
        primaryMuscle: true,
        equipment: true,
        difficulty: true,
        objective: true,
        isSystem: true,
        youtubeUrl: true,
        favoritedBy: { where: { coachUserId }, select: { id: true }, take: 1 },
        media: { select: { url: true, mediaType: true, publicId: true }, take: 1, orderBy: { isPrimary: "desc" } },
      },
    });

    const mapped = exercises.map((e) => {
      let thumbnailUrl: string | null = null;
      const firstMedia = e.media[0];
      if (firstMedia?.mediaType === "image") thumbnailUrl = firstMedia.url;
      if (firstMedia?.mediaType === "video" && firstMedia.publicId) {
        thumbnailUrl = `https://img.youtube.com/vi/${firstMedia.publicId}/mqdefault.jpg`;
      }
      return {
        id: e.id,
        name: e.name,
        primaryMuscle: e.primaryMuscle,
        equipment: e.equipment,
        difficulty: e.difficulty ?? null,
        objective: e.objective ?? null,
        isSystem: e.isSystem,
        youtubeUrl: e.youtubeUrl,
        thumbnailUrl,
        isFavorite: e.favoritedBy.length > 0,
      };
    });

    mapped.sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      if (a.isSystem !== b.isSystem) return a.isSystem ? -1 : 1;
      return a.name.localeCompare(b.name, "es");
    });

    return mapped;
  } catch (e) {
    const msg = messageOf(e);
    if (!looksLikeSchemaOutOfDate(msg)) throw e;
    if (favoritesOnly) return [];

    const exercises = await prisma.exercise.findMany({
      where: {
        OR: [{ isSystem: true }, { coachUserId }],
        ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
        ...(muscles?.length ? { primaryMuscle: { in: muscles } } : {}),
        ...(equipments?.length ? { equipment: { in: equipments } } : {}),
      },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      take: limit,
      select: {
        id: true,
        name: true,
        primaryMuscle: true,
        equipment: true,
        isSystem: true,
        youtubeUrl: true,
        media: { select: { url: true, mediaType: true, publicId: true }, take: 1, orderBy: { isPrimary: "desc" } },
      },
    });

    return exercises.map((e) => {
      let thumbnailUrl: string | null = null;
      const firstMedia = e.media[0];
      if (firstMedia?.mediaType === "image") thumbnailUrl = firstMedia.url;
      if (firstMedia?.mediaType === "video" && firstMedia.publicId) {
        thumbnailUrl = `https://img.youtube.com/vi/${firstMedia.publicId}/mqdefault.jpg`;
      }
      return {
        id: e.id,
        name: e.name,
        primaryMuscle: e.primaryMuscle,
        equipment: e.equipment,
        difficulty: null,
        objective: null,
        isSystem: e.isSystem,
        youtubeUrl: e.youtubeUrl,
        thumbnailUrl,
        isFavorite: false,
      };
    });
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

