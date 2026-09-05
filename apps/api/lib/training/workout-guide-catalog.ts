import { exercises as guideExercises, type Exercise as GuideExercise } from "@bryllim/workout-guide";
import { prisma } from "@/lib/prisma";

export const WORKOUT_GUIDE_SOURCE = "bryllim/workout-guide";

const MUSCLE_MAP: Record<string, string> = {
  Chest: "chest",
  Back: "back",
  Lats: "back",
  "Upper Back": "back",
  "Lower Back": "back",
  "Posterior Chain": "back",
  Shoulders: "shoulders",
  "Rear Delts": "shoulders",
  Biceps: "biceps",
  Triceps: "triceps",
  Quads: "legs",
  Hamstrings: "legs",
  Legs: "legs",
  Adductors: "legs",
  Glutes: "glutes",
  Calves: "calves",
  Core: "core",
  Forearms: "forearms",
  Grip: "forearms",
  Groin: "legs",
  Hips: "glutes",
  Cardio: "full_body",
  Mobility: "core",
};

const EQUIPMENT_MAP: Record<string, string> = {
  Barbell: "Barra",
  Dumbbell: "Mancuernas",
  Cable: "Polea",
  Machine: "Máquina",
  Bodyweight: "Peso corporal",
  Kettlebell: "Kettlebell",
  "Pull-up Bar": "Peso corporal",
  "Resistance Band": "Accesorio",
  Bench: "Banco",
  Box: "Cajón",
  Plate: "Disco",
  Cardio: "Cardio",
  Chair: "Accesorio",
  Doorway: "Accesorio",
  "Stability Ball": "Accesorio",
  Towel: "Accesorio",
  Wall: "Peso corporal",
};

export function mapGuideMuscle(value: string): string {
  return MUSCLE_MAP[value] ?? "full_body";
}

export function mapGuideEquipment(value: string): string {
  return EQUIPMENT_MAP[value] ?? value;
}

export function mapGuideObjective(exerciseType: string, isStretch: boolean): string {
  if (isStretch) return "mobility";
  if (exerciseType === "duration" || exerciseType === "distance_duration") return "conditioning";
  if (exerciseType === "assisted_bodyweight") return "skill";
  return "hypertrophy";
}

export function mapGuideDifficulty(exerciseType: string): string {
  if (exerciseType === "assisted_bodyweight") return "intermediate";
  if (exerciseType === "weight_reps") return "intermediate";
  return "beginner";
}

export type GuideCatalogRow = {
  source: string;
  sourceId: string;
  name: string;
  primaryMuscle: string;
  equipment: string;
  difficulty: string;
  objective: string;
  isSystem: true;
  coachUserId: null;
};

export function buildGuideCatalogRows(): GuideCatalogRow[] {
  return guideExercises.map((exercise: GuideExercise) => ({
    source: WORKOUT_GUIDE_SOURCE,
    sourceId: exercise.slug,
    name: exercise.name,
    primaryMuscle: mapGuideMuscle(exercise.primaryMuscle),
    equipment: mapGuideEquipment(exercise.equipment),
    difficulty: mapGuideDifficulty(exercise.exerciseType),
    objective: mapGuideObjective(exercise.exerciseType, exercise.isStretch),
    isSystem: true as const,
    coachUserId: null,
  }));
}

export async function seedWorkoutGuideCatalog(): Promise<{ created: number; updated: number }> {
  const rows = buildGuideCatalogRows();
  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const existing = await prisma.exercise.findFirst({
      where: { source: row.source, sourceId: row.sourceId },
      select: { id: true },
    });

    if (existing) {
      await prisma.exercise.update({
        where: { id: existing.id },
        data: {
          name: row.name,
          primaryMuscle: row.primaryMuscle,
          equipment: row.equipment,
          difficulty: row.difficulty,
          objective: row.objective,
          isSystem: true,
        },
      });
      updated += 1;
    } else {
      await prisma.exercise.create({ data: row });
      created += 1;
    }
  }

  return { created, updated };
}
