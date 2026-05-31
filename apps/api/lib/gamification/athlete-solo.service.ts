import { prisma } from "@/lib/prisma";

export interface OnboardingData {
  goal: "lose_weight" | "build_muscle" | "maintain" | "improve_endurance" | "general_fitness";
  experience: "beginner" | "intermediate" | "advanced";
  daysPerWeek: number;
  sessionDuration: 30 | 45 | 60 | 90;
  equipment: ("gym" | "dumbbells" | "home" | "bodyweight")[];
  focusAreas: ("upper" | "lower" | "core" | "cardio" | "full_body")[];
}

/**
 * Create an athlete solo onboarding record
 */
export async function createAthleteOnboarding(
  userId: string,
  data: OnboardingData
): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO "AthleteOnboarding" (
      id, "userId", goal, experience, "daysPerWeek", "sessionDuration", 
      equipment, "focusAreas", "createdAt", "updatedAt"
    )
    VALUES (
      gen_random_uuid(), ${userId}, ${data.goal}, ${data.experience}, 
      ${data.daysPerWeek}, ${data.sessionDuration}, 
      ${data.equipment}, ${data.focusAreas}, NOW(), NOW()
    )
    ON CONFLICT ("userId") 
    DO UPDATE SET
      goal = EXCLUDED.goal,
      experience = EXCLUDED.experience,
      "daysPerWeek" = EXCLUDED."daysPerWeek",
      "sessionDuration" = EXCLUDED."sessionDuration",
      equipment = EXCLUDED.equipment,
      "focusAreas" = EXCLUDED."focusAreas",
      "updatedAt" = NOW()
  `;
}

/**
 * Get athlete onboarding data
 */
export async function getAthleteOnboarding(userId: string): Promise<OnboardingData | null> {
  const result = await prisma.$queryRaw<Array<{
    goal: string;
    experience: string;
    daysPerWeek: number;
    sessionDuration: number;
    equipment: string[];
    focusAreas: string[];
  }>>`
    SELECT goal, experience, "daysPerWeek", "sessionDuration", equipment, "focusAreas"
    FROM "AthleteOnboarding"
    WHERE "userId" = ${userId}
    LIMIT 1
  `;

  if (result.length === 0) return null;

  return {
    goal: result[0].goal as OnboardingData["goal"],
    experience: result[0].experience as OnboardingData["experience"],
    daysPerWeek: result[0].daysPerWeek,
    sessionDuration: result[0].sessionDuration as OnboardingData["sessionDuration"],
    equipment: result[0].equipment as OnboardingData["equipment"],
    focusAreas: result[0].focusAreas as OnboardingData["focusAreas"],
  };
}

/**
 * Check if user is in athlete solo mode (no coach assigned)
 */
export async function isAthleteSolo(userId: string): Promise<boolean> {
  const result = await prisma.$queryRaw<Array<{ count: number }>>`
    SELECT COUNT(*)::int as count
    FROM "CoachClient"
    WHERE "clientUserId" = ${userId} AND status = 'active'
  `;

  return result[0].count === 0;
}

/**
 * Generate workout recommendations based on onboarding data
 */
export function generateWorkoutRecommendations(data: OnboardingData): {
  workoutType: string;
  exercises: string[];
  sets: number;
  reps: string;
  restSeconds: number;
}[] {
  const recommendations: ReturnType<typeof generateWorkoutRecommendations> = [];

  // Base recommendations on experience level
  const baseSets = data.experience === "beginner" ? 3 : data.experience === "intermediate" ? 4 : 5;
  const baseReps = data.goal === "build_muscle" ? "8-12" : data.goal === "lose_weight" ? "12-15" : "10-12";
  const restSeconds = data.goal === "improve_endurance" ? 30 : 60;

  // Generate based on focus areas
  for (const focus of data.focusAreas.slice(0, data.daysPerWeek)) {
    let exercises: string[] = [];
    let workoutType = "";

    switch (focus) {
      case "upper":
        workoutType = "Tren Superior";
        exercises = ["Push-ups", "Dumbbell Rows", "Shoulder Press", "Bicep Curls", "Tricep Dips"];
        break;
      case "lower":
        workoutType = "Tren Inferior";
        exercises = ["Squats", "Lunges", "Romanian Deadlifts", "Leg Press", "Calf Raises"];
        break;
      case "core":
        workoutType = "Core";
        exercises = ["Plank", "Russian Twists", "Leg Raises", "Mountain Climbers", "Crunches"];
        break;
      case "cardio":
        workoutType = "Cardio";
        exercises = ["Jumping Jacks", "Burpees", "High Knees", "Jump Rope", "Box Jumps"];
        break;
      case "full_body":
      default:
        workoutType = "Cuerpo Completo";
        exercises = ["Squats", "Push-ups", "Rows", "Shoulder Press", "Lunges", "Plank"];
        break;
    }

    // Adjust exercises based on equipment
    if (data.equipment.includes("bodyweight")) {
      exercises = exercises.map(ex => ex.replace("Dumbbell", "Bodyweight").replace("Barbell", "Bodyweight"));
    }

    recommendations.push({
      workoutType,
      exercises,
      sets: baseSets,
      reps: baseReps,
      restSeconds,
    });
  }

  return recommendations;
}

/**
 * Create a self-guided plan from onboarding data
 */
export async function createSelfGuidedPlan(
  userId: string,
  data: OnboardingData
): Promise<{ planId: string; workouts: string[] }> {
  // Generate workouts
  const recommendations = generateWorkoutRecommendations(data);
  
  // Create plan
  const planResult = await prisma.$queryRaw<Array<{ id: string }>>`
    INSERT INTO "Plan" (
      id, "coachUserId", title, goal, "weeksCount", "periodDays", 
      status, "planType", "isPublic", "createdAt", "updatedAt"
    )
    VALUES (
      gen_random_uuid(), ${userId}, 'Mi Plan Personalizado', ${data.goal}, 
      4, 28, 'published', 'self_guided', false, NOW(), NOW()
    )
    RETURNING id
  `;

  const planId = planResult[0].id;
  const workoutIds: string[] = [];

  // Create workouts for each day
  for (let week = 1; week <= 4; week++) {
    await prisma.$executeRaw`
      INSERT INTO "PlanWeek" (id, "planId", "weekNumber", title, notes)
      VALUES (gen_random_uuid(), ${planId}, ${week}, 'Semana ${week}', 
        'Semana ${week} de tu plan personalizado')
    `;

    for (let day = 0; day < Math.min(data.daysPerWeek, recommendations.length); day++) {
      const rec = recommendations[day];
      
      // Create workout template
      const workoutResult = await prisma.$queryRaw<Array<{ id: string }>>`
        INSERT INTO "WorkoutTemplate" (
          id, "planWeekId", type, title, description, tags, "sortOrder", "createdAt", "updatedAt"
        )
        VALUES (
          gen_random_uuid(), 
          (SELECT id FROM "PlanWeek" WHERE "planId" = ${planId} AND "weekNumber" = ${week}),
          'strength',
          ${rec.workoutType},
          'Workout generado automáticamente basado en tus preferencias',
          ARRAY['self_guided', ${data.goal}],
          ${day},
          NOW(),
          NOW()
        )
        RETURNING id
      `;

      workoutIds.push(workoutResult[0].id);

      // Create blocks and exercises (simplified)
      await prisma.$executeRaw`
        INSERT INTO "WorkoutBlock" (
          id, "workoutTemplateId", "sortOrder", type, label, "restAfterSeconds"
        )
        VALUES (
          gen_random_uuid(), ${workoutResult[0].id}, 0, 'strength', 'Bloque Principal', ${rec.restSeconds}
        )
      `;
    }
  }

  // Create plan assignment
  await prisma.$executeRaw`
    INSERT INTO "PlanAssignment" (
      id, "planId", "clientUserId", "startDate", status, "createdAt", "updatedAt"
    )
    VALUES (
      gen_random_uuid(), ${planId}, ${userId}, CURRENT_DATE, 'active', NOW(), NOW()
    )
  `;

  return { planId, workouts: workoutIds };
}