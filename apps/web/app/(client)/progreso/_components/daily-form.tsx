"use client";

import { useRef, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Button } from "@/components/ui";
import type { HealthEntry } from "./_types";

type Props = {
  health: HealthEntry[] | null;
  onHealthLoadRef: React.MutableRefObject<((entries: HealthEntry[]) => void) | null>;
  loadHealth: () => void;
};

export function DailyForm({ health, onHealthLoadRef, loadHealth }: Props) {
  const { api } = useAuth();
  const toast = useToast();

  const [healthDay, setHealthDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [steps, setSteps] = useState("");
  const [sleepHours, setSleepHours] = useState("");
  const [sportType, setSportType] = useState("");
  const [sportMinutes, setSportMinutes] = useState("");
  const [dailyNotes, setDailyNotes] = useState("");
  const [savingDaily, setSavingDaily] = useState(false);

  const healthDayRef = useRef(healthDay);
  useEffect(() => {
    healthDayRef.current = healthDay;
  }, [healthDay]);

  // Register hydration callback — called once when health first loads
  useEffect(() => {
    onHealthLoadRef.current = (entries: HealthEntry[]) => {
      const day = healthDayRef.current;
      const existing = entries.find((x) => x.day === day) ?? null;
      if (existing) {
        setSteps(existing.steps != null ? String(existing.steps) : "");
        setSleepHours(existing.sleepMinutes != null ? String(Math.round((existing.sleepMinutes / 60) * 10) / 10) : "");
        setSportType(existing.sportType ?? "");
        setSportMinutes(existing.sportMinutes != null ? String(existing.sportMinutes) : "");
        setDailyNotes(existing.notes ?? "");
      }
    };
    return () => {
      onHealthLoadRef.current = null;
    };
  }, [onHealthLoadRef]);

  const selectedDaily = (health ?? []).find((e) => e.day === healthDay) ?? null;

  function selectHealthDay(nextDay: string) {
    setHealthDay(nextDay);
    const existing = (health ?? []).find((x) => x.day === nextDay) ?? null;
    if (!existing) {
      setSteps(""); setSleepHours(""); setSportType(""); setSportMinutes(""); setDailyNotes("");
      return;
    }
    setSteps(existing.steps != null ? String(existing.steps) : "");
    setSleepHours(existing.sleepMinutes != null ? String(Math.round((existing.sleepMinutes / 60) * 10) / 10) : "");
    setSportType(existing.sportType ?? "");
    setSportMinutes(existing.sportMinutes != null ? String(existing.sportMinutes) : "");
    setDailyNotes(existing.notes ?? "");
  }

  async function saveDaily() {
    setSavingDaily(true);
    try {
      await api.post("/client/health", {
        day: healthDay,
        steps: steps ? Number(steps) : null,
        sleepHours: sleepHours ? Number(sleepHours) : null,
        sportType: sportType ? sportType : null,
        sportMinutes: sportMinutes ? Number(sportMinutes) : null,
        notes: dailyNotes ? dailyNotes : null,
      });
      loadHealth();
      toast.success("Registro guardado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSavingDaily(false);
    }
  }

  const inputStyle = { width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontFamily: "var(--font-mono)", fontSize: 16, color: "var(--text)", outline: "none" } as const;
  const labelStyle = { fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase" as const, letterSpacing: ".08em", fontWeight: 600, marginBottom: 6 };

  return (
    <div style={{ padding: 14, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Registro diario</div>
        <input type="date" value={healthDay} onChange={(e) => selectHealthDay(e.target.value)} style={{ background: "transparent", border: "1px solid var(--line)", borderRadius: 8, padding: "6px 8px", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text)" }} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div>
          <div style={labelStyle}>Pasos</div>
          <input type="number" inputMode="numeric" value={steps} onChange={(e) => setSteps(e.target.value)} placeholder="0" style={inputStyle} />
        </div>
        <div>
          <div style={labelStyle}>Sueño (horas)</div>
          <input type="number" inputMode="decimal" value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} placeholder="0.0" style={inputStyle} />
        </div>
        <div>
          <div style={labelStyle}>Deporte</div>
          <input value={sportType} onChange={(e) => setSportType(e.target.value)} placeholder="Correr, bici, fútbol…" style={{ ...inputStyle, fontSize: 14 }} />
        </div>
        <div>
          <div style={labelStyle}>Minutos</div>
          <input type="number" inputMode="numeric" value={sportMinutes} onChange={(e) => setSportMinutes(e.target.value)} placeholder="0" style={inputStyle} />
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={labelStyle}>Notas</div>
        <textarea value={dailyNotes} onChange={(e) => setDailyNotes(e.target.value)} placeholder="Cómo te sentiste, molestias, hambre, energía…" rows={3} style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none", resize: "none" }} />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
        <Button disabled={savingDaily} onClick={saveDaily}>
          {savingDaily ? "Guardando…" : "Guardar"}
        </Button>
      </div>

      {selectedDaily?.coachNotes?.length ? (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
          <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, marginBottom: 8 }}>
            Feedback del coach
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {selectedDaily.coachNotes.slice(-3).map((n) => (
              <div key={n.id} style={{ padding: "10px 12px", background: "var(--bg)", border: "1px solid var(--line)", borderRadius: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{n.coach.name}</div>
                <div style={{ fontSize: 13, color: "var(--text)", marginTop: 2, whiteSpace: "pre-wrap" }}>{n.text}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
