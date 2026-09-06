"use client";

export type ExerciseLibraryCatalogFilter = "all" | "basic" | "guide" | "mine" | "illustrated";

export type ExerciseLibraryItem = {
  id: string;
  name: string;
  primaryMuscle: string | null;
  equipment: string | null;
  difficulty: string | null;
  objective: string | null;
  isSystem: boolean;
  isBasic: boolean;
  isGuide?: boolean;
  hasIllustration?: boolean;
  source?: string | null;
  sourceId?: string | null;
  thumbnailUrl: string | null;
  youtubeUrl?: string | null;
  isFavorite?: boolean;
  hasImage?: boolean;
  hasVideo?: boolean;
};

export type ExerciseFacets = {
  muscles: string[];
  equipments: string[];
  difficulties: string[];
  objectives: string[];
};

export type ExerciseLibraryQuery = {
  q: string;
  muscles: string[];
  equipments: string[];
  difficulties: string[];
  objectives: string[];
  favoritesOnly: boolean;
  catalog: ExerciseLibraryCatalogFilter;
  media: "any" | "complete" | "missing" | "missingImage" | "missingVideo";
  limit?: number;
};
