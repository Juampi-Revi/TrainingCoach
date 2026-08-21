import { z } from "zod";

// ═════════════════════════════════════════════════════════════
// Common Schemas
// ═════════════════════════════════════════════════════════════

export const uuidSchema = z.string().uuid();

export const dateStringSchema = z.string().datetime({ offset: true });

export const dateSchema = z.union([
  z.coerce.date(),
  z.string().datetime({ offset: true }),
]);

export const decimalStringSchema = z.union([
  z.number(),
  z.string().transform((val) => {
    const parsed = parseFloat(val);
    if (isNaN(parsed)) throw new Error("Invalid decimal");
    return parsed;
  }),
]);

export const optionalDecimalSchema = z.union([
  z.number().nullable(),
  z.string().nullable().transform((val) => {
    if (val === null || val === undefined) return null;
    const parsed = parseFloat(val);
    if (isNaN(parsed)) return null;
    return parsed;
  }),
]).nullable();

// ═════════════════════════════════════════════════════════════
// Auth Schemas
// ═════════════════════════════════════════════════════════════

export const loginRequestSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const registerRequestSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").optional(),
  role: z.enum(["coach", "client", "gym"]).optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token requerido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Contraseña actual requerida"),
  newPassword: z.string().min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
});

export const twoFactorVerifySchema = z.object({
  code: z.string().length(6, "El código debe tener 6 dígitos"),
});

// ═════════════════════════════════════════════════════════════
// Session Schemas
// ═════════════════════════════════════════════════════════════

export const sessionStatusSchema = z.enum(["in_progress", "partial", "completed", "discarded", "pending"]);

export const sessionPatchSchema = z.object({
  status: sessionStatusSchema.optional(),
  energyRating: z.union([z.number().int().min(1).max(5), z.null()]).optional(),
  sessionNotes: z.union([z.string().max(2000, "Máximo 2000 caracteres"), z.null()]).optional(),
  performedAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().nullable().optional(),
}).refine(
  (data) => {
    if (data.performedAt && data.completedAt) {
      return data.completedAt.getTime() >= data.performedAt.getTime();
    }
    return true;
  },
  { message: "completedAt debe ser después de performedAt", path: ["completedAt"] },
);

export const createSetSchema = z.object({
  setNumber: z.number().int().positive("El número de set debe ser positivo"),
  reps: z.union([z.number().int().positive(), z.null()]).optional(),
  durationSeconds: z.union([z.number().int().positive(), z.null()]).optional(),
  weight: optionalDecimalSchema,
  rpe: optionalDecimalSchema,
  rir: optionalDecimalSchema,
  notes: z.union([z.string().max(500), z.null()]).optional(),
});

export const upsertSetSchema = z.object({
  reps: z.union([z.string(), z.number()]).nullable().optional(),
  weight: z.union([z.string(), z.number()]).nullable().optional(),
  rpe: z.union([z.string(), z.number()]).nullable().optional(),
  rir: z.union([z.string(), z.number()]).nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const swapExerciseSchema = z.object({
  performedExerciseId: z.string().uuid("ID de ejercicio inválido"),
  swapReason: z.string().max(500, "Máximo 500 caracteres").optional(),
});

export const addFreeExerciseSchema = z.object({
  exerciseId: z.string().uuid("ID de ejercicio inválido"),
  workoutExerciseId: z.string().uuid().optional(),
  sortOrder: z.number().int().optional(),
});

export const sessionCommentSchema = z.object({
  text: z.string().min(1, "El comentario no puede estar vacío").max(2000, "Máximo 2000 caracteres"),
});

// ═════════════════════════════════════════════════════════════
// Workout & Plan Schemas
// ═════════════════════════════════════════════════════════════

export const blockTypeSchema = z.enum(["warmup", "strength", "intervals", "cardio", "cooldown"]);

export const intervalTypeSchema = z.enum(["tabata", "hiit", "emom", "amrap"]);
export const workoutRoleLabelSchema = z.enum(["primary", "complementary", "recovery"]);
export const workoutEffortLabelSchema = z.enum(["heavy", "moderate", "light"]);
export const workoutExecutionLabelSchema = z.enum(["explosive", "controlled", "slow", "technical"]);

export const createPlanSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(100, "Máximo 100 caracteres"),
  goal: z.string().max(200, "Máximo 200 caracteres").optional(),
  notes: z.string().max(2000, "Máximo 2000 caracteres").optional(),
  weeksCount: z.number().int().min(1).max(52, "Máximo 52 semanas").optional(),
  periodDays: z.number().int().min(1).max(365, "Máximo 365 días").optional(),
});

