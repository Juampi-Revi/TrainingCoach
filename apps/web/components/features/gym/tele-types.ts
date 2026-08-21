export type TeleMediaItem = { url: string; mediaType: string; publicId?: string | null };

export type TeleExerciseItem = {
  id: string;
  sortOrder: number;
  targetSets: number | null;
  targetReps: string | null;
  restSeconds: number | null;
  intensityType: string | null;
  intensityTarget: number | null;
  durationSeconds: number | null;
  notes: string | null;
  exercise: {
    id: string;
    name: string;
    primaryMuscle: string | null;
    equipment: string | null;
    difficulty: string | null;
    media: TeleMediaItem[];
  };
};

export type TeleBlockItem = {
  id: string;
  type: string;
  label: string | null;
  intervalType: string | null;
  workSeconds: number | null;
  restSeconds: number | null;
  rounds: number | null;
  totalDurationSeconds: number | null;
  targetMinutes: number | null;
  targetZone: string | null;
  exercises: TeleExerciseItem[];
};

export type TeleClassData = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  teleMode: "static" | "timed";
  currentExercise?: number;
  workoutTemplate: {
    id: string;
    title: string;
    type: string;
    description: string | null;
    workoutBlocks: TeleBlockItem[];
  };
};

export function getTeleThumbnail(exercise: TeleExerciseItem["exercise"]): string | null {
  const m = exercise.media[0];
  if (!m) return null;
  if (m.mediaType === "image") return m.url;
  if (m.mediaType === "video" && m.publicId) {
    return `https://img.youtube.com/vi/${m.publicId}/mqdefault.jpg`;
  }
  return null;
}

export function flatTeleExercises(
  blocks: TeleBlockItem[],
): (TeleExerciseItem & { blockLabel: string | null; blockType: string })[] {
  return blocks.flatMap((b) =>
    b.exercises.map((we) => ({ ...we, blockLabel: b.label, blockType: b.type })),
  );
}
