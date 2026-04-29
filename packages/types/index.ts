// ─────────────────────────────────────────────────────────────
// Primitives
// ─────────────────────────────────────────────────────────────
export type UserRole = "coach" | "client";
export type BillingStatus = "good" | "due";
export type SessionStatus = "in_progress" | "completed" | "discarded";
export type PlanStatus = "draft" | "published" | "archived";
export type AssignmentStatus = "active" | "paused" | "finished";

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
  warmupNotes: string | null;
  warmupMinutes: number | null;
  tags: string[];
  type: string;
  exercises: Array<{
    id: string;
    sortOrder: number;
    supersetGroup: string | null;
    isWarmup: boolean;
    exercise: { id: string; name: string; primaryMuscle: string | null; equipment: string | null; thumbnailUrl: string | null; youtubeUrl?: string | null; isSystem?: boolean };
    targetSets: number | null;
    targetReps: string | null;
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
  isWarmup: boolean;
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
  workoutTemplate: { id: string; title: string; description: string | null; warmupNotes: string | null; warmupMinutes: number | null; tags: string[] } | null;
  exercises: SessionExercise[];
}

export interface SessionSummary {
  id: string;
  status: SessionStatus;
  performedAt: string;
  energyRating: number | null;
  sessionNotes: string | null;
  workoutTemplate: { id: string; title: string; tags: string[] } | null;
  totalVolumeKg: number;
  setsCount: number;
}

export interface PatchSessionRequest {
  status?: SessionStatus;
  energyRating?: number | null;
  sessionNotes?: string | null;
  performedAt?: string;
  completedAt?: string | null;
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
