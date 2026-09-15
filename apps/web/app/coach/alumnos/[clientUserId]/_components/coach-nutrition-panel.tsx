"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Input, StateBlock } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { NutritionToday } from "@regen/types";
import { MacroRings } from "@/app/(client)/comida/_components/macro-rings";
import { MacroSplitEditor } from "@/app/(client)/comida/_components/macro-split-editor";
import { calculateMacros, gramsFromSplit, splitFromGrams, type MacroSplitPct } from "@/lib/macros";

export function CoachNutritionPanel({ clientUserId }: { clientUserId: string }) {
  const { api } = useAuth();
  const toast = useToast();
  const [data, setData] = useState<NutritionToday | null>(null);
  const [loading, setLoading] = useState(true);
  const [calories, setCalories] = useState("");
  const [split, setSplit] = useState<MacroSplitPct>({ proteinPct: 30, carbsPct: 45, fatPct: 25 });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get<NutritionToday>(`/coach/clients/${clientUserId}/nutrition`);
      setData(res);
      if (res.target) {
        setCalories(String(res.target.calories));
        setSplit(splitFromGrams(res.target.calories, res.target.proteinG, res.target.carbsG, res.target.fatG));
      }
    } catch {
      toast.error("No se pudo cargar nutrición");
    } finally {
      setLoading(false);
    }
  }, [api, clientUserId, toast]);

  useEffect(() => {
    const t = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(t);
  }, [load]);

  const caloriesN = Number(calories);
  const grams = Number.isFinite(caloriesN) && caloriesN > 0 ? gramsFromSplit(caloriesN, split) : null;

  const suggestedSplit = useMemo(() => {
    const p = data?.profile;
    if (!p?.sex || !p.birthYear || !p.heightCm || !p.weightKg || !p.activityLevel) {
      return { proteinPct: 30, carbsPct: 45, fatPct: 25 };
    }
    const macros = calculateMacros({
      sex: p.sex,
      ageYears: new Date().getFullYear() - p.birthYear,
      heightCm: p.heightCm,
      weightKg: p.weightKg,
      activityLevel: p.activityLevel,
      goal: data?.target?.goal ?? "maintain",
    });
    return splitFromGrams(macros.calories, macros.proteinG, macros.carbsG, macros.fatG);
  }, [data]);

  async function save() {
    if (!grams || caloriesN <= 0) {
      toast.error("Completá las calorías");
      return;
    }
    setSaving(true);
    try {
      const weightKg = data?.profile.weightKg ?? 0;
      await api.put(`/coach/clients/${clientUserId}/nutrition`, {
        calories: caloriesN,
        proteinG: grams.proteinG,
        carbsG: grams.carbsG,
        fatG: grams.fatG,
        goal: data?.target?.goal ?? "maintain",
        proteinPerKg: weightKg > 0 ? Number((grams.proteinG / weightKg).toFixed(2)) : data?.target?.proteinPerKg ?? 1.8,
      });
      toast.success("Objetivo actualizado");
      await load();
    } catch {
      toast.error("No se pudo guardar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <StateBlock kind="loading" title="Cargando macros…" />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <MacroRings consumed={data?.consumed ?? { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 }} target={data?.target ?? null} />
      <Input label="Kcal" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} />
      {grams && Number.isFinite(caloriesN) && caloriesN > 0 && (
        <MacroSplitEditor
          calories={caloriesN}
          split={split}
          suggestedSplit={suggestedSplit}
          onChange={(next) => setSplit(next)}
        />
      )}
      <Button size="sm" onClick={() => void save()} disabled={saving || !grams}>
        {saving ? "Guardando…" : "Guardar objetivo del alumno"}
      </Button>
      <div style={{ fontSize: 12, color: "var(--text-mute)" }}>
        El alumno también puede calcularlo y cambiar el split. El último cambio gana.
        {data?.target ? ` Último: ${data.target.updatedByRole}.` : ""}
      </div>
    </div>
  );
}
