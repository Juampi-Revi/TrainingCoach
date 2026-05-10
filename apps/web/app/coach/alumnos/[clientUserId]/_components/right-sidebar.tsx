"use client";

import { Badge, Button, Card, Progress } from "@/components/ui";
import type { ClientDetail, CoachNote } from "./_types";

interface RightSidebarProps {
  client: ClientDetail;
  tab: string;
  noteDay: string;
  setNoteDay: (day: string) => void;
  noteText: string;
  setNoteText: (text: string) => void;
  savingNote: boolean;
  onSaveNote: () => void;
  notesForDay: CoachNote[];
}

export function RightSidebar({
  client, tab, noteDay, setNoteDay, noteText, setNoteText, savingNote, onSaveNote, notesForDay,
}: RightSidebarProps) {
  const weightData = client.weightHistory ?? [];
  const latestWeight = weightData[0]?.weight;
  const prevWeight = weightData[1]?.weight;
  const weightDiff = latestWeight && prevWeight ? (latestWeight - prevWeight).toFixed(1) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {tab === "Actividad" && (
        <Card pad={16}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Nota del coach</div>
          <div style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "center" }}>
            <input
              type="date"
              value={noteDay}
              onChange={(e) => setNoteDay(e.target.value)}
              style={{ background: "transparent", border: "1px solid var(--line)", borderRadius: 10, padding: "8px 10px", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text)", width: 160 }}
            />
            <Button
              size="sm"
              disabled={savingNote || !noteText.trim()}
              onClick={onSaveNote}
            >
              {savingNote ? "Guardando…" : "Guardar"}
            </Button>
          </div>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            rows={4}
            placeholder="Feedback, ajustes, observaciones…"
            style={{ width: "100%", background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 12, padding: "10px 12px", fontSize: 14, color: "var(--text)", outline: "none", resize: "none" }}
          />
          {notesForDay.length ? (
            <div style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".08em", fontWeight: 700, marginBottom: 8 }}>
                Notas ({notesForDay.length})
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {notesForDay.map((n) => (
                  <div key={n.id} style={{ padding: "10px 12px", borderRadius: 12, background: "var(--bg)", border: "1px solid var(--line)" }}>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{n.coach.name}</div>
                    <div style={{ fontSize: 13, marginTop: 2, whiteSpace: "pre-wrap" }}>{n.text}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </Card>
      )}

      {client.assignment?.plan && (
        <Card pad={16}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Plan activo</div>
            {client.assignment.weekNumber != null && (
              <Badge tone="limeSoft">
                S{client.assignment.weekNumber}/{client.assignment.plan.weeksCount}
              </Badge>
            )}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.01em" }}>
            {client.assignment.plan.title}
          </div>
          {client.assignment.weekNumber != null && (
            <>
              <Progress
                value={client.assignment.weekNumber}
                total={client.assignment.plan.weeksCount}
                style={{ marginTop: 14 }}
              />
              <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", marginTop: 6 }}>
                Semana {client.assignment.weekNumber} de {client.assignment.plan.weeksCount}
              </div>
            </>
          )}
        </Card>
      )}

      {weightData.length > 0 && (
        <Card pad={16}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Peso corporal</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <span className="ta-mono" style={{ fontSize: 24, fontWeight: 600 }}>{latestWeight}</span>
            <span style={{ fontSize: 12, color: "var(--text-mute)" }}>kg</span>
            {weightDiff && (
              <span style={{ fontSize: 12, color: Number(weightDiff) < 0 ? "var(--danger)" : "var(--success)", marginLeft: 4 }}>
                {Number(weightDiff) > 0 ? "+" : ""}{weightDiff}kg
              </span>
            )}
          </div>
          {weightData.length > 1 && (
            <svg width="100%" height="48" viewBox="0 0 200 48" style={{ marginTop: 10 }} preserveAspectRatio="none">
              {weightData
                .slice(0, 10)
                .reverse()
                .map((w, i, arr) => {
                  const min = Math.min(...arr.map((x) => x.weight));
                  const max = Math.max(...arr.map((x) => x.weight));
                  const range = max - min || 1;
                  const x = (i / (arr.length - 1)) * 200;
                  const y = 48 - (((w.weight - min) / range) * 32 + 8);
                  if (i === 0) return null;
                  const px = ((i - 1) / (arr.length - 1)) * 200;
                  const py = 48 - (((arr[i - 1].weight - min) / range) * 32 + 8);
                  return (
                    <line
                      key={i}
                      x1={px} y1={py} x2={x} y2={y}
                      stroke="var(--lime)" strokeWidth="1.5" strokeLinecap="round"
                    />
                  );
                })}
            </svg>
          )}
        </Card>
      )}
    </div>
  );
}
