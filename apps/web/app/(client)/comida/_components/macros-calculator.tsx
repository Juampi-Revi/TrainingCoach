"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import {
  calculateMacros,
  gramsFromSplit,
  sameSplit,
  splitFromGrams,
  type ActivityLevel,
  type BiologicalSex,
  type MacroSplitPct,
  type NutritionGoal,
} from "@/lib/macros";
import type { NutritionProfile, NutritionTarget } from "@regen/types";
import { MacroSplitEditor } from "./macro-split-editor";

const ACTIVITY: Array<{ id: ActivityLevel; label: string }> = [
  { id: "sedentary", label: "Sedentario" },
  { id: "light", label: "1–3 entrenos" },
  { id: "moderate", label: "3–5 entrenos" },
  { id: "very", label: "6–7 entrenos" },
  { id: "extra", label: "Doble turno" },
];

const GOALS: Array<{ id: NutritionGoal; label: string }> = [
  { id: "lose", label: "Bajar" },
  { id: "maintain", label: "Mantener" },
  { id: "gain", label: "Subir" },
];

export function MacrosCalculator({
  profile,
  target,
  onSaved,
}: {
  profile: NutritionProfile | null;
  target: NutritionTarget | null;
  onSaved: () => Promise<void>;
}) {
  const { api } = useAuth();
  const toast = useToast();
  const currentYear = new Date().getFullYear();
  const [sex, setSex] = useState<BiologicalSex>(profile?.sex ?? "male");
  const [birthYear, setBirthYear] = useState(profile?.birthYear ? String(profile.birthYear) : "");
  const [heightCm, setHeightCm] = useState(profile?.heightCm ? String(profile.heightCm) : "");
  const [weightKg, setWeightKg] = useState(profile?.weightKg ? String(profile.weightKg) : "");
  const [activity, setActivity] = useState<ActivityLevel>(profile?.activityLevel ?? "moderate");
  const [goal, setGoal] = useState<NutritionGoal>(target?.goal ?? "maintain");
  const [saving, setSaving] = useState(false);
  const [split, setSplit] = useState<MacroSplitPct | null>(null);
  const followSuggested = useRef(true);
  const initedFromTarget = useRef(false);

  useEffect(() => {
    if (!profile) return;
    if (profile.sex) setSex(profile.sex);
    if (profile.birthYear) setBirthYear(String(profile.birthYear));
    if (profile.heightCm) setHeightCm(String(profile.heightCm));
    if (profile.weightKg) setWeightKg(String(profile.weightKg));
    if (profile.activityLevel) setActivity(profile.activityLevel);
  }, [profile]);

  useEffect(() => {
    if (target?.goal) setGoal(target.goal);
  }, [target?.goal]);

  const preview = useMemo(() => {
    const age = currentYear - Number(birthYear);
    const h = Number(heightCm);
    const w = Number(weightKg);
    if (!Number.isFinite(age) || age < 12 || !Number.isFinite(h) || !Number.isFinite(w) || w <= 0) return null;
    return calculateMacros({ sex, ageYears: age, heightCm: h, weightKg: w, activityLevel: activity, goal });
  }, [activity, birthYear, currentYear, goal, heightCm, sex, weightKg]);

  const suggestedSplit = useMemo(() => {
    if (!preview) return null;
    return splitFromGrams(preview.calories, preview.proteinG, preview.carbsG, preview.fatG);
  }, [preview]);

  useEffect(() => {
    if (!suggestedSplit) return;
    if (target && !initedFromTarget.current) {
      initedFromTarget.current = true;
      const fromTarget = splitFromGrams(target.calories, target.proteinG, target.carbsG, target.fatG);
      if (!sameSplit(fromTarget, suggestedSplit)) {
        followSuggested.current = false;
        setSplit(fromTarget);
        return;
      }
    }
    if (followSuggested.current) setSplit(suggestedSplit);
  }, [suggestedSplit, target]);

  const activeSplit = split ?? suggestedSplit;
  const grams = preview && activeSplit ? gramsFromSplit(preview.calories, activeSplit) : null;

  async function save() {
    if (!preview || !grams) {
      toast.error("Completá peso, altura y año de nacimiento");
      return;
    }
    setSaving(true);
    try {
      await api.put("/client/nutrition/profile", {
        sex,
        birthYear: Number(birthYear),
        heightCm: Number(heightCm),
        activityLevel: activity,
        weightKg: Number(weightKg),
      });
      await api.put("/client/nutrition/target", {
        calories: preview.calories,
        proteinG: grams.proteinG,
        carbsG: grams.carbsG,
        fatG: grams.fatG,
        goal,
        proteinPerKg: Number((grams.proteinG / Number(weightKg)).toFixed(2)),
        activityLevel: activity,
      });
      toast.success("Objetivo guardado. Peso y altura quedan igual que en tu ficha.");
      await onSaved();
    } catch {
      toast.error("No se pudo guardar el objetivo");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="calc">
      <div className="calc-title">Objetivo de macros</div>
      {target && (
        <div className="calc-meta">
          Actual: {target.calories} kcal · P {target.proteinG} · C {target.carbsG} · G {target.fatG}
          {" · "}último cambio: {target.updatedByRole === "coach" ? "coach" : "vos"}
        </div>
      )}
      <p className="calc-hint">
        Peso y altura salen de tu ficha y de Mediciones. Si los cambiás acá, se actualizan también ahí.
      </p>
      <div className="calc-body">
        <div className="calc-row">
          {(["male", "female"] as const).map((id) => (
            <button key={id} type="button" className={sex === id ? "on" : ""} onClick={() => setSex(id)}>
              {id === "male" ? "Hombre" : "Mujer"}
            </button>
          ))}
        </div>
        <div className="calc-grid">
          <Input label="Año nac." type="number" value={birthYear} onChange={(e) => setBirthYear(e.target.value)} />
          <Input label="Altura" type="number" suffix="cm" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
          <Input label="Peso" type="number" suffix="kg" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
        </div>
        <div className="calc-label">Actividad</div>
        <div className="calc-wrap">
          {ACTIVITY.map((a) => (
            <button key={a.id} type="button" className={activity === a.id ? "on" : ""} onClick={() => setActivity(a.id)}>{a.label}</button>
          ))}
        </div>
        <div className="calc-label">Objetivo</div>
        <div className="calc-row">
          {GOALS.map((g) => (
            <button key={g.id} type="button" className={goal === g.id ? "on" : ""} onClick={() => setGoal(g.id)}>{g.label}</button>
          ))}
        </div>
        {preview && suggestedSplit && activeSplit && grams && (
          <>
            <div className="calc-preview ta-mono">
              {preview.calories} kcal · P {grams.proteinG}g · C {grams.carbsG}g · G {grams.fatG}g
              <div>BMR {preview.bmr} · TDEE {preview.tdee} · {activeSplit.proteinPct}/{activeSplit.carbsPct}/{activeSplit.fatPct}%</div>
            </div>
            <MacroSplitEditor
              calories={preview.calories}
              split={activeSplit}
              suggestedSplit={suggestedSplit}
              onChange={(next, follow) => {
                followSuggested.current = follow;
                setSplit(next);
              }}
            />
          </>
        )}
        <Button onClick={() => void save()} disabled={saving || !preview}>
          {saving ? "Guardando…" : "Guardar objetivo"}
        </Button>
      </div>
      <style jsx>{`
        .calc { background: var(--bg-1); border: 1px solid var(--line); border-radius: 14px; padding: 14px; }
        .calc-title { font-weight: 800; font-size: 16px; }
        .calc-meta { margin-top: 6px; font-size: 12px; color: var(--text-mute); }
        .calc-hint { margin: 8px 0 0; font-size: 12px; line-height: 1.4; color: var(--text-dim); }
        .calc-body { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
        .calc-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
        .calc-label { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--text-mute); }
        .calc-row, .calc-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
        .calc-row button, .calc-wrap button { border: 1px solid var(--line-2); background: var(--bg-2); color: var(--text-mute); border-radius: 10px; padding: 8px 10px; font-size: 12px; font-weight: 700; cursor: pointer; }
        .calc-row button.on, .calc-wrap button.on { border-color: var(--lime); background: color-mix(in srgb, var(--lime) 12%, transparent); color: var(--lime); }
        .calc-preview { padding: 10px; border-radius: 10px; background: var(--bg-2); font-size: 13px; }
        .calc-preview div { margin-top: 4px; font-size: 11px; color: var(--text-mute); }
      `}</style>
    </div>
  );
}
