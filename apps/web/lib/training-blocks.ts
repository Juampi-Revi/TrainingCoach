import type { WorkoutBlockSummary } from "@regen/types";

export type BlockExecutionPattern =
  | "exercise_list"
  | "guided_intervals"
  | "emom"
  | "amrap"
  | "endurance_steps"
  | "steady_state"
  | "recovery";

function blockSteps(block: Pick<WorkoutBlockSummary, "steps"> | { steps?: WorkoutBlockSummary["steps"] | null }) {
  return block.steps ?? [];
}

export function getBlockExecutionPattern(block: Pick<WorkoutBlockSummary, "type" | "intervalType" | "steps">): BlockExecutionPattern {
  if (block.type === "intervals") {
    if (block.intervalType === "emom") return "emom";
    if (block.intervalType === "amrap") return "amrap";
    return "guided_intervals";
  }
  if (block.type === "cardio" && blockSteps(block).length > 0) return "endurance_steps";
  if (block.type === "cardio") return "steady_state";
  if (block.type === "cooldown") return "recovery";
  return "exercise_list";
}

export function estimateBlockDurationSeconds(block: Pick<
  WorkoutBlockSummary,
  "type" | "intervalType" | "prepareSeconds" | "workSeconds" | "restSeconds" | "rounds" | "setCount" | "restBetweenSetsSeconds" | "totalDurationSeconds" | "targetMinutes" | "steps"
>) {
  const steps = blockSteps(block);
  if (steps.length > 0) {
    const stepSeconds = steps.reduce((total, step) => total + (step.durationSeconds ?? 0), 0);
    if (stepSeconds > 0) return stepSeconds;
  }

  if (block.type === "intervals" && block.intervalType) {
    const prepare = block.prepareSeconds ?? 0;
    if (block.intervalType === "emom") {
      const minutes = block.rounds ?? 0;
      return minutes > 0 ? prepare + minutes * 60 : null;
    }
    if (block.intervalType === "amrap") {
      return block.totalDurationSeconds ? prepare + block.totalDurationSeconds : null;
    }
    const work = block.workSeconds ?? 0;
    const rest = block.restSeconds ?? 0;
    const rounds = block.rounds ?? 0;
    const sets = block.setCount ?? 1;
    const betweenSets = block.restBetweenSetsSeconds ?? 0;
    if (work <= 0 || rounds <= 0) return null;
    const singleSet = (work + Math.max(rest, 0)) * rounds;
    const setsRest = sets > 1 ? betweenSets * (sets - 1) : 0;
    return prepare + singleSet * Math.max(sets, 1) + setsRest;
  }

  if (block.targetMinutes) return block.targetMinutes * 60;
  return null;
}

export function formatBlockDurationShort(seconds: number | null) {
  if (!seconds || seconds <= 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.round(seconds / 60);
  return `${mins} min`;
}

export function blockPatternLabel(block: Pick<WorkoutBlockSummary, "type" | "intervalType" | "steps">) {
  const pattern = getBlockExecutionPattern(block);
  switch (pattern) {
    case "guided_intervals":
      return "Timer guiado";
    case "emom":
      return "EMOM";
    case "amrap":
      return "AMRAP";
    case "endurance_steps":
      return "Pasadas";
    case "steady_state":
      return "Cardio continuo";
    case "recovery":
      return "Recuperación";
    default:
      return "Lista de ejercicios";
  }
}

export function blockCoachSummary(block: WorkoutBlockSummary) {
  const pattern = getBlockExecutionPattern(block);
  const duration = formatBlockDurationShort(estimateBlockDurationSeconds(block));

  if (pattern === "guided_intervals") {
    const sets = block.setCount ?? 1;
    return `${duration} · ${block.rounds ?? 0} rondas · ${sets} serie${sets === 1 ? "" : "s"}`;
  }
  if (pattern === "emom") {
    return `${duration} · ${block.rounds ?? 0} min EMOM`;
  }
  if (pattern === "amrap") {
    return `${duration} · tantas rondas como puedas`;
  }
  if (pattern === "endurance_steps") {
    const steps = blockSteps(block);
    return `${duration} · ${steps.length} paso${steps.length === 1 ? "" : "s"}`;
  }
  if (pattern === "steady_state") {
    return `${duration}${block.targetZone ? ` · ${block.targetZone}` : ""}`;
  }
  return duration;
}

export function estimateWorkoutDurationSeconds(blocks: WorkoutBlockSummary[] | null | undefined) {
  const list = blocks ?? [];
  const total = list.reduce((acc, block) => {
    const blockDuration = estimateBlockDurationSeconds(block) ?? 0;
    return acc + blockDuration + (block.restAfterSeconds ?? 0);
  }, 0);
  return total > 0 ? total : null;
}
