"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Badge, Button, ConfirmModal, Icon, StateBlock } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";

interface CellData {
  pwwId: string;
  templateId: string;
  title: string;
  tags: string[];
  exerciseCount: number;
}

interface PlanDetail {
  id: string;
  title: string;
  goal: string | null;
  status: string;
  weeksCount: number;
  periodDays: number;
  notes: string | null;
  weeks: Array<{
    weekNumber: number;
    title: string | null;
    notes: string | null;
    workouts: Array<{
      id: string;
      sortOrder: number;
      workoutTemplate: { id: string; title: string; tags: string[]; exerciseCount: number };
    }>;
  }>;
  assignments: Array<{ id: string; client: { id: string; name: string | null; email: string } }>;
}

interface TemplateSummary { id: string; title: string; tags: string[]; exerciseCount: number }

const PHASE_COLORS = {
  accum:  { bg: "rgba(215,255,58,.1)",  b: "rgba(215,255,58,.3)",  t: "var(--lime)" },
  intens: { bg: "rgba(255,181,71,.1)",  b: "rgba(255,181,71,.3)",  t: "var(--warn)" },
  deload: { bg: "var(--bg-2)",          b: "var(--line-2)",        t: "var(--text-mute)" },
  test:   { bg: "rgba(122,184,255,.1)", b: "rgba(122,184,255,.3)", t: "var(--info)" },
} as const;

function getPhase(wi: number, total: number): keyof typeof PHASE_COLORS {
  const pct = wi / total;
  if (pct >= 0.875) return "test";
  if (pct >= 0.75)  return "deload";
  if (pct >= 0.375) return "intens";
  return "accum";
}

// ─── Template picker modal ────────────────────────────────────────────────────

