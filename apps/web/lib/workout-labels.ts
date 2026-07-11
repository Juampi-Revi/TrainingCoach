"use client";

import type {
  SessionExercise,
  WorkoutExecutionLabel,
  WorkoutLabelsSummary,
  WorkoutRoleLabel,
  WorkoutEffortLabel,
} from "@regen/types";

export const ROLE_LABEL_OPTIONS: Array<{ value: WorkoutRoleLabel; label: string }> = [
  { value: "primary", label: "Principal" },
  { value: "complementary", label: "Complementario" },
  { value: "recovery", label: "Recuperación" },
];

export const EFFORT_LABEL_OPTIONS: Array<{ value: WorkoutEffortLabel; label: string }> = [
  { value: "heavy", label: "Pesado" },
  { value: "moderate", label: "Moderado" },
  { value: "light", label: "Liviano" },
];

export const EXECUTION_LABEL_OPTIONS: Array<{ value: WorkoutExecutionLabel; label: string }> = [
  { value: "explosive", label: "Explosivo" },
  { value: "controlled", label: "Controlado" },
  { value: "slow", label: "Lento" },
  { value: "technical", label: "Técnico" },
];

const LABEL_TEXT: Record<string, string> = {
  primary: "Principal",
  complementary: "Complementario",
  recovery: "Recuperación",
  heavy: "Pesado",
  moderate: "Moderado",
  light: "Liviano",
  explosive: "Explosivo",
  controlled: "Controlado",
  slow: "Lento",
  technical: "Técnico",
};

const LABEL_TONE: Record<string, { bg: string; border: string; text: string }> = {
  extra: { bg: "rgba(215,255,58,.12)", border: "rgba(215,255,58,.38)", text: "var(--lime)" },
  primary: { bg: "rgba(122,184,255,.12)", border: "rgba(122,184,255,.34)", text: "var(--accent-text)" },
  complementary: { bg: "rgba(255,255,255,.06)", border: "rgba(255,255,255,.12)", text: "var(--text-mute)" },
  recovery: { bg: "rgba(104,241,189,.12)", border: "rgba(104,241,189,.32)", text: "var(--success)" },
  heavy: { bg: "rgba(255,122,122,.12)", border: "rgba(255,122,122,.34)", text: "var(--danger)" },
  moderate: { bg: "rgba(255,184,108,.12)", border: "rgba(255,184,108,.32)", text: "var(--warn)" },
  light: { bg: "rgba(104,241,189,.12)", border: "rgba(104,241,189,.28)", text: "var(--success)" },
  explosive: { bg: "rgba(255,184,108,.12)", border: "rgba(255,184,108,.32)", text: "var(--warn)" },
  controlled: { bg: "rgba(122,184,255,.12)", border: "rgba(122,184,255,.34)", text: "var(--accent-text)" },
  slow: { bg: "rgba(255,255,255,.06)", border: "rgba(255,255,255,.12)", text: "var(--text-mute)" },
  technical: { bg: "rgba(186,146,255,.12)", border: "rgba(186,146,255,.34)", text: "#c7a6ff" },
};

export function labelText(value: string | null | undefined): string | null {
  if (!value) return null;
  return LABEL_TEXT[value] ?? value;
}

export function labelTone(value: string) {
  return LABEL_TONE[value] ?? LABEL_TONE.complementary;
}

export function buildLabelValues(labels: WorkoutLabelsSummary, isExtra = false): string[] {
  return [
    ...(isExtra ? ["extra"] : []),
    ...(labels.role ? [labels.role] : []),
    ...(labels.effort ? [labels.effort] : []),
    ...(labels.execution ? [labels.execution] : []),
  ];
}

export function isSessionExerciseExtra(ex: SessionExercise): boolean {
  return !!(ex.block?.isExtra || (ex.supersetGroup && ex.target?.groupIsExtra));
}
