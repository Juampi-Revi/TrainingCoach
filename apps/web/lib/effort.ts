export type SetEffortKind = "warmup" | "filler" | "stimulating" | "failure" | "unknown";

export interface EffortSetInput {
  reps: number | null;
  weight: number | null;
  rpe: number | null;
  rir: number | null;
  blockType?: string | null;
}

export interface SetEffort {
  kind: SetEffortKind;
  rpe: number | null;
  rir: number | null;
  effectiveReps: number;
  e1rm: number | null;
}

export interface SessionEffortSummary {
  workSets: number;
  classifiedSets: number;
  stimulatingSets: number;
  fillerSets: number;
  failureSets: number;
  warmupSets: number;
  unknownSets: number;
  effectiveReps: number;
  byMuscle: Array<{ muscle: string; stimulatingSets: number; effectiveReps: number }>;
}

export function rpeToRir(rpe: number): number {
  return Math.max(0, 10 - rpe);
}

export function rirToRpe(rir: number): number {
  return Math.max(0, Math.min(10, 10 - rir));
}

export function resolveEffort(rpe: number | null, rir: number | null): { rpe: number | null; rir: number | null } {
  if (rpe != null && Number.isFinite(rpe)) {
    return { rpe, rir: rir != null && Number.isFinite(rir) ? rir : rpeToRir(rpe) };
  }
  if (rir != null && Number.isFinite(rir)) {
    return { rpe: rirToRpe(rir), rir };
  }
  return { rpe: null, rir: null };
}

export function classifySet(input: EffortSetInput): SetEffortKind {
  if (input.blockType === "warmup") return "warmup";
  const { rpe, rir } = resolveEffort(input.rpe, input.rir);
  if (rpe == null || rir == null) return "unknown";
  if (rpe <= 5) return "warmup";
  if (rir >= 4 || rpe < 7) return "filler";
  if (rir <= 0 || rpe >= 10) return "failure";
  return "stimulating";
}

/** Last ~5 reps near failure. Heuristic, not lab physiology. */
export function effectiveReps(reps: number | null, rir: number | null): number {
  if (reps == null || rir == null || reps <= 0) return 0;
  return Math.max(0, Math.min(reps, 5 - rir));
}

/** Epley to failure: reps + RIR ≈ reps to failure. */
export function estimate1rm(weight: number | null, reps: number | null, rir: number | null): number | null {
  if (weight == null || weight <= 0 || reps == null || reps <= 0) return null;
  const toFailure = reps + Math.max(0, rir ?? 0);
  const e1rm = weight * (1 + toFailure / 30);
  return Math.round(e1rm * 10) / 10;
}

export function describeSetEffort(kind: SetEffortKind, targetRpe: number | null): { title: string; body: string; tone: "good" | "warn" | "mute" } {
  if (kind === "stimulating") {
    return {
      title: "Serie estimulante",
      body: targetRpe != null
        ? `Cerca del fallo (objetivo ~RPE ${targetRpe}). Esta es la que hace crecer.`
        : "Cerca del fallo. Esta es la que hace crecer.",
      tone: "good",
    };
  }
  if (kind === "failure") {
    return {
      title: "Al fallo",
      body: "Máximo estímulo, más fatiga. Mejor en aislamientos o en la última serie.",
      tone: "warn",
    };
  }
  if (kind === "filler") {
    return {
      title: "Lejos del fallo",
      body: "Quedaron 4+ reps. Suma poco para hipertrofia: subí peso o acercate a RPE 7–9.",
      tone: "warn",
    };
  }
  if (kind === "warmup") {
    return {
      title: "Calentamiento",
      body: "No cuenta como serie de trabajo. Está bien para preparar el movimiento.",
      tone: "mute",
    };
  }
  return {
    title: "Sin RPE/RIR",
    body: "Anotá el esfuerzo para saber si la serie fue efectiva.",
    tone: "mute",
  };
}

export function emptySessionEffort(): SessionEffortSummary {
  return {
    workSets: 0,
    classifiedSets: 0,
    stimulatingSets: 0,
    fillerSets: 0,
    failureSets: 0,
    warmupSets: 0,
    unknownSets: 0,
    effectiveReps: 0,
    byMuscle: [],
  };
}

export function summarizeSets(
  sets: Array<EffortSetInput & { muscle?: string | null }>,
): SessionEffortSummary {
  const summary = emptySessionEffort();
  const muscleMap = new Map<string, { stimulatingSets: number; effectiveReps: number }>();

  for (const set of sets) {
    const kind = classifySet(set);
    const { rir } = resolveEffort(set.rpe, set.rir);
    const eff = kind === "warmup" ? 0 : effectiveReps(set.reps, rir);
    summary.workSets += kind === "warmup" ? 0 : 1;
    if (kind !== "unknown") summary.classifiedSets += 1;
    if (kind === "stimulating") summary.stimulatingSets += 1;
    if (kind === "filler") summary.fillerSets += 1;
    if (kind === "failure") summary.failureSets += 1;
    if (kind === "warmup") summary.warmupSets += 1;
    if (kind === "unknown") summary.unknownSets += 1;
    summary.effectiveReps += eff;

    const muscle = (set.muscle ?? "").trim() || "otros";
    if (kind !== "warmup") {
      const row = muscleMap.get(muscle) ?? { stimulatingSets: 0, effectiveReps: 0 };
      if (kind === "stimulating" || kind === "failure") row.stimulatingSets += 1;
      row.effectiveReps += eff;
      muscleMap.set(muscle, row);
    }
  }

  summary.byMuscle = [...muscleMap.entries()]
    .map(([muscle, row]) => ({ muscle, ...row }))
    .sort((a, b) => b.stimulatingSets - a.stimulatingSets || b.effectiveReps - a.effectiveReps);

  return summary;
}

export function analyzeSet(input: EffortSetInput): SetEffort {
  const kind = classifySet(input);
  const { rpe, rir } = resolveEffort(input.rpe, input.rir);
  return {
    kind,
    rpe,
    rir,
    effectiveReps: kind === "warmup" ? 0 : effectiveReps(input.reps, rir),
    e1rm: estimate1rm(input.weight, input.reps, rir),
  };
}