export const updatePlanSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  goal: z.string().max(200).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  weeksCount: z.number().int().min(1).max(52).optional(),
  periodDays: z.number().int().min(1).max(365).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
});

export const createWorkoutTemplateSchema = z.object({
  title: z.string().min(1, "El título es requerido").max(100, "Máximo 100 caracteres"),
  description: z.string().max(1000, "Máximo 1000 caracteres").optional(),
  tags: z.array(z.string().max(50)).max(10, "Máximo 10 tags").optional(),
  type: z.string().max(50).optional(),
});

export const updateWorkoutTemplateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(1000).nullable().optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  type: z.string().max(50).optional(),
});

export const createBlockSchema = z.object({
  type: blockTypeSchema,
  label: z.string().max(100).optional(),
  isExtra: z.boolean().optional(),
  roleLabel: workoutRoleLabelSchema.nullable().optional(),
  effortLabel: workoutEffortLabelSchema.nullable().optional(),
  executionLabel: workoutExecutionLabelSchema.nullable().optional(),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().optional(),
  restAfterSeconds: z.number().int().min(0).optional(),
  // Interval-specific
  intervalType: intervalTypeSchema.optional(),
  workSeconds: z.number().int().min(0).optional(),
  restSeconds: z.number().int().min(0).optional(),
  rounds: z.number().int().min(0).optional(),
  totalDurationSeconds: z.number().int().min(0).optional(),
  restBetweenExercisesSeconds: z.number().int().min(0).optional(),
  // Cardio-specific
  targetMinutes: z.number().int().min(0).optional(),
  targetZone: z.string().max(50).optional(),
});

export const updateBlockSchema = createBlockSchema.partial();

export const createWorkoutExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  workoutBlockId: z.string().uuid(),
  sortOrder: z.number().int().optional(),
  supersetGroup: z.string().max(50).nullable().optional(),
  roleLabel: workoutRoleLabelSchema.nullable().optional(),
  effortLabel: workoutEffortLabelSchema.nullable().optional(),
  executionLabel: workoutExecutionLabelSchema.nullable().optional(),
  targetSets: z.number().int().min(0).nullable().optional(),
  targetReps: z.string().max(50).nullable().optional(),
  durationSeconds: z.number().int().min(0).nullable().optional(),
  intensityType: z.enum(["rpe", "rir", "none"]).nullable().optional(),
  intensityTarget: decimalStringSchema.nullable().optional(),
  restSeconds: z.number().int().min(0).nullable().optional(),
  tempo: z.string().max(20).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  groupNote: z.string().max(1000).nullable().optional(),
  groupIsExtra: z.boolean().optional(),
  groupRoleLabel: workoutRoleLabelSchema.nullable().optional(),
  groupEffortLabel: workoutEffortLabelSchema.nullable().optional(),
  groupExecutionLabel: workoutExecutionLabelSchema.nullable().optional(),
});

