"use client";

import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { AssistantDay } from "@regen/types";
import { amount, meter } from "../_lib/format";
import { TodayMeals } from "./today-meals";
import { TodayDrinks } from "./today-drinks";

const TIME_LABEL: Record<string, string> = {
  morning: "Mañana",
  with_breakfast: "Con desayuno",
  afternoon: "Tarde",
  with_dinner: "Con cena",
  night: "Noche",
};

export function TodayView({
  day,
  onDay,
}: {
  day: AssistantDay;
  onDay: (day: AssistantDay) => void;
}) {
  const { api } = useAuth();
  const toast = useToast();
  const proteinLeft = day.remaining.proteinG;

  async function mark(supplementId: string, status: "planned" | "taken" | "skipped") {
    try {
      const result = await api.patch<{ day: AssistantDay }>(`/client/assistant/supplements/${supplementId}`, { status });
      onDay(result.day);
    } catch {
      toast.error("No se pudo actualizar el suplemento");
    }
  }

  return (
    <div className="asistente-today">
      <section className="asistente-card">
        <div className="asistente-card-head">
          <strong>{amount(day.consumed.kcal, 0)} kcal</strong>
          <em>{day.goals.kcal === null ? "sin objetivo" : `${amount(day.goals.kcal, 0)} kcal`}</em>
        </div>
        <i className="asistente-meter"><b style={{ width: `${meter(day.consumed.kcal, day.goals.kcal)}%` }} /></i>
        <div className="asistente-macros three">
          <Macro label="Proteína" value={day.consumed.proteinG} goal={day.goals.proteinG} unit="g" />
          <Macro label="Carbos" value={day.consumed.carbsG} goal={day.goals.carbsG} unit="g" />
          <Macro label="Grasas" value={day.consumed.fatG} goal={day.goals.fatG} unit="g" />
        </div>
      </section>

      <TodayMeals day={day} onDay={onDay} />
      <TodayDrinks day={day} onDay={onDay} />

      <section className="asistente-section">
        <h2>Suplementos</h2>
        {day.supplements.length === 0 ? (
          <p className="asistente-empty">Decile al chat qué tomás para recordarlo.</p>
        ) : day.supplements.map((item) => (
          <article key={item.id} className="asistente-card">
            <div className="asistente-card-head">
              <span>
                <strong>{item.name}</strong>
                <small className="asistente-muted"> {TIME_LABEL[item.timeOfDay] ?? item.timeOfDay}</small>
              </span>
              <em>{statusLabel(item.status)}</em>
            </div>
            <div className="asistente-chips">
              <button type="button" className={item.status === "taken" ? "on" : ""} onClick={() => void mark(item.id, "taken")}>Tomado</button>
              <button type="button" className={item.status === "planned" ? "on" : ""} onClick={() => void mark(item.id, "planned")}>Más tarde</button>
              <button type="button" className={item.status === "skipped" ? "on" : ""} onClick={() => void mark(item.id, "skipped")}>Hoy no</button>
            </div>
          </article>
        ))}
      </section>

      {proteinLeft !== null && (
        <section className="asistente-hint">
          {proteinLeft >= 0
            ? `Te faltan ${amount(proteinLeft, 0)} g de proteína para el objetivo de hoy.`
            : `Vas ${amount(Math.abs(proteinLeft), 0)} g por encima del objetivo de proteína.`}
        </section>
      )}
    </div>
  );
}

function statusLabel(status: string | null): string {
  if (status === "taken") return "tomado";
  if (status === "planned") return "más tarde";
  if (status === "skipped") return "hoy no";
  return "pendiente";
}

function Macro({
  label,
  value,
  goal,
  unit,
}: {
  label: string;
  value: number;
  goal: number | null;
  unit: string;
}) {
  const pct = goal && goal > 0 ? Math.max(0, Math.min(100, (value / goal) * 100)) : 0;
  return (
    <div className="asistente-macro">
      <span>{label}</span>
      <strong>{amount(value, value >= 100 ? 0 : 1)} {unit}</strong>
      <i><b style={{ width: `${pct}%` }} /></i>
      <small>{goal == null ? "sin objetivo" : `${Math.round(pct)}%`}</small>
    </div>
  );
}
