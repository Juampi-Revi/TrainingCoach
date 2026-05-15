"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { ExerciseFacets, ExerciseLibraryItem, ExerciseLibraryQuery } from "./exercise-library.types";

export type { ExerciseFacets, ExerciseLibraryItem, ExerciseLibraryQuery } from "./exercise-library.types";

function qs(query: ExerciseLibraryQuery): string {
  const p = new URLSearchParams();
  if (query.q.trim()) p.set("q", query.q.trim());
  if (query.muscles.length) p.set("muscle", query.muscles.join(","));
  if (query.equipments.length) p.set("equipment", query.equipments.join(","));
  if (query.difficulties.length) p.set("difficulty", query.difficulties.join(","));
  if (query.objectives.length) p.set("objective", query.objectives.join(","));
  if (query.favoritesOnly) p.set("favorites", "true");
  p.set("limit", String(Math.min(100, query.limit ?? 80)));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function useExerciseLibrary(query: ExerciseLibraryQuery) {
  const { api } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<ExerciseLibraryItem[] | null>(null);
  const [facets, setFacets] = useState<ExerciseFacets | null>(null);

  const listUrl = useMemo(() => `/coach/exercises${qs(query)}`, [query]);

  async function setFavorite(exerciseId: string, favorite: boolean) {
    try {
      if (favorite) {
        await api.post(`/coach/exercises/${exerciseId}/favorite`, {});
      } else {
        await api.del(`/coach/exercises/${exerciseId}/favorite`);
      }
      setItems((prev) =>
        prev
          ? prev.map((it) => (it.id === exerciseId ? { ...it, isFavorite: favorite } : it))
          : prev,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar favorito");
    }
  }

  useEffect(() => {
    let cancelled = false;
    void api
      .get<ExerciseFacets>("/coach/exercises/facets")
      .then((f) => {
        if (cancelled) return;
        setFacets(f);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        toast.error(e instanceof Error ? e.message : "Error al cargar filtros");
      });
    return () => {
      cancelled = true;
    };
  }, [api, toast]);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setItems(null);
    });
    void api
      .get<ExerciseLibraryItem[]>(listUrl)
      .then((ex) => {
        if (cancelled) return;
        setItems(ex);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        toast.error(e instanceof Error ? e.message : "Error al cargar ejercicios");
        setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, [listUrl, api, toast]);

  return {
    items,
    facets,
    reload: async () => {
      try {
        const ex = await api.get<ExerciseLibraryItem[]>(listUrl);
        setItems(ex);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al cargar ejercicios");
      }
    },
    setFavorite,
  };
}