export const workoutExercisePatchSchema = z.object({
  workoutBlockId: z.string().uuid().optional(),
  roleLabel: workoutRoleLabelSchema.nullable().optional(),
  effortLabel: workoutEffortLabelSchema.nullable().optional(),
  executionLabel: workoutExecutionLabelSchema.nullable().optional(),
  targetSets: z.union([z.number().int().positive(), z.null()]).optional(),
  targetReps: z.union([z.string().max(50), z.null()]).optional(),
  durationSeconds: z.union([z.number().int().positive(), z.null()]).optional(),
  intensityType: z.union([z.string().max(50), z.null()]).optional(),
  intensityTarget: z.union([z.number().positive(), z.null()]).optional(),
  restSeconds: z.union([z.number().int().min(0), z.null()]).optional(),
  notes: z.union([z.string().max(2000), z.null()]).optional(),
  sortOrder: z.number().int().optional(),
  supersetGroup: z.union([z.string().max(50), z.null()]).optional(),
  groupNote: z.union([z.string().max(2000), z.null()]).optional(),
  groupIsExtra: z.boolean().optional(),
  groupRoleLabel: workoutRoleLabelSchema.nullable().optional(),
  groupEffortLabel: workoutEffortLabelSchema.nullable().optional(),
  groupExecutionLabel: workoutExecutionLabelSchema.nullable().optional(),
});

export const addAlternativeSchema = z.object({
  alternativeExerciseId: z.string().uuid(),
  priority: z.number().int().min(0).optional(),
  note: z.string().max(200).optional(),
});

export const assignWorkoutToCellSchema = z.object({
  weekNumber: z.number().int().min(1),
  workoutTemplateId: z.string().uuid(),
  sortOrder: z.number().int().optional(),
  progressionNote: z.string().max(500).optional(),
});