function TemplatePicker({ onSelect, onClose }: {
  onSelect: (t: TemplateSummary) => void;
  onClose: () => void;
}) {
  const { api } = useAuth();
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api.get<{ id: string; title: string; tags: string[]; exerciseCount: number }[]>("/coach/workouts")
      .then(setTemplates).catch(console.error).finally(() => setLoading(false));
  }, [api]);

  const filtered = templates.filter((t) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "0 16px" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 460, maxHeight: "75vh", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div style={{ padding: "18px 20px 12px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>Seleccionar entrenamiento</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: 40, background: "var(--bg-2)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "0 12px" }}>
            <Icon name="search" size={14} color="var(--text-mute)" />
            <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar entrenamiento…"
              style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text)" }} />
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>Cargando…</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>Sin resultados</div>
          ) : filtered.map((t) => (
            <div key={t.id} onClick={() => onSelect(t)} className="ta-row"
              style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid var(--line)", cursor: "pointer" }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--bg-2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon name="dumbbell" size={16} color="var(--text-mute)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 1 }}>{t.exerciseCount} ejercicios{t.tags.length ? ` · ${t.tags.slice(0, 2).join(", ")}` : ""}</div>
              </div>
              <Icon name="plus" size={16} color="var(--text-mute)" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlanDetailPage() {
  const { api, user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { planId } = useParams<{ planId: string }>();
  const [plan, setPlan] = useState<PlanDetail | null>(null);
  const [grid, setGrid] = useState<Array<Array<CellData | null>>>([]);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [picker, setPicker] = useState<{ week: number; day: number } | null>(null);
  const [cellMenu, setCellMenu] = useState<{ week: number; day: number } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const [planTitle, setPlanTitle] = useState("");
  const [planGoal, setPlanGoal] = useState("");
  const [planNotes, setPlanNotes] = useState("");
  const [planWeeks, setPlanWeeks] = useState<string>("");
  const [weekMeta, setWeekMeta] = useState<Record<number, { title: string; notes: string }>>({});
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  const load = useCallback(() => {
    api.get<PlanDetail>(`/coach/plans/${planId}`)
      .then((p) => {
        setPlan(p);
        setPlanTitle(p.title);
        setPlanGoal(p.goal ?? "");
        setPlanNotes(p.notes ?? "");
        setPlanWeeks(String(p.weeksCount));
        const meta: Record<number, { title: string; notes: string }> = {};
        p.weeks.forEach((w) => { meta[w.weekNumber] = { title: w.title ?? "", notes: w.notes ?? "" }; });
        setWeekMeta(meta);
        const cols = p.periodDays ?? 7;
        const g: Array<Array<CellData | null>> = Array.from({ length: p.weeksCount }, (_, wi) => {
          const week = p.weeks?.find((w) => w.weekNumber === wi + 1);
          return Array.from({ length: cols }, (_, di) => {
            const pw = week?.workouts.find((w) => w.sortOrder === di);
            if (!pw) return null;
            return { pwwId: pw.id, templateId: pw.workoutTemplate.id, title: pw.workoutTemplate.title, tags: pw.workoutTemplate.tags, exerciseCount: pw.workoutTemplate.exerciseCount };
          });
        });
        setGrid(g);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api, planId]);

  useEffect(() => { load(); }, [load]);

  async function savePlanField(field: Record<string, unknown>) {
    try {
      await api.patch(`/coach/plans/${planId}`, field);
    } catch (e) { console.error(e); }
  }

  async function saveWeekMeta(weekNumber: number) {
    const meta = weekMeta[weekNumber] ?? { title: "", notes: "" };
    try {
      await api.patch(`/coach/plans/${planId}/weeks/${weekNumber}`, {
        title: meta.title || null,
        notes: meta.notes || null,
      });
    } catch (e) { console.error(e); }
  }

  async function togglePublish() {
    if (!plan) return;
    setPublishing(true);
    const next = plan.status === "published" ? "draft" : "published";
    try {
      await api.patch(`/coach/plans/${planId}`, { status: next });
      setPlan((p) => p ? { ...p, status: next } : p);
      toast.success(next === "published" ? "Plan publicado" : "Plan vuelto a borrador");
    } catch (e) { console.error(e); toast.error("No se pudo actualizar el plan"); }
    finally { setPublishing(false); }
  }

  function handleDelete() {
    if (!plan) return;
    setConfirmDialog({
      message: `¿Eliminar el plan "${plan.title}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setDeleting(true);
        try {
          await api.del(`/coach/plans/${planId}`);
          toast.success("Plan eliminado");
          router.replace("/coach/planes");
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Error al eliminar");
          setDeleting(false);
        }
      },
    });
  }

  async function handleCellSelect(template: TemplateSummary) {
    if (!picker) return;
    const { week, day } = picker;
    setPicker(null);
    const cell: CellData = { pwwId: "", templateId: template.id, title: template.title, tags: template.tags, exerciseCount: template.exerciseCount };
    // Optimistic update
    setGrid((prev) => prev.map((row, wi) => wi === week ? row.map((c, di) => di === day ? cell : c) : row));
    try {
      const res = await api.put<{ pwwId: string }>(`/coach/plans/${planId}/cell`, { weekNumber: week + 1, sortOrder: day, workoutTemplateId: template.id });
      setGrid((prev) => prev.map((row, wi) => wi === week ? row.map((c, di) => di === day ? { ...cell, pwwId: res.pwwId } : c) : row));
    } catch (e) {
      console.error(e);
      load(); // revert on error
    }
  }

  async function handleCellClear(week: number, day: number) {
    setCellMenu(null);
    setGrid((prev) => prev.map((row, wi) => wi === week ? row.map((c, di) => di === day ? null : c) : row));
    try {
      await api.del(`/coach/plans/${planId}/cell`, { weekNumber: week + 1, sortOrder: day });
    } catch (e) {
      console.error(e);
      load();
    }
  }

  if (loading) return <DesktopShell active="plans" coachName={user?.name ?? "Coach"}><StateBlock kind="loading" title="Cargando plan…" /></DesktopShell>;
  if (!plan)  return <DesktopShell active="plans" coachName={user?.name ?? "Coach"}><StateBlock kind="error" title="Plan no encontrado" /></DesktopShell>;

  const cols = plan.periodDays ?? 7;

  return (
    <>
      <DesktopShell
        active="plans"
        title={
          <span style={{ color: "var(--text-mute)", fontWeight: 500 }}>
            Planes <span style={{ margin: "0 8px" }}>/</span>
            <span style={{ color: "var(--text)", fontWeight: 700 }}>{planTitle || plan.title}</span>
          </span>
        }
        subtitle={`${plan.periodDays} días/sem · ${planWeeks || plan.weeksCount} semanas · ${plan.assignments?.length ?? 0} alumnos`}
        coachName={user?.name ?? "Coach"}
        actions={
          <>
            <Button variant="outline" size="sm" icon="chevL" onClick={() => router.push("/coach/planes")}>
              Planes
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={publishing}
              onClick={togglePublish}
              style={plan.status === "published" ? { color: "var(--lime)", borderColor: "var(--lime)" } : {}}
            >
              {plan.status === "published" ? "✓ Publicado" : "Publicar"}
            </Button>
            <Button variant="outline" size="sm" disabled={deleting} onClick={handleDelete}
              style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>
              {deleting ? "Eliminando…" : "Eliminar"}
            </Button>
          </>
        }
      >
        <div className="coach-pad">
          {/* Status banner */}
          {plan.status === "draft" && (
            <div style={{ padding: "10px 14px", background: "rgba(255,181,71,.1)", border: "1px solid rgba(255,181,71,.3)", borderRadius: 10, marginBottom: 16, fontSize: 13, color: "var(--warn)", display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="alert" size={14} color="var(--warn)" />
              Este plan está en borrador — los alumnos no pueden verlo hasta que lo publiques.
            </div>
          )}

          {/* Plan properties */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 10, marginBottom: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>Nombre del plan</span>
              <input
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                onBlur={() => savePlanField({ title: planTitle })}
                placeholder="Nombre del plan"
                style={{ height: 34, background: "var(--bg-1)", border: "1px solid var(--line-2)", borderRadius: 8, padding: "0 10px", fontSize: 13, fontWeight: 600, color: "var(--text)", outline: "none", width: "100%", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>Objetivo</span>
              <input
                value={planGoal}
                onChange={(e) => setPlanGoal(e.target.value)}
                onBlur={() => savePlanField({ goal: planGoal || null })}
                placeholder="Ej: Hipertrofia, fuerza…"
                style={{ height: 34, background: "var(--bg-1)", border: "1px solid var(--line-2)", borderRadius: 8, padding: "0 10px", fontSize: 13, color: "var(--text)", outline: "none", width: "100%", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>Semanas</span>
              <input
                type="number" min={1} max={52}
                value={planWeeks}
                onChange={(e) => setPlanWeeks(e.target.value)}
                onBlur={() => {
                  const n = parseInt(planWeeks);
                  if (!isNaN(n) && n > 0) savePlanField({ weeksCount: n });
                }}
                style={{ height: 34, width: 64, background: "var(--bg-1)", border: "1px solid var(--line-2)", borderRadius: 8, padding: "0 10px", fontSize: 13, fontFamily: "var(--font-mono)", fontWeight: 700, color: "var(--text)", outline: "none", textAlign: "center", boxSizing: "border-box" }}
              />
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 3 }}>
              <span style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".04em" }}>Aclaraciones / notas del plan</span>
              <textarea
                value={planNotes}
                onChange={(e) => setPlanNotes(e.target.value)}
                onBlur={() => savePlanField({ notes: planNotes || null })}
                placeholder="Notas generales para el alumno sobre este plan…"
                rows={2}
                style={{ background: "var(--bg-1)", border: "1px solid var(--line-2)", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "var(--text)", lineHeight: 1.45, resize: "vertical", outline: "none", width: "100%", boxSizing: "border-box", fontFamily: "var(--font-sans)" }}
              />
            </div>
          </div>

          {/* Phase legend */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16, fontSize: 11, color: "var(--text-mute)", flexWrap: "wrap" }}>
            {Object.entries({ accum: "Acumulación", intens: "Intensificación", deload: "Deload", test: "Test" }).map(([key, label]) => {
              const c = PHASE_COLORS[key as keyof typeof PHASE_COLORS];
              return (
                <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: c.t, opacity: 0.8 }} />
                  {label}
                </div>
              );
            })}
            <div style={{ flex: 1 }} />
            <div style={{ fontSize: 11, color: "var(--text-mute)" }}>
              Hacé click en una celda vacía para asignar un workout
            </div>
          </div>

          {/* Scrollable grid */}
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: cols * 110 + 80 }}>
              {/* Header */}
              <div style={{ display: "grid", gridTemplateColumns: `80px repeat(${cols}, 1fr)`, gap: 6, marginBottom: 6 }}>
                <div />
                {Array.from({ length: cols }, (_, i) => (
                  <div key={i} className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", textAlign: "center", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 600, padding: "6px 0" }}>
                    D{i + 1}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {grid.map((week, wi) => {
                const phase = getPhase(wi, plan.weeksCount);
                const phaseLabel = { accum: "Acum.", intens: "Intens.", deload: "Deload", test: "Test" }[phase];
                const colors = PHASE_COLORS[phase];

                return (
                  <div key={wi} style={{ display: "grid", gridTemplateColumns: `80px repeat(${cols}, 1fr)`, gap: 6, marginBottom: 6 }}>
                    {/* Week label — click to expand */}
                    <div>
                      <button
                        onClick={() => setExpandedWeek(expandedWeek === wi + 1 ? null : wi + 1)}
                        style={{
                          width: "100%", padding: "8px 10px", background: expandedWeek === wi + 1 ? "var(--bg-2)" : "var(--bg-1)",
                          border: "1px solid var(--line)", borderRadius: expandedWeek === wi + 1 ? "8px 8px 0 0" : 8,
                          display: "flex", flexDirection: "column", gap: 2, justifyContent: "center", cursor: "pointer", textAlign: "left",
                        }}
                      >
                        <span className="ta-mono" style={{ color: "var(--text-mute)", fontSize: 10 }}>S{wi + 1}</span>
                        <span style={{ fontSize: 11, color: weekMeta[wi + 1]?.title ? "var(--text)" : "var(--text-mute)", fontWeight: weekMeta[wi + 1]?.title ? 600 : 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {weekMeta[wi + 1]?.title || phaseLabel}
                        </span>
                      </button>
                      {expandedWeek === wi + 1 && (
                        <div style={{ background: "var(--bg-2)", border: "1px solid var(--line)", borderTop: "none", borderRadius: "0 0 8px 8px", padding: "6px 8px", display: "flex", flexDirection: "column", gap: 4 }}>
                          <input
                            value={weekMeta[wi + 1]?.title ?? ""}
                            onChange={(e) => setWeekMeta((m) => ({ ...m, [wi + 1]: { ...(m[wi + 1] ?? { title: "", notes: "" }), title: e.target.value } }))}
                            onBlur={() => saveWeekMeta(wi + 1)}
                            placeholder="Título semana…"
                            style={{ width: "100%", background: "var(--bg-1)", border: "1px solid var(--line-2)", borderRadius: 6, padding: "4px 7px", fontSize: 11, color: "var(--text)", outline: "none", boxSizing: "border-box" }}
                          />
                          <textarea
                            value={weekMeta[wi + 1]?.notes ?? ""}
                            onChange={(e) => setWeekMeta((m) => ({ ...m, [wi + 1]: { ...(m[wi + 1] ?? { title: "", notes: "" }), notes: e.target.value } }))}
                            onBlur={() => saveWeekMeta(wi + 1)}
                            placeholder="Notas…"
                            rows={2}
                            style={{ width: "100%", background: "var(--bg-1)", border: "1px solid var(--line-2)", borderRadius: 6, padding: "4px 7px", fontSize: 10, color: "var(--text)", lineHeight: 1.4, resize: "none", outline: "none", boxSizing: "border-box", fontFamily: "var(--font-sans)" }}
                          />
                        </div>
                      )}
                    </div>

                    {week.map((cell, di) => {
                      const isMenuOpen = cellMenu?.week === wi && cellMenu?.day === di;

                      if (!cell) {
                        return (
                          <div
                            key={di}
                            onClick={() => setPicker({ week: wi, day: di })}
                            style={{ height: 52, background: "var(--bg)", border: "1px dashed var(--line)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "border-color .12s, background .12s" }}
                            className="ta-row"
                            title="Asignar workout"
                          >
                            <Icon name="plus" size={14} color="var(--text-dim)" />
                          </div>
                        );
                      }

                      return (
                        <div key={di} style={{ position: "relative" }}>
                          <div
                            onClick={() => setCellMenu(isMenuOpen ? null : { week: wi, day: di })}
                            style={{ height: 52, padding: "6px 8px", borderRadius: 8, background: colors.bg, border: `1px solid ${colors.b}`, display: "flex", flexDirection: "column", justifyContent: "center", gap: 2, cursor: "pointer" }}
                          >
                            <div style={{ fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cell.title}</div>
                            <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)" }}>{cell.exerciseCount} ej</div>
                          </div>

                          {isMenuOpen && (
                            <>
                              <div style={{ position: "fixed", inset: 0, zIndex: 99 }} onClick={() => setCellMenu(null)} />
                              <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, minWidth: 160, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 10, boxShadow: "var(--shadow-md)", zIndex: 100, overflow: "hidden" }}>
                                <button
                                  onClick={() => { setCellMenu(null); router.push(`/coach/workouts/${cell.templateId}`); }}
                                  style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: 13, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}
                                  className="ta-row"
                                >
                                  <Icon name="edit" size={13} /> Ver / editar
                                </button>
                                <button
                                  onClick={() => setPicker({ week: wi, day: di })}
                                  style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: 13, color: "var(--text)", display: "flex", alignItems: "center", gap: 8 }}
                                  className="ta-row"
                                >
                                  <Icon name="reset" size={13} /> Cambiar workout
                                </button>
                                <button
                                  onClick={() => handleCellClear(wi, di)}
                                  style={{ width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer", textAlign: "left", fontSize: 13, color: "var(--danger)", display: "flex", alignItems: "center", gap: 8, borderTop: "1px solid var(--line)" }}
                                  className="ta-row"
                                >
                                  <Icon name="trash" size={13} color="var(--danger)" /> Quitar
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DesktopShell>

      {picker && (
        <TemplatePicker
          onSelect={handleCellSelect}
          onClose={() => setPicker(null)}
        />
      )}
      {confirmDialog && (
        <ConfirmModal
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </>
  );
}
