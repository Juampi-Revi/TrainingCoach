"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getWorkoutGuideFrameUrls,
  resolveExerciseIllustration,
  resolveWorkoutGuideSlug,
  type ExerciseIllustrationInput,
} from "@/lib/workout-guide";

export function useExerciseIllustrationFrames(
  exercise: ExerciseIllustrationInput | null | undefined,
  animateGuide = false,
) {
  const primary = useMemo(() => resolveExerciseIllustration(exercise, 1), [exercise]);
  const slug = useMemo(() => resolveWorkoutGuideSlug(exercise), [exercise]);
  const guideFrames = useMemo(() => (slug ? getWorkoutGuideFrameUrls(slug) : []), [slug]);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    setFrameIndex(0);
  }, [slug, primary?.url]);

  useEffect(() => {
    if (!animateGuide || primary?.kind !== "guide" || guideFrames.length < 2) return;
    const id = window.setInterval(() => {
      setFrameIndex((prev) => (prev + 1) % guideFrames.length);
    }, 900);
    return () => window.clearInterval(id);
  }, [animateGuide, guideFrames, primary?.kind]);

  const url = primary?.kind === "guide" && guideFrames.length > 0
    ? guideFrames[frameIndex] ?? primary.url
    : primary?.url ?? null;

  return {
    url,
    kind: primary?.kind ?? null,
    animateGuide: primary?.kind === "guide" && guideFrames.length > 1,
  };
}