export const updatePlanWeekSchema = z.object({
  title: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

// ═════════════════════════════════════════════════════════════
// Exercise Schemas
// ═════════════════════════════════════════════════════════════

export const createExerciseSchema = z.object({
  name: z.string().min(1, "El nombre es requerido").max(100, "Máximo 100 caracteres"),
  primaryMuscle: z.string().max(50).optional(),
  equipment: z.string().max(50).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  objective: z.enum(["strength", "hypertrophy", "conditioning", "mobility", "skill"]).optional(),
  youtubeUrl: z.string().url("URL de YouTube inválida").max(500).optional().or(z.literal("")),
});

export const updateExerciseSchema = createExerciseSchema.partial();

export const exerciseMediaSchema = z.object({
  url: z.string().url("URL inválida").max(500),
  mediaType: z.enum(["image", "video"]),
  isPrimary: z.boolean().optional(),
  displayOrder: z.number().int().min(0).optional(),
});

// ═════════════════════════════════════════════════════════════
// Food Log Schemas
// ═════════════════════════════════════════════════════════════

export const mealTypeSchema = z.enum(["breakfast", "lunch", "snack", "dinner"]);

export const foodQualitySchema = z.enum(["good", "regular", "poor"]);

export const createFoodLogSchema = z.object({
  mealType: mealTypeSchema,
  quality: foodQualitySchema,
  macroTags: z.array(z.string().max(50)).max(10).optional(),
  text: z.string().max(1000, "Máximo 1000 caracteres").optional(),
  loggedAt: dateSchema.optional(),
});

export const updateFoodLogSchema = z.object({
  mealType: mealTypeSchema.optional(),
  quality: foodQualitySchema.optional(),
  macroTags: z.array(z.string().max(50)).max(10).optional(),
  text: z.string().max(1000).optional(),
});

export const foodCoachCommentSchema = z.object({
  text: z.string().min(1).max(1000, "Máximo 1000 caracteres"),
});

// ═════════════════════════════════════════════════════════════
// Health & Goals Schemas
// ═════════════════════════════════════════════════════════════

export const createHealthGoalSchema = z.object({
  kind: z.string().min(1).max(50),
  targetNumber: decimalStringSchema.optional(),
  targetInt: z.number().int().min(0).optional(),
  unit: z.string().max(20),
  period: z.enum(["day", "week", "month"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha debe ser YYYY-MM-DD"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  shareWithCoach: z.boolean().optional(),
});

export const updateHealthGoalSchema = createHealthGoalSchema.partial();

export const createBodyMetricSchema = z.object({
  measuredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha debe ser YYYY-MM-DD"),
  weightKg: decimalStringSchema.nullable().optional(),
  waistCm: decimalStringSchema.nullable().optional(),
  chestCm: decimalStringSchema.nullable().optional(),
  hipsCm: decimalStringSchema.nullable().optional(),
  armCm: decimalStringSchema.nullable().optional(),
  thighCm: decimalStringSchema.nullable().optional(),
  notes: z.string().max(500).optional(),
  shareWithCoach: z.boolean().optional(),
});

export const healthEntrySchema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  steps: z.number().int().min(0).nullable().optional(),
  sleepMinutes: z.number().int().min(0).nullable().optional(),
  sportType: z.string().max(50).nullable().optional(),
  sportMinutes: z.number().int().min(0).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

// ═════════════════════════════════════════════════════════════
// Coach & Client Management Schemas
// ═════════════════════════════════════════════════════════════

export const createCoachInviteSchema = z.object({
  email: z.string().email("Email inválido"),
});

export const createCoachGroupSchema = z.object({
  name: z.string().min(1).max(100),
  level: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export const updateCoachGroupSchema = createCoachGroupSchema.partial();

export const addGroupMemberSchema = z.object({
  clientUserId: z.string().uuid(),
});

// ═════════════════════════════════════════════════════════════
// Notification Settings Schemas
// ═════════════════════════════════════════════════════════════

export const notificationSettingsSchema = z.object({
  workoutReminder: z.boolean().optional(),
  reminderTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato HH:MM").optional(),
  reminderDays: z.array(z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"])).optional(),
  inactivityAlert: z.boolean().optional(),
  inactivityDays: z.number().int().min(1).max(30).optional(),
  weeklySummary: z.boolean().optional(),
  weeklySummaryDay: z.enum(["mon", "tue", "wed", "thu", "fri", "sat", "sun"]).optional(),
  emailNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
});

// ═════════════════════════════════════════════════════════════
// Chat & Messaging Schemas
// ═════════════════════════════════════════════════════════════

export const sendMessageSchema = z.object({
  text: z.string().min(1).max(3000, "Máximo 3000 caracteres"),
  refKind: z.enum(["session", "workout"]).optional(),
  refId: z.string().uuid().optional(),
  refLabel: z.string().max(100).optional(),
});

// ═════════════════════════════════════════════════════════════
// Gym Class Schemas
// ═════════════════════════════════════════════════════════════

export const createGymClassSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  workoutTemplateId: z.string().uuid(),
  groupId: z.string().uuid().optional(),
  scheduledAt: dateSchema,
  durationMinutes: z.number().int().min(5).max(300).default(60),
});

export const updateGymClassSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  scheduledAt: dateSchema.optional(),
  durationMinutes: z.number().int().min(5).max(300).optional(),
  status: z.enum(["scheduled", "in_progress", "completed", "cancelled"]).optional(),
});

// ═════════════════════════════════════════════════════════════
// Badge Schemas
// ═════════════════════════════════════════════════════════════

export const markBadgeViewedSchema = z.object({
  viewed: z.boolean(),
});

// ═════════════════════════════════════════════════════════════
// Query Parameter Schemas
// ═════════════════════════════════════════════════════════════

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const dateRangeSchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// Type inference helpers
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type RegisterRequest = z.infer<typeof registerRequestSchema>;
export type SessionPatch = z.infer<typeof sessionPatchSchema>;
export type CreateSet = z.infer<typeof createSetSchema>;
export type UpsertSet = z.infer<typeof upsertSetSchema>;
export type CreatePlan = z.infer<typeof createPlanSchema>;
export type UpdatePlan = z.infer<typeof updatePlanSchema>;
export type CreateFoodLog = z.infer<typeof createFoodLogSchema>;
export type CreateHealthGoal = z.infer<typeof createHealthGoalSchema>;
export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>;
