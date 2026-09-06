"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { ExerciseFacets, ExerciseLibraryItem, ExerciseLibraryQuery } from "./exercise-library.types";
export type { ExerciseFacets, ExerciseLibraryItem, ExerciseLibraryQuery } from "./exercise-library.types";
import { catalogQueryFlags } from "./exercise-library-catalog";

function qs(query: ExerciseLibraryQuery, offset: number) {
  const p = new URLSearchParams();
  const q = query.q.trim();
  if (q) p.set("q", q);
  if (query.muscles.length) p.set("muscle", query.muscles.join(","));
  if (query.equipments.length) p.set("equipment", query.equipments.join(","));
  if (query.difficulties.length) p.set("difficulty", query.difficulties.join(","));
  if (query.objectives.length) p.set("objective", query.objectives.join(","));
  if (query.favoritesOnly) p.set("favorites", "true");
  const catalog = catalogQueryFlags(query.catalog);
  if (catalog.basicsOnly) p.set("basic", "true");
  if (catalog.guideOnly) p.set("guide", "true");
  if (catalog.mineOnly) p.set("mine", "true");
  if (catalog.illustratedOnly) p.set("illustrated", "true");
  if (query.media !== "any") p.set("media", query.media);
  p.set("limit", String(Math.min(100, query.limit ?? 80)));
  if (offset) p.set("offset", String(offset));
  const s = p.toString();
  return s ? `?${s}` : "";
}

export function useExerciseLibrary(query: ExerciseLibraryQuery) {
  const { api } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<ExerciseLibraryItem[] | null>(null);
  const [facets, setFacets] = useState<ExerciseFacets | null>(null);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const baseUrl = useMemo(() => `/coach/exercises${qs(query, 0)}`, [query]);
  const pageSize = Math.min(100, query.limit ?? 80);
  const fetchPage = useCallback(async (nextOffset: number, append: boolean) => {
    const res = await api.get<ExerciseLibraryItem[]>(`/coach/exercises${qs(query, nextOffset)}`);
    setHasMore(res.length >= pageSize);
    setOffset(nextOffset);
    setItems((prev) => (append && prev ? [...prev, ...res] : res));
  }, [api, query, pageSize]);
  const setFavorite = useCallback(async (exerciseId: string, favorite: boolean) => {
    try {
      if (favorite) await api.post(`/coach/exercises/${exerciseId}/favorite`, {});
      else await api.del(`/coach/exercises/${exerciseId}/favorite`);
      setItems((prev) => (prev ? prev.map((it) => (it.id === exerciseId ? { ...it, isFavorite: favorite } : it)) : prev));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar favorito");
    }
  }, [api, toast]);

  useEffect(() => {
    let cancelled = false;
    void api.get<ExerciseFacets>("/coach/exercises/facets").then((f) => { if (!cancelled) setFacets(f); }).catch((e: unknown) => { if (!cancelled) toast.error(e instanceof Error ? e.message : "Error al cargar filtros"); });
    return () => { cancelled = true; };
  }, [api, toast]);

  useEffect(() => {
    let cancelled = false;
    setItems(null);
    setOffset(0);
    setHasMore(false);
    void fetchPage(0, false).catch((e: unknown) => { if (!cancelled) { toast.error(e instanceof Error ? e.message : "Error al cargar ejercicios"); setItems([]); } });
    return () => { cancelled = true; };
  }, [baseUrl, fetchPage, toast]);

  return {
    items,
    facets,
    reload: async () => { try { await fetchPage(0, false); } catch (e) { toast.error(e instanceof Error ? e.message : "Error al cargar ejercicios"); } },
    loadMore: async () => {
      if (loadingMore || !hasMore) return;
      setLoadingMore(true);
      try { await fetchPage(offset + pageSize, true); }
      catch (e) { toast.error(e instanceof Error ? e.message : "Error al cargar ejercicios"); }
      finally { setLoadingMore(false); }
    },
    hasMore,
    loadingMore,
    setFavorite,
  };
}
