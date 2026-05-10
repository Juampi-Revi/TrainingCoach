import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { FoodItem } from "../_components/_types";

interface UseFoodDataResult {
  food: FoodItem[] | null;
  foodLoading: boolean;
  foodCommentDrafts: Record<string, string>;
  setFoodCommentDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  loadFoodData: (force?: boolean) => Promise<void>;
  postFoodComment: (foodId: string) => Promise<void>;
}

export function useFoodData(clientUserId: string): UseFoodDataResult {
  const { api } = useAuth();
  const toast = useToast();

  const [food, setFood] = useState<FoodItem[] | null>(null);
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodCommentDrafts, setFoodCommentDrafts] = useState<Record<string, string>>({});

  async function loadFoodData(force?: boolean) {
    if (!force && (foodLoading || food)) return;
    setFoodLoading(true);
    try {
      const r = await api.get<{ items: FoodItem[] }>(`/coach/clients/${clientUserId}/food?take=30`);
      setFood(r.items ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando comidas");
    } finally {
      setFoodLoading(false);
    }
  }

  async function postFoodComment(foodId: string) {
    const text = (foodCommentDrafts[foodId] ?? "").trim();
    if (!text) return;
    try {
      await api.post(`/coach/clients/${clientUserId}/food/${foodId}/comments`, { text });
      setFoodCommentDrafts((prev) => ({ ...prev, [foodId]: "" }));
      await loadFoodData(true);
      toast.success("Comentario enviado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error enviando comentario");
    }
  }

  return { food, foodLoading, foodCommentDrafts, setFoodCommentDrafts, loadFoodData, postFoodComment };
}
