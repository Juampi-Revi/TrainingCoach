import { getAssetUrl, getExercise } from "@bryllim/workout-guide";
import {
  REGEN_BASIC_SOURCE,
  REGEN_BASIC_WORKOUT_GUIDE_SLUGS,
  WORKOUT_GUIDE_SOURCE,
} from "./source-map";

export type ExerciseIllustrationInput = {
  thumbnailUrl?: string | null;
  source?: string | null;
  sourceId?: string | null;
  name?: string;
  media?: Array<{ mediaType: string; url: string }>;
};

export type ExerciseIllustration = {
  url: string;
  kind: "media" | "guide";
  slug?: string;
};

export type IllustrationFrame = 1 | 2 | 3;

export function resolveWorkoutGuideSlug(input: ExerciseIllustrationInput | null | undefined): string | null {
  if (!input) return null;

  if (input.source === WORKOUT_GUIDE_SOURCE && input.sourceId) {
    return getExercise(input.sourceId) ? input.sourceId : null;
  }

  if (input.source === REGEN_BASIC_SOURCE && input.sourceId) {
    const mapped = REGEN_BASIC_WORKOUT_GUIDE_SLUGS[input.sourceId];
    if (mapped && getExercise(mapped)) return mapped;
  }

  if (input.sourceId) {
    const mapped = REGEN_BASIC_WORKOUT_GUIDE_SLUGS[input.sourceId];
    if (mapped && getExercise(mapped)) return mapped;
    const hyphen = input.sourceId.replace(/_/g, "-");
    if (getExercise(hyphen)) return hyphen;
  }

  return null;
}

export function getWorkoutGuideFrameUrl(slug: string, frame: IllustrationFrame = 1): string | null {
  return getAssetUrl(slug, frame);
}

export function getWorkoutGuideFrameUrls(slug: string): string[] {
  return ([1, 2, 3] as const)
    .map((frame) => getAssetUrl(slug, frame))
    .filter((url): url is string => !!url);
}

export function resolveExerciseIllustration(
  input: ExerciseIllustrationInput | null | undefined,
  frame: IllustrationFrame = 1,
): ExerciseIllustration | null {
  if (!input) return null;

  const imageMedia = input.media?.find((m) => m.mediaType === "image");
  if (imageMedia?.url) return { url: imageMedia.url, kind: "media" };

  if (input.thumbnailUrl) return { url: input.thumbnailUrl, kind: "media" };

  const slug = resolveWorkoutGuideSlug(input);
  if (!slug) return null;

  const url = getWorkoutGuideFrameUrl(slug, frame);
  if (!url) return null;

  return { url, kind: "guide", slug };
}

export { REGEN_BASIC_SOURCE, WORKOUT_GUIDE_SOURCE };
