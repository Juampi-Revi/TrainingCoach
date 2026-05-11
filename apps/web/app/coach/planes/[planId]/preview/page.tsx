"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Badge, Button, Icon, StateBlock } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";
import type { ClientWeekResponse } from "@regen/types";
import type { PlanDetail } from "../_components/types";
import { PlanProgressionNoteModal } from "../_components/plan-progression-note-modal";

export default function PlanPreviewPage() {
  const { api, user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { planId } = useParams<{ planId: string }>();
  const [weekNumber, setWeekNumber] = useState(1);
  const [clientUserId, setClientUserId] = useState<string>("");
  const [planMeta, setPlanMeta] = useState<Pick<PlanDetail, "title" | "assignments" | "weeksCount"> | null>(null);
  const [data, setData] = useState<ClientWeekResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteOpen, setNoteOpen] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [notePwwId, setNotePwwId] = useState<string | null>(null);
  const [noteWorkoutTitle, setNoteWorkoutTitle] = useState("");
  const [noteValue, setNoteValue] = useState("");
  useEffect(() => {
    api
      .get<PlanDetail>(`/coach/plans/${planId}`)
      .then((p) => setPlanMeta({ title: p.title, assignments: p.assignments, weeksCount: p.weeksCount }))
      .catch(() => setPlanMeta(null));
  }, [api, planId]);
  useEffect(() => {
    const qs = new URLSearchParams({ weekNumber: String(weekNumber) });
    if (clientUserId) qs.set("clientUserId", clientUserId);

    api
      .get<ClientWeekResponse>(`/coach/plans/${planId}/preview?${qs.toString()}`)
      .then(setData)
      .catch((e: unknown) => {
        toast.error(e instanceof Error ? e.message : "No se pudo cargar el preview");
        setData(null);
      })
      .finally(() => setLoading(false));
  }, [api, clientUserId, planId, toast, weekNumber]);

  const totalWeeks = data?.totalWeeks ?? 1;
  const workouts = data?.workouts ?? [];

  const title = useMemo(() => {
    const planTitle = data?.plan?.title ?? planMeta?.title ?? "Plan";
    return (
      <span style={{ color: "var(--text-mute)", fontWeight: 500 }}>
        Planes <span style={{ margin: "0 8px" }}>/</span>
        <span style={{ color: "var(--text)", fontWeight: 700 }}>{planTitle}</span>
        <span style={{ margin: "0 8px" }}>/</span>
        <span style={{ color: "var(--text)", fontWeight: 700 }}>Vista alumno</span>
      </span>
    );
  }, [data?.plan?.title, planMeta?.title]);

  const today = workouts.find((w) => !w.session || w.session.status === "in_progress") ?? null;
  const remaining = workouts.filter((w) => w !== today);
  const pending = remaining.filter((w) => w.session?.status !== "completed");
  const completed = remaining.filter((w) => w.session?.status === "completed");

  function openNote(args: { pwwId: string; workoutTitle: string; value: string | null }) {
    setNotePwwId(args.pwwId);
    setNoteWorkoutTitle(args.workoutTitle);
    setNoteValue(args.value ?? "");
    setNoteOpen(true);
  }

  async function saveNote() {
    if (!notePwwId) return;
    setNoteSaving(true);
    try {
      const trimmed = noteValue.trim();
      const res = await api.patch<{ pwwId: string; progressionNote: string | null }>(`/coach/plans/${planId}/cell`, {
        pwwId: notePwwId,
        progressionNote: trimmed ? trimmed : null,
      });
      setData((prev) => {
        if (!prev) return prev;
        return { ...prev, workouts: prev.workouts.map((w) => (w.pwwId === res.pwwId ? { ...w, progressionNote: res.progressionNote } : w)) };
      });
      setNoteOpen(false);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar la nota");
    } finally {
      setNoteSaving(false);
    }
  }
  return (
    <DesktopShell
      active="plans"
      title={title}
      subtitle={`Semana ${data?.weekNumber ?? weekNumber} / ${totalWeeks}`}
      coachName={user?.name ?? "Coach"}
      actions={
        <>
          <Button variant="outline" size="sm" icon="chevL" onClick={() => router.push(`/coach/planes/${planId}`)}>
            Editar plan
          </Button>
        </>
      }
    >
      <div className="coach-pad">
        <PlanProgressionNoteModal
          open={noteOpen}
          workoutTitle={noteWorkoutTitle}
          value={noteValue}
          saving={noteSaving}
          onChange={setNoteValue}
          onClose={() => setNoteOpen(false)}
          onSave={saveNote}
        />

        {loading ? (
          <StateBlock kind="loading" title="Cargando vista alumno…" />
        ) : !data?.plan ? (
          <StateBlock kind="error" title="No se pudo cargar el plan" />
        ) : (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
                marginBottom: 14,
              }}
            >
              <div>
                <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 600 }}>
                  Semana
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em", marginTop: 2 }}>
                  {data.weekNumber} <span style={{ color: "var(--text-mute)", fontWeight: 500 }}>/ {totalWeeks}</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)" }}>
                    Alumno
                  </div>
                  <select
                    value={clientUserId}
                    onChange={(e) => {
                      setLoading(true);
                      setClientUserId(e.target.value);
                    }}
                    style={{
                      height: 34,
                      minWidth: 220,
                      background: "var(--bg-1)",
                      border: "1px solid var(--line-2)",
                      borderRadius: 10,
                      padding: "0 10px",
                      fontSize: 13,
                      color: "var(--text)",
                      outline: "none",
                    }}
                  >
                    <option value="">Sin alumno</option>
                    {(planMeta?.assignments ?? []).map((a) => (
                      <option key={a.client.id} value={a.client.id}>
                        {a.client.displayName?.trim() || a.client.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)" }}>
                    Semana a previsualizar
                  </div>
                  <select
                    value={weekNumber}
                    onChange={(e) => {
                      setLoading(true);
                      setWeekNumber(parseInt(e.target.value));
                    }}
                    style={{
                      height: 34,
                      background: "var(--bg-1)",
                      border: "1px solid var(--line-2)",
                      borderRadius: 10,
                      padding: "0 10px",
                      fontSize: 13,
                      color: "var(--text)",
                      outline: "none",
                    }}
                  >
                    {Array.from({ length: totalWeeks }, (_, i) => i + 1).map((w) => (
                      <option key={w} value={w}>
                        Semana {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {!clientUserId && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "var(--bg-1)",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  marginBottom: 14,
                  color: "var(--text-mute)",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Icon name="info" size={14} color="var(--text-mute)" />
                Para ver “pendientes / completadas”, elegí un alumno con el plan asignado.
              </div>
            )}

            {workouts.length === 0 ? (
              <StateBlock kind="empty" title="Semana sin entrenos" body="Asigná workouts en el plan para verlos acá." />
            ) : (
              <>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-mute)",
                    textTransform: "uppercase",
                    letterSpacing: ".1em",
                    fontWeight: 600,
                    marginBottom: 10,
                  }}
                >
                  Próximo entreno
                </div>

                <div style={{ marginBottom: 10 }}>
                  {today ? (
                    <div
                      style={{
                        padding: 18,
                        borderRadius: 14,
                        background: "var(--lime)",
                        color: "var(--bg)",
                      }}
                    >
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", opacity: 0.7 }}>
                        HOY
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-.02em", marginTop: 2 }}>
                        {today.title}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 500, opacity: 0.8, marginTop: 6 }}>
                        {today.description ?? (today.tags.length ? today.tags.join(" · ") : "Sin descripción")} · {today.exerciseCount} ej
                      </div>
                      {today.progressionNote && (
                        <div style={{ fontSize: 12, fontWeight: 700, marginTop: 8, color: "rgba(11,11,12,.8)" }}>
                          {today.progressionNote}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
                        <Button
                          size="sm"
                          icon="edit"
                          onClick={() => router.push(`/coach/workouts/${today.workoutTemplateId}`)}
                          style={{ background: "var(--bg)", color: "var(--lime)" }}
                        >
                          Ver / editar
                        </Button>
                        {today.pwwId && (
                          <Button size="sm" variant="outline" onClick={() => openNote({ pwwId: today.pwwId, workoutTitle: today.title, value: today.progressionNote })}>
                            Nota
                          </Button>
                        )}
                        {today.session?.status === "completed" && (
                          <Badge tone="neutral" style={{ background: "rgba(11,11,12,.2)", borderColor: "rgba(11,11,12,.3)", color: "var(--bg)" }}>
                            Completado
                          </Badge>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: 18,
                        borderRadius: 14,
                        background: "var(--bg-1)",
                        border: "1px solid var(--line)",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: 15, fontWeight: 600 }}>Semana completada</div>
                      <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 4 }}>
                        No hay más entrenos para esta semana
                      </div>
                    </div>
                  )}
                </div>

                {pending.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, margin: "16px 0 10px" }}>
                      Pendientes
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                      {pending.map((w) => (
                        <div
                          key={`${w.workoutTemplateId}-p`}
                          style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {w.title}
                              </div>
                              <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
                                {w.description ?? (w.tags.length ? w.tags.join(" · ") : "Sin descripción")} · {w.exerciseCount} ej
                              </div>
                              {w.progressionNote && (
                                <div className="ta-ellipsis" style={{ fontSize: 12, color: "var(--accent-text)", marginTop: 4, fontWeight: 700 }}>
                                  {w.progressionNote}
                                </div>
                              )}
                            </div>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--bg-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Icon name="dumbbell" size={16} color="var(--text-mute)" />
                            </div>
                          </div>
                          <Button variant="outline" size="sm" icon="edit" onClick={() => router.push(`/coach/workouts/${w.workoutTemplateId}`)}>
                            Ver / editar
                          </Button>
                          {w.pwwId && (
                            <Button variant="outline" size="sm" onClick={() => openNote({ pwwId: w.pwwId, workoutTitle: w.title, value: w.progressionNote })}>
                              Nota
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {completed.length > 0 && (
                  <>
                    <div style={{ fontSize: 11, color: "var(--text-mute)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700, margin: "16px 0 10px" }}>
                      Completadas
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
                      {completed.map((w) => (
                        <div
                          key={`${w.workoutTemplateId}-c`}
                          style={{ background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 10, opacity: 0.75 }}
                        >
                          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {w.title}
                              </div>
                              <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
                                Completado {w.session?.performedAt ? `· ${new Date(w.session.performedAt).toLocaleDateString()}` : ""}
                              </div>
                              {w.progressionNote && (
                                <div className="ta-ellipsis" style={{ fontSize: 12, color: "var(--accent-text)", marginTop: 4, fontWeight: 700 }}>
                                  {w.progressionNote}
                                </div>
                              )}
                            </div>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--bg-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <Icon name="check" size={16} color="var(--lime)" />
                            </div>
                          </div>
                          <Button variant="outline" size="sm" icon="edit" onClick={() => router.push(`/coach/workouts/${w.workoutTemplateId}`)}>
                            Ver / editar
                          </Button>
                          {w.pwwId && (
                            <Button variant="outline" size="sm" onClick={() => openNote({ pwwId: w.pwwId, workoutTitle: w.title, value: w.progressionNote })}>
                              Nota
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </>
        )}
      </div>
    </DesktopShell>
  );
}
