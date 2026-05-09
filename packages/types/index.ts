// ─────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────
export type UserRole = "coach" | "client";
export type BillingStatus = "good" | "due";

/**
 * Tipos de usuario para futuro multi-tenant.
 * Hoy: athlete (cliente sin plan), gym_member (futuro), coach, gym_admin (futuro).
 */
export type UserType = "athlete" | "gym_member" | "coach" | "gym_admin";

/**
 * Tipos de negocio para futuro multi-tenant.
 * hoy: solo coach individual.
 * futuro: gym (gimnasio con admin), online_platform (plataforma tipo ClassPass).
 */
export type BusinessType = "solo_coach" | "gym" | "online_platform";
export type SessionStatus = "in_progress" | "completed" | "discarded";
export type PlanStatus = "draft" | "published" | "archived";
export type AssignmentStatus = "active" | "paused" | "finished";
export type BlockType = "warmup" | "strength" | "intervals" | "cardio" | "cooldown";
export type IntervalType = "tabata" | "hiit" | "emom" | "amrap";

export interface WorkoutBlockSummary {
  id: string;
  type: BlockType;
  label: string | null;
  description: string | null;
  sortOrder: number;
  restAfterSeconds: number | null; // rest after completing this block

  // Interval-specific (type = 'intervals')
  intervalType: IntervalType | null;
  workSeconds: number | null;
  restSeconds: number | null;
  rounds: number | null;
  totalDurationSeconds: number | null;
  restBetweenExercisesSeconds: number | null;

  // Cardio-specific (type = 'cardio')
  targetMinutes: number | null;
  targetZone: string | null;

  // Metadata
  exerciseCount: number;
}

// ─────────────────────────────────────────────────────────────
// Generic API envelope
// ─────────────────────────────────────────────────────────────
export interface ApiOk<T> {
  ok: true;
  data: T;
}
export interface ApiError {
  ok: false;
  error: string;
  code?: string;
}
export type ApiResponse<T> = ApiOk<T> | ApiError;

// ─────────────────────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: UserRole;
  billingStatus: BillingStatus;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
}

// ─────────────────────────────────────────────────────────────
// Exercises
// ─────────────────────────────────────────────────────────────
export interface ExerciseSummary {
  id: string;
  name: string;
  primaryMuscle: string | null;
  equipment: string | null;
  isSystem: boolean;
  thumbnailUrl: string | null;
}

export interface ExerciseTarget {
  sets: number | null;
  reps: string | null;
  durationSeconds: number | null;
  intensityType: string | null;
  intensityTarget: string | null;
  restSeconds: number | null;
  notes: string | null;
  groupNote: string | null;
}

// ─────────────────────────────────────────────────────────────
// Sets
// ─────────────────────────────────────────────────────────────
export interface WorkoutSet {
  id: string;
  setNumber: number;
  reps: number | null;
  durationSeconds: number | null;
  weight: string | null;
  rpe: string | null;
  rir: string | null;
  notes: string | null;
}

export interface UpsertSetRequest {
  reps?: string | number | null;
  weight?: string | number | null;
  rpe?: string | number | null;
  rir?: string | number | null;
  notes?: string | null;
}

// ─────────────────────────────────────────────────────────────
// Workout Templates
// ─────────────────────────────────────────────────────────────
export interface WorkoutTemplateSummary {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  exerciseCount: number;
  updatedAt: string;
}

export interface WorkoutTemplateDetail {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  type: string;
  blocks: WorkoutBlockSummary[];
  exercises: Array<{
    id: string;
    sortOrder: number;
    supersetGroup: string | null;
    workoutBlockId: string;
    exercise: { id: string; name: string; primaryMuscle: string | null; equipment: string | null; thumbnailUrl: string | null; youtubeUrl?: string | null; isSystem?: boolean };
    targetSets: number | null;
    targetReps: string | null;
    durationSeconds: number | null;
    intensityType: string | null;
    intensityTarget: string | null;
    restSeconds: number | null;
    notes: string | null;
    groupNote: string | null;
    alternativesCount?: number;
  }>;
}

// ─────────────────────────────────────────────────────────────
// Sessions
// ─────────────────────────────────────────────────────────────
export interface SessionExercise {
  id: string;
  sortOrder: number;
  supersetGroup: string | null;
  block: WorkoutBlockSummary;
  exercise: { id: string; name: string; primaryMuscle: string | null; thumbnailUrl: string | null; youtubeUrl?: string | null };
  media: { id: string; url: string; mediaType: string }[];
  alternatives: { exerciseId: string; name: string; primaryMuscle: string | null }[];
  target: ExerciseTarget | null;
  sets: WorkoutSet[];
}

