"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { StateBlock, Tabs } from "@/components/ui";
import type { AssistantRange } from "@regen/types";
import { amount, periodTitle } from "../_lib/format";

export function HistoryView({ today }: { today: string }) {
  const { api } = useAuth();
  const toast = useToast();
  const [kind, setKind] = useState("Semana");
  const [span, setSpan] = useState<AssistantRange | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.get<AssistantRange>(`/client/assistant/range?kind=${kind === "Mes" ? "month" : "week"}`)
      .then((data) => {
        if (!cancelled) setSpan(data);
      })
      .catch(() => {
        if (!cancelled) {
          setSpan(null);
          toast.error("No se pudo cargar el historial");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [api, kind]);

  if (loading && !span) {
    return <StateBlock kind="loading" title="Armando el período…" />;
  }

  if (!span) return null;

  const maxKcal = Math.max(1, ...span.days.map((row) => row.kcal));
  const listed = span.days.filter((row) => row.kcal > 0 || row.milliliters > 0 || row.localDate === today);
  const title = span.kind === "week"
    ? `Semana del ${span.days[0]?.day ?? ""} al ${span.days.at(-1)?.day ?? ""}`
    : periodTitle(span.from);
  const offset = (new Date(`${span.from}T00:00:00.000Z`).getUTCDay() + 6) % 7;

  return (
    <div className="asistente-history">
      <Tabs variant="pills" tabs={["Semana", "Mes"]} active={kind} onChange={setKind} />

      <section className="asistente-card">
        <div className="asistente-card-head">
          <strong>{title}</strong>
          <em>{amount(span.totals.kcal, 0)} kcal</em>
        </div>
        {span.kind === "week" ? (
          <div className="asistente-bars">
            {span.days.map((row) => (
              <div key={row.localDate} className={`asistente-bar ${row.localDate === today ? "today" : ""}`}>
                <div
                  className="asistente-bar-fill"
                  style={{ height: `${Math.max(6, Math.round((row.kcal / maxKcal) * 84))}px` }}
                />
                <strong>{amount(row.kcal, 0)}</strong>
                <small>{row.weekday}</small>
              </div>
            ))}
          </div>
        ) : (
          <div className="asistente-month">
            {["L", "M", "X", "J", "V", "S", "D"].map((label) => <small key={label}>{label}</small>)}
            {Array.from({ length: offset }, (_, index) => <span key={`empty-${index}`} />)}
            {span.days.map((row) => (
              <span
                key={row.localDate}
                className={row.kcal > 0 || row.milliliters > 0 ? "has" : row.localDate === today ? "today" : ""}
              >
                {row.day}
              </span>
            ))}
          </div>
        )}
        <p className="asistente-empty">
          {amount(span.totals.proteinG, 0)} g proteína · {amount(span.totals.milliliters, 0)} ml
        </p>
      </section>

      <section className="asistente-card">
        {listed.length === 0 ? (
          <p className="asistente-empty">Todavía no hay registros en este período.</p>
        ) : listed.map((row) => (
          <div className="asistente-goal" key={row.localDate}>
            <span>{row.weekday} {row.day}{row.localDate === today ? " · hoy" : ""}</span>
            <strong>
              {amount(row.kcal, 0)} kcal
              {row.milliliters > 0 ? ` · ${amount(row.milliliters, 0)} ml` : ""}
            </strong>
          </div>
        ))}
      </section>
    </div>
  );
}
