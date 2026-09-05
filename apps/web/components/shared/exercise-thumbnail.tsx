"use client";

import Image from "next/image";
import { Icon } from "@/components/ui";
import {
  resolveExerciseIllustration,
  type ExerciseIllustrationInput,
  type IllustrationFrame,
} from "@/lib/workout-guide";

export function ExerciseThumbnail({
  exercise,
  size = 52,
  frame = 1,
  fallbackIcon = "dumbbell",
  borderRadius = 8,
  className,
}: {
  exercise: ExerciseIllustrationInput;
  size?: number;
  frame?: IllustrationFrame;
  fallbackIcon?: "dumbbell" | "play";
  borderRadius?: number;
  className?: string;
}) {
  const illustration = resolveExerciseIllustration(exercise, frame);
  const isGuide = illustration?.kind === "guide";

  return (
    <div
      className={className}
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius,
        background: "var(--bg-2)",
        border: illustration ? "1px solid var(--line-2)" : "1px dashed var(--line-2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      {illustration ? (
        <Image
          unoptimized
          src={illustration.url}
          alt=""
          fill
          sizes={`${size}px`}
          style={{ objectFit: isGuide ? "contain" : "cover", padding: isGuide ? 4 : 0 }}
        />
      ) : (
        <Icon name={fallbackIcon} size={Math.max(14, Math.round(size * 0.3))} color="var(--text-dim)" />
      )}
    </div>
  );
}