export interface SessionDetail {
  id: string;
  status: SessionStatus;
  performedAt: string;
  completedAt: string | null;
  energyRating: number | null;
  sessionNotes: string | null;
  workoutTemplate: { id: string; title: string; description: string | null; tags: string[] } | null;
  exercises: SessionExercise[];
}

export interface SessionSummary {
  id: string;
  status: SessionStatus;
  performedAt: string;
  completedAt: string | null;
  energyRating: number | null;
  sessionNotes: string | null;
  workoutTemplate: { id: string; title: string; tags: string[] } | null;
  setsCount: number;
  targetSetsCount: number;
}

export interface PatchSessionRequest {
  status?: SessionStatus;
  energyRating?: number | null;
  sessionNotes?: string | null;
  performedAt?: string;
  completedAt?: string | null;
}

export interface ActivitySummary {
  range: { start: string; end: string; days: number };
  activeDaysCount: number;
  activeDays: string[];
  sportMinutesTotal: number;
  sessionsCompleted: number;
  energyAvg: number | null;
  energyScale: 5;
}

export interface MuscleStats {
  range: { start: string; end: string; days: number };
  items: Array<{ muscle: string; sets: number; exercises: number }>;
}

export interface ExerciseSummary {
  id: string;
  name: string;
  primaryMuscle: string | null;
}

export interface ExerciseListSummary {
  range: { start: string; end: string; days: number };
  items: ExerciseSummary[];
}

export interface ExerciseProgressionPoint {
  day: string;
  bestWeight: number;
  bestReps: number;
  bestEst1rm: number;
}

export interface ExerciseProgression {
  range: { start: string; end: string; days: number };
  exercise: ExerciseSummary;
  points: ExerciseProgressionPoint[];
}

// ─────────────────────────────────────────────────────────────
// Comments
// ─────────────────────────────────────────────────────────────
export interface Comment {
  id: string;
  text: string;
  createdAt: string;
  author: { id: string; name: string | null; role: UserRole };
}

// ─────────────────────────────────────────────────────────────
// Client — Week
// ─────────────────────────────────────────────────────────────
export interface WeekWorkout {
  workoutTemplateId: string;
  title: string;
  description: string | null;
  tags: string[];
  exerciseCount: number;
  session: { id: string; status: SessionStatus; performedAt: string } | null;
}

export interface ClientWeekResponse {
  plan: { id: string; title: string } | null;
  weekNumber: number;
  totalWeeks: number;
  assignmentStatus: AssignmentStatus;
  workouts: WeekWorkout[];
}

// ─────────────────────────────────────────────────────────────
// Coach — Clients
// ─────────────────────────────────────────────────────────────
export interface CoachClientSummary {
  id: string;
  email: string;
  name: string | null;
  relationStatus: string;
  assignment: {
    status: AssignmentStatus;
    plan: { id: string; title: string; weeksCount: number } | null;
  } | null;
  lastSession: { performedAt: string; status: SessionStatus } | null;
}

// ─────────────────────────────────────────────────────────────
// Client — Dashboard (Mi Panel)
// ─────────────────────────────────────────────────────────────
export interface ClientDashboard {
  weekStart: string;
  weekEnd: string;
  weekScore: number;
  weekNumber: number;           // SEM 5
  totalWeeks: number;           // / 8
  previousWeekScore: number | null;  // para trend "+X vs semana anterior"
  workoutsCompleted: number;
  workoutsTarget: number | null;
  // Fuerza / Aeróbico separados
  strengthCompleted: number;
  strengthTarget: number | null;
  cardioCompleted: number;
  cardioTarget: number | null;
  // Promedios
  energyAvg: number | null;
  stepsAvg: number | null;
  sleepMinutesAvg: number | null;
  // Datos diarios para charts (7 días: L, M, M, J, V, S, D)
  dailySteps: (number | null)[];
  dailySleepMinutes: (number | null)[];
  dailyEnergy: (number | null)[];
  dailyWorkouts: number[];
  // Nutrición
  foodGood: number;
  foodRegular: number;
  foodPoor: number;
}

