"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Button, ConfirmModal, Icon, Input } from "@/components/ui";
import { blockTypeLabel, blockSummary } from "@/lib/constants";
import type { WB } from "./_types";

export function BlockModal({ templateId, block, onClose, onSaved, onDeleted }: {
  templateId: string;
  block: WB | null;
  onClose: () => void;
  onSaved: (next: WB) => void;
  onDeleted: (id: string) => void;
}) {
  const { api } = useAuth();
  const toast = useToast();
  const [type, setType] = useState<WB["type"]>(block?.type ?? "tabata");
  const [label, setLabel] = useState(block?.label ?? "");
  const [work, setWork] = useState(String(block?.workSeconds ?? ""));
  const [rest, setRest] = useState(String(block?.restSeconds ?? ""));
  const [rounds, setRounds] = useState(String(block?.rounds ?? ""));
  const [total, setTotal] = useState(String(block?.totalDurationSeconds ?? ""));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setType(block?.type ?? "tabata");
      setLabel(block?.label ?? "");
      setWork(String(block?.workSeconds ?? ""));
      setRest(String(block?.restSeconds ?? ""));
      setRounds(String(block?.rounds ?? ""));
      setTotal(String(block?.totalDurationSeconds ?? ""));
    }, 0);
    return () => clearTimeout(t);
  }, [block]);

  async function save() {
    setSaving(true);
    const w = parseInt(work);
    const r = parseInt(rest);
    const ro = parseInt(rounds);
    const t = parseInt(total);

    try {
      const payload = {
        type,
        label: label || null,
        workSeconds: !isNaN(w) && w > 0 ? w : null,
        restSeconds: !isNaN(r) && r > 0 ? r : null,
        rounds: !isNaN(ro) && ro > 0 ? ro : null,
        totalDurationSeconds: !isNaN(t) && t > 0 ? t : null,
      };

      if (block) {
        const updated = await api.patch<WB>(`/coach/workouts/${templateId}/blocks/${block.id}`, payload);
        onSaved(updated);
        toast.success("Bloque guardado");
      } else {
        const created = await api.post<WB>(`/coach/workouts/${templateId}/blocks`, payload);
        onSaved(created);
        toast.success("Bloque creado");
      }
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo guardar el bloque");
    } finally {
      setSaving(false);
    }
  }

  async function del() {
    if (!block) return;
    setSaving(true);
    try {
      await api.del(`/coach/workouts/${templateId}/blocks/${block.id}`);
      onDeleted(block.id);
      toast.success("Bloque eliminado");
      onClose();
    } catch (e) {
      console.error(e);
      toast.error("No se pudo eliminar el bloque");
    } finally {
      setSaving(false);
    }
  }

  const showWorkRest = type === "tabata" || type === "hiit";
  const showRounds = type === "tabata" || type === "hiit" || type === "emom";
  const showTotal = type === "amrap" || type === "emom";

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1200, padding: "0 16px" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 520, maxHeight: "80vh", background: "var(--bg-1)", border: "1px solid var(--line)", borderRadius: 16, display: "flex", flexDirection: "column", overflow: "hidden" }}
      >
        <div style={{ padding: "18px 18px 12px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700 }}>
              {block ? "EDITAR BLOQUE" : "NUEVO BLOQUE"}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>
              {blockTypeLabel(type)} {label ? `· ${label}` : ""}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 10, background: "transparent", border: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-mute)" }}
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        <div style={{ padding: 18, overflow: "auto", display: "flex", flexDirection: "column", gap: 12 }}>

          <div>
            <div style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Preset</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {([
                { id: "tabata",    label: "Tabata",     type: "tabata" as const, work: "20", rest: "10", rounds: "8",  total: "" },
                { id: "hiit3030",  label: "HIIT 30:30", type: "hiit"   as const, work: "30", rest: "30", rounds: "10", total: "" },
                { id: "emom",      label: "EMOM 20min", type: "emom"   as const, work: "",   rest: "",   rounds: "20", total: "1200" },
                { id: "amrap",     label: "AMRAP 10min",type: "amrap"  as const, work: "",   rest: "",   rounds: "",   total: "600" },
              ]).map((p) => {
                const isSel = type === p.type && work === p.work && rest === p.rest && rounds === p.rounds && total === p.total;
                return (
                  <button
                    key={p.id}
                    onClick={() => { setType(p.type); setWork(p.work); setRest(p.rest); setRounds(p.rounds); setTotal(p.total); }}
                    style={{
                      padding: "5px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700,
                      border: `1px solid ${isSel ? "#FF8E72" : "var(--line-2)"}`,
                      background: isSel ? "rgba(255,142,114,.12)" : "transparent",
                      color: isSel ? "#FF8E72" : "var(--text-mute)",
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Tipo</div>
            <div style={{ display: "flex", gap: 6 }}>
              {(["tabata", "hiit", "emom", "amrap"] as WB["type"][]).map((t) => {
                const sel = type === t;
                return (
                  <button
                    key={t}
                    onClick={() => setType(t)}
                    style={{
                      flex: 1, height: 34, borderRadius: 10,
                      border: `1px solid ${sel ? "var(--lime)" : "var(--line-2)"}`,
                      background: sel ? "rgba(215,255,58,.12)" : "transparent",
                      color: sel ? "var(--lime)" : "var(--text-mute)",
                      fontSize: 12, fontWeight: 800, cursor: "pointer",
                    }}
                  >
                    {blockTypeLabel(t)}
                  </button>
                );
              })}
            </div>
          </div>

          <Input label="Etiqueta (opcional)" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Finisher / Bloque A / etc" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {showWorkRest ? (
              <>
                <Input label="Trabajo (s)" value={work} onChange={(e) => setWork(e.target.value)} align="right" />
                <Input label="Descanso (s)" value={rest} onChange={(e) => setRest(e.target.value)} align="right" />
              </>
            ) : (
              <>
                <Input label="Trabajo (s)" value={work} onChange={(e) => setWork(e.target.value)} align="right" placeholder="—" />
                <Input label="Descanso (s)" value={rest} onChange={(e) => setRest(e.target.value)} align="right" placeholder="—" />
              </>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Input
              label="Rondas"
              value={rounds}
              onChange={(e) => setRounds(e.target.value)}
              align="right"
              placeholder={showRounds ? "8" : "—"}
              disabled={!showRounds}
            />
            <Input
              label="Duración total (s)"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              align="right"
              placeholder={showTotal ? "600" : "—"}
              disabled={!showTotal}
            />
          </div>

          <div style={{ fontSize: 12, color: "var(--text-mute)" }}>
            Resumen: <span style={{ color: "var(--text)", fontWeight: 700 }}>{blockSummary({ ...(block ?? ({} as WB)), type, label: label || null, workSeconds: work ? Number(work) : null, restSeconds: rest ? Number(rest) : null, rounds: rounds ? Number(rounds) : null, totalDurationSeconds: total ? Number(total) : null } as WB)}</span>
          </div>
        </div>

        <div style={{ padding: 14, borderTop: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div>
            {block && (
              <Button variant="ghost" size="sm" icon="trash" onClick={() => setConfirmDelete(true)}>
                Eliminar
              </Button>
            )}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
            <Button size="sm" icon="check" disabled={saving} onClick={save}>
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </div>
        </div>

        {confirmDelete && block && (
          <ConfirmModal
            message={`¿Eliminar el bloque "${blockTypeLabel(block.type)}${block.label ? ` · ${block.label}` : ""}"?`}
            onConfirm={() => { setConfirmDelete(false); del(); }}
            onCancel={() => setConfirmDelete(false)}
          />
        )}
      </div>
    </div>
  );
}
