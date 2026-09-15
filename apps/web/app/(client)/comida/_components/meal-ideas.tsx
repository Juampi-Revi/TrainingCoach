"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { MacroTotals, MealIdea, MealIdeasResponse, MealType } from "@regen/types";

const SLOTS: Array<{ id: MealType; label: string }> = [
  { id: "breakfast", label: "Desayuno" },
  { id: "lunch", label: "Almuerzo" },
  { id: "snack", label: "Merienda" },
  { id: "dinner", label: "Cena" },
];

function slotFromClock(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 19) return "snack";
  return "dinner";
}

function slotLabel(id: MealType): string {
  return SLOTS.find((s) => s.id === id)?.label ?? id;
}

export function MealIdeas({
  remaining,
  hasTarget,
  onLogged,
}: {
  remaining: MacroTotals | null;
  hasTarget: boolean;
  onLogged: () => Promise<void>;
}) {
  const { api } = useAuth();
  const toast = useToast();
  const [slot, setSlot] = useState<MealType>(slotFromClock);
  const [ideas, setIdeas] = useState<MealIdea[]>([]);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!hasTarget) return;
    setLoading(true);
    try {
      const res = await api.get<MealIdeasResponse>(`/client/nutrition/ideas?mealType=${slot}`);
      setIdeas(res.ideas);
      setDone(res.done);
    } catch {
      toast.error("No se pudieron cargar ideas de comida");
    } finally {
      setLoading(false);
    }
  }, [api, hasTarget, slot, toast]);

  useEffect(() => {
    const t = setTimeout(() => { void load(); }, 0);
    return () => clearTimeout(t);
  }, [load, remaining?.proteinG]);

  async function useIdea(idea: MealIdea) {
    setSavingId(idea.id);
    try {
      await api.post("/client/food", {
        mealType: slot,
        items: idea.items.map((item) => ({
          foodItemId: item.foodItemId,
          name: item.name,
          grams: item.grams,
          servingLabel: item.portionLabel,
          kcal: item.kcal,
          proteinG: item.proteinG,
          carbsG: item.carbsG,
          fatG: item.fatG,
        })),
      });
      toast.success(`Sumamos ${idea.title.toLowerCase()}`);
      await onLogged();
    } catch {
      toast.error("No se pudo registrar la idea");
    } finally {
      setSavingId(null);
    }
  }

  if (!hasTarget) return null;

  const need = remaining ? Math.round(remaining.proteinG) : 0;
  const mealName = slotLabel(slot).toLowerCase();

  return (
    <div className="ideas">
      <div className="ideas-title">¿Qué como ahora?</div>
      <div className="ideas-slots">
        {SLOTS.map((s) => (
          <button key={s.id} type="button" className={slot === s.id ? "on" : ""} onClick={() => setSlot(s.id)}>
            {s.label}
          </button>
        ))}
      </div>
      {done || need <= 8 ? (
        <p className="ideas-copy">Ya cubriste la proteína de hoy. Si igual vas a comer, registrala a mano abajo.</p>
      ) : (
        <p className="ideas-copy">
          Para {mealName} te faltan <strong>{need} g</strong> de proteína. Elegí un plato y lo cargamos con las porciones.
        </p>
      )}
      {loading && <div className="ideas-muted">Armando ideas…</div>}
      {!loading && !done && ideas.length === 0 && need > 8 && (
        <div className="ideas-muted">No pude armar un plato con el catálogo. Buscá abajo pechuga, atún o whey.</div>
      )}
      {!loading && !done && ideas.map((idea) => (
        <article key={idea.id} className="idea">
          <div className="idea-head">
            <h3>{idea.title}</h3>
            <span className="ta-mono">P {Math.round(idea.totals.proteinG)} g</span>
          </div>
          <p>{idea.blurb}</p>
          <ul>
            {idea.items.map((item) => (
              <li key={`${idea.id}-${item.foodId}`}>
                {item.name} · {item.portionLabel}
              </li>
            ))}
          </ul>
          <div className="idea-macros ta-mono">
            {Math.round(idea.totals.kcal)} kcal · C {Math.round(idea.totals.carbsG)} · G {Math.round(idea.totals.fatG)}
          </div>
          <Button size="sm" onClick={() => void useIdea(idea)} disabled={savingId != null}>
            {savingId === idea.id ? "Sumando…" : "Registrar este plato"}
          </Button>
        </article>
      ))}
      <style jsx>{`
        .ideas { display: flex; flex-direction: column; gap: 10px; }
        .ideas-title { font-size: 13px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--text-mute); }
        .ideas-slots { display: flex; flex-wrap: wrap; gap: 6px; }
        .ideas-slots button { border: 1px solid var(--line-2); background: var(--bg-1); color: var(--text-mute); border-radius: 10px; padding: 8px 10px; font-size: 12px; font-weight: 700; cursor: pointer; }
        .ideas-slots button.on { border-color: var(--lime); background: color-mix(in srgb, var(--lime) 12%, transparent); color: var(--lime); }
        .ideas-copy { margin: 0; font-size: 13px; line-height: 1.45; color: var(--text); }
        .ideas-copy strong { color: var(--lime); font-family: var(--font-mono); }
        .ideas-muted { font-size: 12px; color: var(--text-mute); }
        .idea { padding: 12px; border: 1px solid var(--line); background: var(--bg-1); border-radius: 14px; display: flex; flex-direction: column; gap: 8px; }
        .idea-head { display: flex; justify-content: space-between; gap: 8px; align-items: baseline; }
        .idea-head h3 { margin: 0; font-size: 15px; font-weight: 800; }
        .idea-head span { color: var(--lime); font-size: 12px; }
        .idea p { margin: 0; font-size: 12px; color: var(--text-dim); line-height: 1.4; }
        .idea ul { margin: 0; padding-left: 16px; font-size: 13px; color: var(--text); display: flex; flex-direction: column; gap: 3px; }
        .idea-macros { font-size: 11px; color: var(--text-mute); }
      `}</style>
    </div>
  );
}
