"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Button, Icon, Input, ConfirmModal } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";

type ClassItem = {
  id: string;
  name: string;
  description: string | null;
  workoutTemplate: { id: string; title: string; type: string };
  group: { id: string; name: string } | null;
  scheduledAt: string;
  durationMinutes: number;
  status: string;
  sessionCount: number;
};

type GroupOption = { id: string; name: string };
type TemplateOption = { id: string; title: string };

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Programada",
  in_progress: "En curso",
  completed: "Completada",
  cancelled: "Cancelada",
};

const STATUS_COLOR: Record<string, string> = {
  scheduled: "var(--text-mute)",
  in_progress: "var(--lime)",
  completed: "var(--success)",
  cancelled: "var(--danger)",
};

export default function GymClasesPage() {
  const { api, user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [workoutTemplateId, setWorkoutTemplateId] = useState("");
  const [groupId, setGroupId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("60");
  const [saving, setSaving] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  function load() {
    api.get<ClassItem[]>("/gym/classes").then(setClasses).catch(() => toast.error("No se pudieron cargar las clases")).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    api.get<GroupOption[]>("/coach/groups").then(setGroups).catch(() => {});
    api.get<TemplateOption[]>("/coach/workouts").then(setTemplates).catch(() => {});
  }, [api]);

  async function handleCreate() {
    if (!name.trim() || !workoutTemplateId) return toast.error("Nombre y entrenamiento requeridos");
    setSaving(true);
    try {
      await api.post("/gym/classes", {
        name: name.trim(),
        workoutTemplateId,
        groupId: groupId || null,
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString(),
        durationMinutes: parseInt(durationMinutes, 10) || 60,
      });
      toast.success("Clase creada");
      setShowForm(false);
      setName("");
      setWorkoutTemplateId("");
      setGroupId("");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al crear");
    } finally {
      setSaving(false);
    }
  }

  async function setStatus(classId: string, status: string) {
    try {
      await api.patch(`/gym/classes/${classId}`, { status });
      load();
    } catch {
      toast.error("No se pudo actualizar");
    }
  }

  function handleDelete(classId: string, className: string) {
    setConfirmDialog({
      message: `¿Eliminar la clase "${className}"?`,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await api.del(`/gym/classes/${classId}`);
          toast.success("Clase eliminada");
          load();
        } catch {
          toast.error("No se pudo eliminar");
        }
      },
    });
  }

  return (
    <>
      <DesktopShell active="classes" coachName={user?.name ?? "Gym"}>
        <div style={{ padding: "24px 20px", maxWidth: 900 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>Clases</div>
              <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>Programá clases grupales</div>
            </div>
            <Button icon="plus" onClick={() => setShowForm(true)}>Nueva clase</Button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-mute)" }}>Cargando…</div>
          ) : classes.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "var(--text-mute)" }}>
              <Icon name="calendar" size={32} color="var(--text-dim)" />
              <div style={{ marginTop: 12 }}>Sin clases. Creá una para empezar.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {classes.map((c) => (
                <div key={c.id} style={{ border: "1px solid var(--line)", borderRadius: 14, background: "var(--bg-1)", padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 700 }}>{c.name}</span>
                        <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "var(--bg-2)", color: STATUS_COLOR[c.status] || "var(--text-mute)", fontWeight: 600 }}>
                          {STATUS_LABEL[c.status] || c.status}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: "var(--text-mute)", marginTop: 4 }}>
                        {new Date(c.scheduledAt).toLocaleString("es", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                        {" · "}{c.durationMinutes}min
                        {" · "}{c.workoutTemplate.title}
                        {c.group ? ` · Grupo: ${c.group.name}` : ""}
                        {c.sessionCount > 0 ? ` · ${c.sessionCount} alumnos` : ""}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {c.status === "scheduled" && (
                        <>
                          <Button variant="outline" size="sm" icon="play" onClick={() => setStatus(c.id, "in_progress")}>Empezar</Button>
                          <Button variant="outline" size="sm" icon="eye" onClick={() => router.push(`/gym/tele/${c.id}`)}>Modo tele</Button>
                        </>
                      )}
                      {c.status === "in_progress" && (
                        <>
                          <Button variant="outline" size="sm" icon="eye" onClick={() => router.push(`/gym/tele/${c.id}`)} style={{ color: "var(--lime)", borderColor: "var(--lime)" }}>
                            En vivo
                          </Button>
                          <Button variant="outline" size="sm" icon="check" onClick={() => setStatus(c.id, "completed")}>Finalizar</Button>
                        </>
                      )}
                      {c.status === "completed" && (
                        <Button variant="outline" size="sm" disabled style={{ opacity: 0.4 }}>Completada</Button>
                      )}
                      <Button variant="outline" size="sm" icon="x" onClick={() => handleDelete(c.id, c.name)} style={{ color: "var(--danger)", borderColor: "var(--danger)" }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DesktopShell>

      {showForm && (
        <div onClick={() => setShowForm(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "0 16px" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 440, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 16, padding: 24, maxHeight: "90vh", overflowY: "auto" }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Nueva clase</div>

            <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Funcional Lunes 9am" autoFocus />

            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-mute)", display: "block", marginBottom: 6 }}>Entrenamiento</label>
              <select
                value={workoutTemplateId}
                onChange={(e) => setWorkoutTemplateId(e.target.value)}
                style={{ width: "100%", height: 42, borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--line-2)", color: workoutTemplateId ? "var(--text)" : "var(--text-mute)", fontSize: 13, padding: "0 12px", outline: "none" }}
              >
                <option value="">Seleccionar entrenamiento</option>
                {templates.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>

            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-mute)", display: "block", marginBottom: 6 }}>Grupo (opcional)</label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                style={{ width: "100%", height: 42, borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--line-2)", color: groupId ? "var(--text)" : "var(--text-mute)", fontSize: 13, padding: "0 12px", outline: "none" }}
              >
                <option value="">Sin grupo</option>
                {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
              <Input label="Fecha y hora" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
              <Input label="Duración (min)" type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} />
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <Button variant="secondary" onClick={() => setShowForm(false)} disabled={saving}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={saving || !name.trim() || !workoutTemplateId}>
                {saving ? "Creando…" : "Crear clase"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmDialog && (
        <ConfirmModal message={confirmDialog.message} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog(null)} />
      )}
    </>
  );
}
