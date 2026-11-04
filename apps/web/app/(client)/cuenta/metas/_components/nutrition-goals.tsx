"use client";

import { useCallback, useEffect, useState } from "react";
import { StateBlock } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { MacrosCalculator } from "@/app/(client)/comida/_components/macros-calculator";
import type { NutritionProfile, NutritionTarget } from "@regen/types";

export function NutritionGoals() {
  const { api } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState<NutritionProfile | null>(null);
  const [target, setTarget] = useState<NutritionTarget | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [nextProfile, nextTarget] = await Promise.all([
        api.get<NutritionProfile>("/client/nutrition/profile"),
        api.get<NutritionTarget | null>("/client/nutrition/target"),
      ]);
      setProfile(nextProfile);
      setTarget(nextTarget);
    } catch {
      toast.error("No se pudieron cargar las metas de nutrición");
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { void load(); }, [load]);

  if (loading) {
    return <StateBlock kind="loading" title="Cargando macros…" />;
  }

  return (
    <div className="metas-nutrition">
      <p className="metas-nutrition-hint">
        Peso, altura, días de entreno y si buscás bajar, mantener o subir. El chat de Nutrición usa esto para el día.
      </p>
      <MacrosCalculator profile={profile} target={target} onSaved={load} />
    </div>
  );
}
