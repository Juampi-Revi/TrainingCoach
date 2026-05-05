// Badge definitions - shared between frontend and backend

export type BadgeCategory = "steps" | "workouts" | "streak" | "nutrition" | "social" | "special";

export type BadgeTier = "bronze" | "silver" | "gold" | "platinum";

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  tier: BadgeTier;
  icon: string;
  requirement: {
    type: "count" | "streak" | "days";
    target: number;
    metric: string;
  };
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  // Steps badges
  {
    id: "steps_10k",
    name: "Primeros 10K",
    description: "Completa 10,000 pasos en un día",
    category: "steps",
    tier: "bronze",
    icon: "footprint",
    requirement: { type: "count", target: 10000, metric: "steps_single_day" },
  },
  {
    id: "steps_100k_week",
    name: "Caminante dedicado",
    description: "Alcanza 100,000 pasos en una semana",
    category: "steps",
    tier: "silver",
    icon: "footprint",
    requirement: { type: "count", target: 100000, metric: "steps_weekly" },
  },
  {
    id: "steps_7day_streak",
    name: "Racha de pasos",
    description: "Completa tu meta de pasos 7 días seguidos",
    category: "steps",
    tier: "gold",
    icon: "footprint",
    requirement: { type: "streak", target: 7, metric: "steps_goal_streak" },
  },

  // Workout badges
  {
    id: "workout_first",
    name: "Primera sesión",
    description: "Completa tu primer entrenamiento",
    category: "workouts",
    tier: "bronze",
    icon: "dumbbell",
    requirement: { type: "count", target: 1, metric: "workouts_total" },
  },
  {
    id: "workout_10",
    name: "Diez sesiones",
    description: "Completa 10 entrenamientos",
    category: "workouts",
    tier: "bronze",
    icon: "dumbbell",
    requirement: { type: "count", target: 10, metric: "workouts_total" },
  },
  {
    id: "workout_50",
    name: "Maestro del gym",
    description: "Completa 50 entrenamientos",
    category: "workouts",
    tier: "silver",
    icon: "dumbbell",
    requirement: { type: "count", target: 50, metric: "workouts_total" },
  },
  {
    id: "workout_100",
    name: "Leyenda del fitness",
    description: "Completa 100 entrenamientos",
    category: "workouts",
    tier: "gold",
    icon: "dumbbell",
    requirement: { type: "count", target: 100, metric: "workouts_total" },
  },

  // Streak badges
  {
    id: "streak_3",
    name: "Tres en raya",
    description: "Entrena 3 días seguidos",
    category: "streak",
    tier: "bronze",
    icon: "flame",
    requirement: { type: "streak", target: 3, metric: "workout_streak" },
  },
  {
    id: "streak_7",
    name: "Semana perfecta",
    description: "Entrena 7 días seguidos",
    category: "streak",
    tier: "silver",
    icon: "flame",
    requirement: { type: "streak", target: 7, metric: "workout_streak" },
  },
  {
    id: "streak_30",
    name: "Mes de fuego",
    description: "Entrena 30 días seguidos",
    category: "streak",
    tier: "gold",
    icon: "flame",
    requirement: { type: "streak", target: 30, metric: "workout_streak" },
  },

  // Nutrition badges
  {
    id: "food_log_7",
    name: "Comida consciente",
    description: "Registra tus comidas 7 días seguidos",
    category: "nutrition",
    tier: "bronze",
    icon: "target",
    requirement: { type: "streak", target: 7, metric: "food_log_streak" },
  },
  {
    id: "food_log_30",
    name: "Nutricionista",
    description: "Registra tus comidas 30 días seguidos",
    category: "nutrition",
    tier: "silver",
    icon: "target",
    requirement: { type: "streak", target: 30, metric: "food_log_streak" },
  },

  // Special badges
  {
    id: "early_adopter",
    name: "Pionero",
    description: "Únete durante el periodo de lanzamiento",
    category: "special",
    tier: "platinum",
    icon: "star",
    requirement: { type: "count", target: 1, metric: "early_access" },
  },
  {
    id: "complete_profile",
    name: "Perfil completo",
    description: "Completa toda tu información de perfil",
    category: "social",
    tier: "bronze",
    icon: "user",
    requirement: { type: "count", target: 1, metric: "profile_complete" },
  },
];

export function getBadgeById(id: string): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS.find((b) => b.id === id);
}

export function getBadgesByCategory(category: BadgeCategory): BadgeDefinition[] {
  return BADGE_DEFINITIONS.filter((b) => b.category === category);
}

export function getTierColor(tier: BadgeTier): string {
  switch (tier) {
    case "bronze":
      return "#CD7F32";
    case "silver":
      return "#C0C0C0";
    case "gold":
      return "#FFD700";
    case "platinum":
      return "#E5E4E2";
    default:
      return "#666";
  }
}
