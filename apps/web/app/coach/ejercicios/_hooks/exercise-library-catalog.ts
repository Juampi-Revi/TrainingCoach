"use client";

import type { ExerciseLibraryCatalogFilter } from "./exercise-library.types";

export function catalogQueryFlags(catalog: ExerciseLibraryCatalogFilter) {
  return {
    basicsOnly: catalog === "basic",
    guideOnly: catalog === "guide",
    mineOnly: catalog === "mine",
    illustratedOnly: catalog === "illustrated",
  };
}

export function catalogFilterLabel(catalog: ExerciseLibraryCatalogFilter): string | null {
  if (catalog === "basic") return "Básicos";
  if (catalog === "guide") return "Guía visual";
  if (catalog === "mine") return "Propios";
  if (catalog === "illustrated") return "Con ilustración";
  return null;
}
