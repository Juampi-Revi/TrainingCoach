const STEP_KINDS = ["warmup", "work", "recover", "cooldown"] as const;
const TARGET_TYPES = ["hr_zone", "hr_bpm", "pace", "speed", "rpe", "free"] as const;

type StepKind = (typeof STEP_KINDS)[number];
type TargetType = (typeof TARGET_TYPES)[number];

function asNullableString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNullableInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  const normalized = Math.round(parsed);
  return normalized > 0 ? normalized : null;
}

function asNullableFloat(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeWorkoutSport(input: unknown): "run" | "ride" | "generic" | null {
  if (input === "run" || input === "ride" || input === "generic") return input;
  return null;
}

export function normalizeBlockSteps(input: unknown): {
  steps: Array<{
    sortOrder: number;
    kind: StepKind;
    label: string | null;
    instruction: string | null;
    durationSeconds: number | null;
    distanceMeters: number | null;
    targetType: TargetType | null;
    targetLabel: string | null;
    targetValueLow: number | null;
    targetValueHigh: number | null;
    targetUnit: string | null;
  }>;
  error?: string;
} {
  if (input === undefined) return { steps: [] };
  if (!Array.isArray(input)) return { steps: [], error: "steps debe ser un array" };

  const steps = input.map((raw, index) => {
    const item = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    const kind = STEP_KINDS.includes(String(item.kind) as StepKind)
      ? (String(item.kind) as StepKind)
      : "work";
    const targetType = TARGET_TYPES.includes(String(item.targetType) as TargetType)
      ? (String(item.targetType) as TargetType)
      : null;

    return {
      sortOrder: index,
      kind,
      label: asNullableString(item.label),
      instruction: asNullableString(item.instruction),
      durationSeconds: asNullableInt(item.durationSeconds),
      distanceMeters: asNullableInt(item.distanceMeters),
      targetType,
      targetLabel: asNullableString(item.targetLabel),
      targetValueLow: asNullableFloat(item.targetValueLow),
      targetValueHigh: asNullableFloat(item.targetValueHigh),
      targetUnit: asNullableString(item.targetUnit),
    };
  });

  const invalid = steps.find((step) => step.durationSeconds == null && step.distanceMeters == null);
  if (invalid) {
    return { steps: [], error: "Cada paso debe tener duración o distancia" };
  }

  return { steps };
}

export function mapWorkoutBlockStep(step: {
  id: string;
  sortOrder: number;
  kind: string;
  label: string | null;
  instruction: string | null;
  durationSeconds: number | null;
  distanceMeters: number | null;
  targetType: string | null;
  targetLabel: string | null;
  targetValueLow: { toString(): string } | number | null;
  targetValueHigh: { toString(): string } | number | null;
  targetUnit: string | null;
}) {
  return {
    id: step.id,
    sortOrder: step.sortOrder,
    kind: step.kind,
    label: step.label,
    instruction: step.instruction,
    durationSeconds: step.durationSeconds,
    distanceMeters: step.distanceMeters,
    targetType: step.targetType,
    targetLabel: step.targetLabel,
    targetValueLow: step.targetValueLow != null ? String(step.targetValueLow) : null,
    targetValueHigh: step.targetValueHigh != null ? String(step.targetValueHigh) : null,
    targetUnit: step.targetUnit,
  };
}
