"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { AssistantDay } from "@regen/types";
import { amount, parseDrinkText } from "../_lib/format";

const CHIPS = [
  { name: "Agua", unit: "vaso" },
  { name: "Café", unit: "unidad" },
  { name: "Mate", unit: "unidad" },
  { name: "Té", unit: "unidad" },
] as const;

export function TodayDrinks({
  day,
  onDay,
}: {
  day: AssistantDay;
  onDay: (day: AssistantDay) => void;
}) {
  const { api } = useAuth();
  const toast = useToast();
  const [other, setOther] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  async function pour(displayName: string, quantity: number, unit: string) {
    try {
      const result = await api.post<{ day: AssistantDay }>("/client/assistant/drinks", { displayName, quantity, unit });
      onDay(result.day);
    } catch {
      toast.error("No se pudo sumar la bebida");
    }
  }

  async function save(drinkId: string) {
    const milliliters = Number(draft.replace(",", "."));
    if (!Number.isFinite(milliliters) || milliliters <= 0) {
      toast.error("Los mililitros tienen que ser mayores a cero");
      return;
    }
    try {
      const result = await api.patch<{ day: AssistantDay }>(`/client/assistant/drinks/${drinkId}`, { milliliters });
      onDay(result.day);
      setEditing(null);
    } catch {
      toast.error("No se pudo actualizar");
    }
  }

  async function remove(drinkId: string) {
    try {
      const result = await api.del<{ day: AssistantDay }>(`/client/assistant/drinks/${drinkId}`);
      onDay(result.day);
    } catch {
      toast.error("No se pudo sacar la bebida");
    }
  }

  function submitOther(event: FormEvent) {
    event.preventDefault();
    const parsed = parseDrinkText(other);
    if (!parsed.displayName) return;
    void pour(parsed.displayName, parsed.quantity, parsed.unit);
    setOther("");
  }

  return (
    <section className="asistente-section">
      <div className="asistente-card-head">
        <h2>Tomé</h2>
        <span>{amount(day.liquidsMl, 0)} ml</span>
      </div>
      {day.drinks.length === 0 ? (
        <p className="asistente-empty">Agua, café, mate, té, o cualquier otra cosa.</p>
      ) : day.drinks.map((drink) => (
        <div className="asistente-note" key={drink.id}>
          <span>
            <strong>{drink.displayName}</strong>
            <small>
              {drink.unit === "ml"
                ? `${amount(drink.milliliters, 0)} ml`
                : `${amount(drink.quantity, Number.isInteger(drink.quantity) ? 0 : 1)} ${drink.unit} · ${amount(drink.milliliters, 0)} ml`}
              {drink.kcal > 0 ? ` · ${amount(drink.kcal, 0)} kcal` : ""}
            </small>
          </span>
          <span className="asistente-actions">
            {editing === drink.id ? (
              <>
                <input
                  aria-label={`Mililitros de ${drink.displayName}`}
                  inputMode="decimal"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <button type="button" className="asistente-icon-btn on" aria-label="Guardar" onClick={() => void save(drink.id)}>
                  <Icon name="check" size={14} />
                </button>
              </>
            ) : (
              <button
                type="button"
                className="asistente-icon-btn"
                aria-label={`Cambiar mililitros de ${drink.displayName}`}
                onClick={() => {
                  setEditing(drink.id);
                  setDraft(String(drink.milliliters));
                }}
              >
                <Icon name="edit" size={14} />
              </button>
            )}
            <button type="button" className="asistente-icon-btn" aria-label={`Sacar ${drink.displayName}`} onClick={() => void remove(drink.id)}>
              <Icon name="trash" size={14} />
            </button>
          </span>
        </div>
      ))}
      <p className="asistente-empty">Taza 200, vaso 250, litro 1000. El lápiz cambia los ml.</p>
      <div className="asistente-chips">
        {CHIPS.map((chip) => (
          <button key={chip.name} type="button" onClick={() => void pour(chip.name, 1, chip.unit)}>
            {chip.name}
          </button>
        ))}
      </div>
      <form className="asistente-other" onSubmit={submitOther}>
        <input
          value={other}
          onChange={(event) => setOther(event.target.value)}
          placeholder="1 litro de agua, termo de mate…"
          aria-label="Otra bebida"
        />
        <button type="submit">Sumar</button>
      </form>
    </section>
  );
}