// ─────────────────────────────────────────────────────────────
// Client — Today (Mi Panel: datos del día actual)
// ─────────────────────────────────────────────────────────────
export interface ClientToday {
  date: string;
  steps: number | null;
  sleepMinutes: number | null;
  energyRating: number | null;
  workoutsToday: number;
  healthEntryId: string | null;
  food: Array<{
    id: string;
    loggedAt: string;
    mealType: "breakfast" | "lunch" | "snack" | "dinner" | null;
    quality: "good" | "regular" | "poor" | null;
    text: string | null;
  }>;
}

// ─────────────────────────────────────────────────────────────
// Client — Food Log
// ─────────────────────────────────────────────────────────────
export type MealType = "breakfast" | "lunch" | "snack" | "dinner";
export type FoodQuality = "good" | "regular" | "poor";

export interface FoodLogEntry {
  id: string;
  loggedAt: string;
  mealType: MealType | null;
  quality: FoodQuality | null;
  macroTags: string[];
  text: string | null;
  photoUrl: string | null;
  source?: string;
  coachComments?: Array<{
    id: string;
    text: string;
    createdAt: string;
    coach: { id: string; name: string | null };
  }>;
}

export interface CreateFoodLogRequest {
  mealType: MealType;
  quality: FoodQuality;
  macroTags?: string[];
  text?: string;
}

// ─────────────────────────────────────────────────────────────
// Coach — Plans
// ─────────────────────────────────────────────────────────────
export interface PlanSummary {
  id: string;
  title: string;
  goal: string | null;
  status: PlanStatus;
  weeksCount: number;
  periodDays: number;
  assignedCount: number;
  updatedAt: string;
}

export interface CreatePlanRequest {
  title: string;
  goal?: string;
  notes?: string;
  weeksCount?: number;
  periodDays?: number;
}

// ─────────────────────────────────────────────────────────────
// Client — Goals & Body Metrics
// ─────────────────────────────────────────────────────────────
export interface HealthGoalItem {
  id: string;
  kind: string;
  targetInt: number | null;
  targetNumber: string | null;
  unit: string;
  period: string;
  startDate: string;
  endDate: string | null;
  shareWithCoach: boolean;
  createdAt: string;
}

export interface GoalsResponse {
  goals: HealthGoalItem[];
  hasCoach: boolean;
}

export interface BodyMetricItem {
  id: string;
  measuredAt: string;
  weightKg: string | null;
  waistCm: string | null;
  chestCm: string | null;
  hipsCm: string | null;
  armCm: string | null;
  thighCm: string | null;
  notes: string | null;
  shareWithCoach: boolean;
}

// ─────────────────────────────────────────────────────────────
// Coach — Daily Log & Coach-specific responses
// ─────────────────────────────────────────────────────────────
export interface CoachDailyLogEntry {
  date: string;
  steps: number | null;
  sleepMinutes: number | null;
  workoutsCompleted: number;
  foodCount: number;
  notes: string | null;
  food: Array<{ id: string; mealType: string | null; quality: string | null; text: string | null }>;
}

export interface CoachDailyLogResponse {
  entries: CoachDailyLogEntry[];
  goalsForColoring: {
    stepsTarget: number;
    sleepTargetMinutes: number;
    shared: boolean;
  };
}

export interface CoachGoalsResponse {
  goals: HealthGoalItem[];
  shared: boolean;
}

// ─────────────────────────────────────────────────────────────
// Health Providers & Sync
// ─────────────────────────────────────────────────────────────
export type HealthProviderId = "garmin" | "google_health" | "strava";

export interface HealthProviderConfig {
  id: HealthProviderId;
  name: string;
  description: string;
  color: string;
  icon: string;
  scopes: string[];
  dataTypes: string[];
}

export interface NormalizedDailyMetrics {
  date: string; // ISO date
  steps?: number;
  distanceMeters?: number;
  calories?: number;
  activeMinutes?: number;
  sleepMinutes?: number;
  deepSleepMinutes?: number;
  lightSleepMinutes?: number;
  remSleepMinutes?: number;
  restingHeartRate?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  stress?: number;
  bodyBattery?: number;
  spo2?: number;
  activities?: Array<{
    type: string;
    minutes: number;
    calories?: number;
    distanceMeters?: number;
  }>;
}

export interface ProviderConnectionStatus {
  provider: HealthProviderId;
  isConnected: boolean;
  lastSyncAt: string | null;
  lastSyncStatus: string | null;
  lastError: string | null;
  providerUserId: string | null;
  scope: string[];
}

export interface HealthDashboardData {
  date: string;
  steps: number | null;
  sleepMinutes: number | null;
  activeMinutes: number | null;
  calories: number | null;
  restingHeartRate: number | null;
  stress: number | null;
  source: string | null;
}
