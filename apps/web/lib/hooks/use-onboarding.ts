import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";

export type OnboardingGoal = "lose_weight" | "build_muscle" | "maintain" | "improve_endurance" | "general_fitness";
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
export type Equipment = "gym" | "dumbbells" | "home" | "bodyweight";
export type FocusArea = "upper" | "lower" | "core" | "cardio" | "full_body";

interface OnboardingData {
  goal: OnboardingGoal | null;
  experience: ExperienceLevel | null;
  daysPerWeek: number;
  sessionDuration: 30 | 45 | 60 | 90;
  equipment: Equipment[];
  focusAreas: FocusArea[];
}

interface UseOnboardingReturn {
  step: number;
  data: OnboardingData;
  isSubmitting: boolean;
  error: string | null;
  setGoal: (goal: OnboardingGoal) => void;
  setExperience: (exp: ExperienceLevel) => void;
  setDaysPerWeek: (days: number) => void;
  setSessionDuration: (duration: 30 | 45 | 60 | 90) => void;
  toggleEquipment: (eq: Equipment) => void;
  toggleFocusArea: (area: FocusArea) => void;
  nextStep: () => void;
  prevStep: () => void;
  submit: () => Promise<void>;
}

const TOTAL_STEPS = 6;

export function useOnboarding(): UseOnboardingReturn {
  const { api } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({
    goal: null,
    experience: null,
    daysPerWeek: 3,
    sessionDuration: 45,
    equipment: [],
    focusAreas: [],
  });

  const setGoal = useCallback((goal: OnboardingGoal) => {
    setData((prev) => ({ ...prev, goal }));
  }, []);

  const setExperience = useCallback((experience: ExperienceLevel) => {
    setData((prev) => ({ ...prev, experience }));
  }, []);

  const setDaysPerWeek = useCallback((daysPerWeek: number) => {
    setData((prev) => ({ ...prev, daysPerWeek }));
  }, []);

  const setSessionDuration = useCallback((sessionDuration: 30 | 45 | 60 | 90) => {
    setData((prev) => ({ ...prev, sessionDuration }));
  }, []);

  const toggleEquipment = useCallback((eq: Equipment) => {
    setData((prev) => ({
      ...prev,
      equipment: prev.equipment.includes(eq)
        ? prev.equipment.filter((e) => e !== eq)
        : [...prev.equipment, eq],
    }));
  }, []);

  const toggleFocusArea = useCallback((area: FocusArea) => {
    setData((prev) => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter((a) => a !== area)
        : [...prev.focusAreas, area],
    }));
  }, []);

  const nextStep = useCallback(() => {
    setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  }, []);

  const prevStep = useCallback(() => {
    setStep((prev) => Math.max(prev - 1, 1));
  }, []);

  const submit = useCallback(async () => {
    if (!data.goal || !data.experience || data.equipment.length === 0 || data.focusAreas.length === 0) {
      setError("Completá todos los campos");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await api.post("/client/onboarding", {
        goal: data.goal,
        experience: data.experience,
        daysPerWeek: data.daysPerWeek,
        sessionDuration: data.sessionDuration,
        equipment: data.equipment,
        focusAreas: data.focusAreas,
      });

      // Redirect to dashboard
      window.location.href = "/panel";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar");
    } finally {
      setIsSubmitting(false);
    }
  }, [api, data]);

  return {
    step,
    data,
    isSubmitting,
    error,
    setGoal,
    setExperience,
    setDaysPerWeek,
    setSessionDuration,
    toggleEquipment,
    toggleFocusArea,
    nextStep,
    prevStep,
    submit,
  };
}