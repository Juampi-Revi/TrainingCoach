"use client";

import { useState } from "react";
import { ConfirmModal, Icon } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { AssistantDay, AssistantDayMeal } from "@regen/types";
import { amount, clock, portionLabel } from "../_lib/format";

export function TodayMeals({
  day,
  onDay,
}: {
  day: AssistantDay;
  onDay: (day: AssistantDay) => void;
}) {
  const { api } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [removing, setRemoving] = useState<string | null>(null);

  async function saveQuantity(itemId: string) {
    const quantity = Number(draft.replace(",", "."));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast.error("La cantidad tiene que ser mayor a cero");
      return;
    }
    try {
      const result = await api.patch<{ day: AssistantDay }>(`/client/assistant/meal-items/${itemId}`, { quantity });
      onDay(result.day);
      setEditing(null);
    } catch {
      toast.error("No se pudo actualizar la cantidad");
    }
  }

  async function removeMeal(mealId: string) {
    try {
      const result = await api.del<{ day: AssistantDay }>(`/client/assistant/meals/${mealId}`);
      onDay(result.day);
      setRemoving(null);
    } catch {
      toast.error("No se pudo borrar la comida");
    }
  }

  return (
    <section className="asistente-section">
      <h2>Comidas de hoy</h2>
      {day.meals.length === 0 ? (
        <p className="asistente-empty">Nada anotado. Desde el chat: comí tres huevos.</p>
      ) : day.meals.map((meal) => (
        <article key={meal.id} className="asistente-card">
          <div className="asistente-card-head">
            <span>
              <strong>{mealTitle(meal)}</strong>
              <small className="asistente-muted"> {clock(meal.consumedAt)}</small>
            </span>
            <span className="asistente-actions">
              <em>{amount(meal.items.reduce((sum, item) => sum + item.kcal, 0), 0)} kcal</em>
              <button type="button" className="asistente-icon-btn" aria-label={`Borrar ${mealTitle(meal)}`} onClick={() => setRemoving(meal.id)}>
                <Icon name="trash" size={14} />
              </button>
            </span>
          </div>
          {meal.items.map((item) => (
            <div className="asistente-line" key={item.id}>
              <span>
                <strong>{item.displayName}</strong>
                <small>{portionLabel(item)} · {amount(item.kcal, 0)} kcal</small>
              </span>
              {editing === item.id ? (
                <span className="asistente-actions">
                  <input
                    aria-label={`Cantidad de ${item.displayName}`}
                    inputMode="decimal"
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                  />
                  <button type="button" className="asistente-icon-btn on" aria-label="Guardar" onClick={() => void saveQuantity(item.id)}>
                    <Icon name="check" size={14} />
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className="asistente-icon-btn"
                  aria-label={`Editar ${item.displayName}`}
                  onClick={() => {
                    setEditing(item.id);
                    setDraft(String(item.quantity));
                  }}
                >
                  <Icon name="edit" size={14} />
                </button>
              )}
            </div>
          ))}
        </article>
      ))}
      {removing && (
        <ConfirmModal
          message="¿Borramos esta comida del día?"
          confirmLabel="Borrar"
          onConfirm={() => void removeMeal(removing)}
          onCancel={() => setRemoving(null)}
        />
      )}
    </section>
  );
}

function mealTitle(meal: AssistantDayMeal): string {
  const note = (meal.note ?? "").trim();
  if (!note) return "Comida";
  return note.charAt(0).toUpperCase() + note.slice(1);
}
