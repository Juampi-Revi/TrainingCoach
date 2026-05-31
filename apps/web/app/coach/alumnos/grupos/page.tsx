"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Button, Icon, Input, ConfirmModal } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";
import type { CoachClientSummary } from "@regen/types";

type GroupMember = { id: string; name: string; email: string };
type GroupItem = {
  id: string;
  name: string;
  level: string | null;
  tags: string[];
  memberCount: number;
  members: GroupMember[];
};

export default function GruposPage() {
  const { api, user } = useAuth();
  const toast = useToast();
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<CoachClientSummary[]>([]);

  const [editing, setEditing] = useState<GroupItem | null>(null);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [saving, setSaving] = useState(false);
  const [showAddMember, setShowAddMember] = useState<string | null>(null);
  const [addingMember, setAddingMember] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  const load = useCallback(() => {
    api
      .get<GroupItem[]>("/coach/groups")
      .then(setGroups)
      .catch(() => toast.error("No se pudieron cargar los grupos"))
      .finally(() => setLoading(false));
  }, [api, toast]);

  useEffect(() => {
    const t = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    api
      .get<CoachClientSummary[]>("/coach/clients")
      .then(setClients)
      .catch(() => {});
  }, [api]);

  function startCreate() {
    setEditing({ id: "", name: "", level: null, tags: [], memberCount: 0, members: [] });
    setName("");
    setLevel("");
  }

  function startEdit(g: GroupItem) {
    setEditing(g);
    setName(g.name);
    setLevel(g.level ?? "");
  }

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed) { toast.error("Nombre requerido"); return; }
    setSaving(true);
    try {
      if (editing?.id) {
        await api.patch(`/coach/groups/${editing.id}`, { name: trimmed, level: level || null });
      } else {
        await api.post("/coach/groups", { name: trimmed, level: level || null });
      }
      toast.success(editing?.id ? "Grupo actualizado" : "Grupo creado");
      setEditing(null);
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(groupId: string, groupName: string) {
    setConfirmDialog({
      message: `¿Eliminar el grupo "${groupName}"? Los alumnos no se eliminan, solo se desagrupan.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        try {
          await api.del(`/coach/groups/${groupId}`);
          toast.success("Grupo eliminado");
          load();
        } catch {
          toast.error("No se pudo eliminar");
        }
      },
    });
  }

  async function addMember(groupId: string, clientUserId: string) {
    setAddingMember(true);
    try {
      await api.post(`/coach/groups/${groupId}/members`, { clientUserId });
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al agregar alumno");
    } finally {
      setAddingMember(false);
    }
  }

  async function removeMember(groupId: string, clientUserId: string) {
    try {
      await api.del(`/coach/groups/${groupId}/members/${clientUserId}`);
      load();
    } catch {
      toast.error("No se pudo quitar al alumno");
    }
  }

  const coachName = user?.name ?? "Coach";

  return (
    <>
      <DesktopShell active="athletes" coachName={coachName} title="Grupos de alumnos">
        <div style={{ padding: "24px 20px", maxWidth: 800 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-.02em" }}>Grupos</div>
              <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
                Organizá a tus alumnos por nivel o categoría
              </div>
            </div>
            <Button icon="plus" onClick={startCreate}>Nuevo grupo</Button>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: "var(--text-mute)" }}>Cargando…</div>
          ) : groups.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "var(--text-mute)" }}>
              <Icon name="users" size={32} color="var(--text-dim)" />
              <div style={{ marginTop: 12 }}>Sin grupos. Creá uno para organizar alumnos.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {groups.map((g) => (
                <div
                  key={g.id}
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: 14,
                    background: "var(--bg-1)",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 700 }}>{g.name}</span>
                        {g.level && (
                          <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 999, background: "rgba(215,255,58,.12)", color: "var(--lime)", fontWeight: 600 }}>
                            {g.level === "beginner" ? "Principiante" : g.level === "intermediate" ? "Intermedio" : g.level === "advanced" ? "Avanzado" : g.level}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>{g.memberCount} alumno{g.memberCount !== 1 ? "s" : ""}</div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Button variant="outline" size="sm" icon="plus" onClick={() => setShowAddMember(g.id)}>
                        Agregar
                      </Button>
                      <Button variant="outline" size="sm" icon="edit" onClick={() => startEdit(g)} />
                      <Button variant="outline" size="sm" icon="x" onClick={() => handleDelete(g.id, g.name)} style={{ color: "var(--danger)", borderColor: "var(--danger)" }} />
                    </div>
                  </div>

                  {showAddMember === g.id && (
                    <div style={{ padding: "0 16px 12px", borderTop: "1px solid var(--line)", paddingTop: 12 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                        {clients
                          .filter((c) => !g.members.some((m) => m.id === c.id))
                          .slice(0, 12)
                          .map((c) => (
                            <button
                              key={c.id}
                              disabled={addingMember}
                              onClick={() => addMember(g.id, c.id)}
                              style={{
                                padding: "8px 12px",
                                borderRadius: 10,
                                border: "1px solid var(--line-2)",
                                background: "var(--bg-2)",
                                cursor: "pointer",
                                textAlign: "left",
                                fontSize: 13,
                                fontWeight: 600,
                                color: "var(--text)",
                              }}
                            >
                              <div className="ta-ellipsis">{c.name ?? c.email}</div>
                            </button>
                          ))}
                      </div>
                      <Button variant="secondary" size="sm" onClick={() => setShowAddMember(null)} style={{ marginTop: 8 }}>
                        Cerrar
                      </Button>
                    </div>
                  )}

                  {g.members.length > 0 && (
                    <div style={{ padding: "0 16px 12px", display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {g.members.map((m) => (
                        <span
                          key={m.id}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            padding: "4px 8px 4px 12px",
                            borderRadius: 999,
                            background: "var(--bg-2)",
                            border: "1px solid var(--line-2)",
                            fontSize: 12,
                            fontWeight: 500,
                          }}
                        >
                          {m.name}
                          <button
                            onClick={() => removeMember(g.id, m.id)}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-dim)", display: "flex", padding: 0 }}
                          >
                            <Icon name="x" size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DesktopShell>

      {editing && (
        <div
          onClick={() => setEditing(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "0 16px" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 400, background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 16, padding: 24 }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>{editing.id ? "Editar grupo" : "Nuevo grupo"}</div>

            <Input label="Nombre" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Principiantes" autoFocus />

            <div style={{ marginTop: 12 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-mute)", display: "block", marginBottom: 6 }}>Nivel</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                style={{
                  width: "100%", height: 42, borderRadius: 10, background: "var(--bg-2)", border: "1px solid var(--line-2)",
                  color: level ? "var(--text)" : "var(--text-mute)", fontSize: 13, padding: "0 12px", outline: "none",
                }}
              >
                <option value="">Sin nivel</option>
                <option value="beginner">Principiante</option>
                <option value="intermediate">Intermedio</option>
                <option value="advanced">Avanzado</option>
              </select>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <Button variant="secondary" onClick={() => setEditing(null)} disabled={saving}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving || !name.trim()}>
                {saving ? "Guardando…" : editing.id ? "Guardar" : "Crear"}
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
