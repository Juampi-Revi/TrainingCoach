import type { BlockType, SessionDetail, SessionExercise, WorkoutBlockSummary } from "@regen/types";
import { BLOCK_TYPE_LABELS, blockTypeLabel, MUSCLE_LABEL } from "@/lib/constants";

export interface BriefingTimelineItem {
  key: string;
  type: BlockType;
  label: string;
  minutes: number;
  exerciseCount: number;
}

export interface SessionBriefingModel {
  title: string;
  tags: string[];
  estimatedMinutes: number;
  coachNote: string | null;
  timeline: BriefingTimelineItem[];
  muscles: string[];
  workExerciseCount: number;
}

export function buildSessionBriefing(session: SessionDetail): SessionBriefingModel {
  const title = session.workoutTemplate?.title ?? "Sesión";
  const tags = session.workoutTemplate?.tags ?? [];
  const coachNote = session.progressionNote?.trim() || session.workoutTemplate?.description?.trim() || null;
  const exercises = session.exercises ?? [];
  const sessionBlocks = session.blocks ?? [];

  const blocks = sessionBlocks.length > 0
    ? [...sessionBlocks].sort((a, b) => a.sortOrder - b.sortOrder)
    : deriveBlocksFromExercises(exercises);

  const timeline = blocks.map((block) => {
    const exs = exercises.filter((e) => e.block?.id === block.id);
    const minutes = estimateBlockMinutes(block, exs);
    return {
      key: block.id,
      type: block.type,
      label: block.label?.trim() || blockTypeLabel(block.type, block.intervalType),
      minutes,
      exerciseCount: exs.length,
    };
  }).filter((item) => item.exerciseCount > 0 || item.type === "cardio" || item.minutes > 0);

  const estimatedMinutes = Math.max(
    1,
    timeline.reduce((acc, item) => acc + item.minutes, 0) || estimateFromExercises(exercises),
  );

  const workExercises = exercises.filter((e) => e.block?.type !== "warmup");
  const muscleSet = new Set<string>();
  for (const ex of workExercises) {
    const m = ex.exercise.primaryMuscle;
    if (m) muscleSet.add(MUSCLE_LABEL[m] ?? m);
  }

  return {
    title,
    tags,
    estimatedMinutes,
    coachNote,
    timeline: timeline.length > 0 ? timeline : [{
      key: "work",
      type: "strength",
      label: BLOCK_TYPE_LABELS.strength,
      minutes: estimatedMinutes,
      exerciseCount: workExercises.length,
    }],
    muscles: Array.from(muscleSet).slice(0, 6),
    workExerciseCount: workExercises.length,
  };
}

function deriveBlocksFromExercises(exercises: SessionExercise[]): WorkoutBlockSummary[] {
  const seen = new Map<string, WorkoutBlockSummary>();
  for (const ex of exercises) {
    if (ex.block && !seen.has(ex.block.id)) seen.set(ex.block.id, ex.block);
  }
  return Array.from(seen.values()).sort((a, b) => a.sortOrder - b.sortOrder);
}

function estimateBlockMinutes(block: WorkoutBlockSummary, exs: SessionExercise[]): number {
  if (block.type === "cardio" && block.targetMinutes) return block.targetMinutes;
  if (block.totalDurationSeconds) return Math.max(1, Math.round(block.totalDurationSeconds / 60));

  if (block.type === "intervals") {
    const rounds = block.rounds ?? 8;
    const sets = block.setCount ?? 1;
    const prep = block.prepareSeconds ?? 0;
    const work = block.workSeconds ?? 20;
    const rest = block.restSeconds ?? 10;
    const setRest = block.restBetweenSetsSeconds ?? 0;
    const total = prep + sets * (rounds * (work + rest) + setRest);
    return Math.max(1, Math.round(total / 60));
  }

  if (exs.length === 0) return block.type === "warmup" || block.type === "cooldown" ? 5 : 0;

  let seconds = 0;
  for (const ex of exs) {
    const sets = ex.target?.sets ?? 3;
    const rest = ex.target?.restSeconds ?? 90;
    const work = ex.target?.durationSeconds ?? 45;
    seconds += sets * (work + rest);
  }
  return Math.max(1, Math.round(seconds / 60));
}

function estimateFromExercises(exercises: SessionExercise[]): number {
  const work = exercises.filter((e) => e.block?.type !== "warmup");
  if (work.length === 0) return 30;
  return Math.max(15, work.length * 4);
}
