"use client";

export type ExerciseLibraryItem = {
  id: string;
  name: string;
  primaryMuscle: string | null;
  equipment: string | null;
  difficulty: string | null;
  objective: string | null;
  isSystem: boolean;
  thumbnailUrl: string | null;
  youtubeUrl?: string | null;
  isFavorite?: boolean;
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
  limit?: number;
};

