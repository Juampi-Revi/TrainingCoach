"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Button, ConfirmModal, Icon, Input } from "@/components/ui";
import { blockTypeLabel } from "@/lib/constants";
import type { BlockType, IntervalType } from "@regen/types";
import type { WB } from "./_types";

const BLOCK_TYPES: BlockType[] = ["warmup", "strength", "intervals", "cardio", "cooldown"];
const INTERVAL_TYPES: IntervalType[] = ["tabata", "hiit", "emom", "amrap"];

const INTERVAL_PRESETS: Array<{
  id: string;
  label: string;
  intervalType: IntervalType;
  work: string;
  rest: string;
  rounds: string;
  total: string;
}> = [
  { id: "tabata", label: "Tabata", intervalType: "tabata", work: "20", rest: "10", rounds: "8", total: "" },
  { id: "hiit3030", label: "HIIT 30:30", intervalType: "hiit", work: "30", rest: "30", rounds: "10", total: "" },
  { id: "emom", label: "EMOM 20min", intervalType: "emom", work: "", rest: "", rounds: "20", total: "1200" },
  { id: "amrap", label: "AMRAP 10min", intervalType: "amrap", work: "", rest: "", rounds: "", total: "600" },
];

export function BlockModal({ templateId, block, onClose, onSaved, onDeleted }: {
  templateId: string;
  block: WB | null;
  onClose: () => void;
  onSaved: (next: WB) => void;
  onDeleted: (id: string) => void;
}) {
  const { api } = useAuth();
  const toast = useToast();
  
  // Block type state
  const [blockType, setBlockType] = useState<BlockType>(block?.type ?? "intervals");
  const [intervalType, setIntervalType] = useState<IntervalType | null>(
    block?.type === "intervals" ? (block.intervalType ?? "tabata") : null
  );
  
  // Common fields
  const [label, setLabel] = useState(block?.label ?? "");
  const [description, setDescription] = useState(block?.description ?? "");
  const [restAfterSeconds, setRestAfterSeconds] = useState(String(block?.restAfterSeconds ?? ""));
  
  // Interval-specific fields
  const [work, setWork] = useState(String(block?.workSeconds ?? ""));
  const [rest, setRest] = useState(String(block?.restSeconds ?? ""));
  const [rounds, setRounds] = useState(String(block?.rounds ?? ""));
  const [total, setTotal] = useState(String(block?.totalDurationSeconds ?? ""));

  // Universal config fields (warmup/strength/cooldown/cardio)
  const [targetMinutes, setTargetMinutes] = useState(String(block?.targetMinutes ?? ""));
  const [restBetweenExercises, setRestBetweenExercises] = useState(String(block?.restBetweenExercisesSeconds ?? ""));

  // Cardio-specific fields
  const [targetZone, setTargetZone] = useState(block?.targetZone ?? "");
  
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setBlockType(block?.type ?? "intervals");
      setIntervalType(block?.type === "intervals" ? (block.intervalType ?? "tabata") : null);
      setLabel(block?.label ?? "");
      setDescription(block?.description ?? "");
      setRestAfterSeconds(String(block?.restAfterSeconds ?? ""));
      setWork(String(block?.workSeconds ?? ""));
      setRest(String(block?.restSeconds ?? ""));
      setRounds(String(block?.rounds ?? ""));
      setTotal(String(block?.totalDurationSeconds ?? ""));
      setTargetMinutes(String(block?.targetMinutes ?? ""));
      setRestBetweenExercises(String(block?.restBetweenExercisesSeconds ?? ""));
      setTargetZone(block?.targetZone ?? "");
    }, 0);
    return () => clearTimeout(t);
  }, [block]);

  async function save() {
    setSaving(true);

    const w = parseInt(work);
    const r = parseInt(rest);
    const ro = parseInt(rounds);
    const t = parseInt(total);
    const restAfter = parseInt(restAfterSeconds);
    const restBetweenEx = parseInt(restBetweenExercises);
    const targetMins = parseInt(targetMinutes);

    try {
      const basePayload = {
        label: label || null,
        description: description || null,
        restAfterSeconds: !isNaN(restAfter) && restAfter > 0 ? restAfter : null,
      };

      let payload;

      if (blockType === "intervals" && intervalType) {
        // EMOM: rounds = minutes, total = rounds * 60
        // AMRAP: only total duration
        // Tabata/HIIT: work, rest, rounds
        if (intervalType === "emom") {
          const emomRounds = !isNaN(ro) && ro > 0 ? ro : null;
          payload = {
            ...basePayload,
            type: blockType,
            intervalType,
            rounds: emomRounds,
            totalDurationSeconds: emomRounds ? emomRounds * 60 : null,
            workSeconds: null,
            restSeconds: null,
          };
        } else if (intervalType === "amrap") {
          payload = {
            ...basePayload,
            type: blockType,
            intervalType,
            totalDurationSeconds: !isNaN(t) && t > 0 ? t : null,
            workSeconds: null,
            restSeconds: null,
            rounds: null,
          };
        } else {
          // Tabata / HIIT
          payload = {
            ...basePayload,
            type: blockType,
            intervalType,
            workSeconds: !isNaN(w) && w > 0 ? w : null,
            restSeconds: !isNaN(r) && r > 0 ? r : null,
            rounds: !isNaN(ro) && ro > 0 ? ro : null,
            totalDurationSeconds: null,
          };
        }
      } else if (blockType === "cardio") {
        payload = {
          ...basePayload,
          type: blockType,
          targetMinutes: !isNaN(targetMins) && targetMins > 0 ? targetMins : null,
          targetZone: targetZone || null,
        };
      } else {
        // warmup, strength, cooldown - configurable duration and rest between exercises
        payload = {
          ...basePayload,
          type: blockType,
          targetMinutes: !isNaN(targetMins) && targetMins > 0 ? targetMins : null,
          restBetweenExercisesSeconds: !isNaN(restBetweenEx) && restBetweenEx > 0 ? restBetweenEx : null,
        };
      }

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

  // Determine which fields to show based on block type
  const isInterval = blockType === "intervals";
  const isCardio = blockType === "cardio";
  const isWarmup = blockType === "warmup";
  const isCooldown = blockType === "cooldown";
  const isStrength = blockType === "strength";
  const isEmom = intervalType === "emom";
  const isAmrap = intervalType === "amrap";
  const showIntervalFields = isInterval && intervalType;
  const showWorkRest = showIntervalFields && !isEmom && !isAmrap; // Only Tabata/HIIT
  const showRounds = showIntervalFields && !isAmrap; // Tabata, HIIT, EMOM have rounds
  const showTotal = showIntervalFields && (isAmrap || isEmom);
  // Universal config for warmup/strength/cooldown
  const showUniversalConfig = isWarmup || isStrength || isCooldown;

  // Auto-calculate total duration for EMOM
  const emomRounds = parseInt(rounds);
  const calculatedEmomTotal = !isNaN(emomRounds) && emomRounds > 0 ? emomRounds * 60 : "";

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
              {blockTypeLabel(blockType, intervalType)} {label ? `· ${label}` : ""}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 10, background: "transparent", border: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "var(--text-mute)" }}
          >
            <Icon name="x" size={14} />
          </button>
        </div>

        <div style={{ padding: 18, overflow: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
          
          {/* Block Type Selector */}
          <div>
            <div style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Tipo de bloque</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {BLOCK_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setBlockType(t);
                    if (t === "intervals" && !intervalType) setIntervalType("tabata");
                    if (t !== "intervals") setIntervalType(null);
                  }}
                  style={{
                    padding: "6px 12px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 600,
                    border: `1px solid ${blockType === t ? "var(--lime)" : "var(--line-2)"}`,
                    background: blockType === t ? "rgba(215,255,58,.12)" : "transparent",
                    color: blockType === t ? "var(--lime)" : "var(--text-mute)",
                  }}
                >
                  {blockTypeLabel(t)}
                </button>
              ))}
            </div>
          </div>

          {/* Interval Type Selector (only for intervals) */}
          {isInterval && (
            <div>
              <div style={{ fontSize: 10, color: "var(--text-mute)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Tipo de intervalo</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {INTERVAL_PRESETS.map((p) => {
                  const isSel = intervalType === p.intervalType;
                  return (
                    <button
                      key={p.id}
                      onClick={() => {
                        setIntervalType(p.intervalType);
                        setWork(p.work);
                        setRest(p.rest);
                        setRounds(p.rounds);
                        setTotal(p.total);
                      }}
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
          )}

          {/* Label */}
          <Input
            label="Nombre del bloque"
            placeholder="Ej: Tabata · 4 ejercicios"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />

          {/* Description */}
          <Input
            label="Descripción (opcional)"
            placeholder="Notas sobre este bloque..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          {/* Interval-specific fields */}
          {showIntervalFields && (
            <>
              {showWorkRest && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <Input label="Trabajo (seg)" placeholder="20" value={work} onChange={(e) => setWork(e.target.value)} />
                  <Input label="Descanso (seg)" placeholder="10" value={rest} onChange={(e) => setRest(e.target.value)} />
                </div>
              )}
              {showRounds && (
                <>
                  <Input
                    label={isEmom ? "Minutos (rondas)" : "Rondas"}
                    placeholder={isEmom ? "10" : "8"}
                    value={rounds}
                    onChange={(e) => {
                      setRounds(e.target.value);
                      // Auto-calculate total for EMOM
                      if (isEmom) {
                        const r = parseInt(e.target.value);
                        if (!isNaN(r) && r > 0) {
                          setTotal(String(r * 60));
                        }
                      }
                    }}
                  />
                  {isEmom && (
                    <div style={{ fontSize: 11, color: "var(--text-mute)", marginTop: -10 }}>
                      Cada minuto empieza una nueva serie. El alumno completa el ejercicio y descansa el tiempo restante.
                    </div>
                  )}
                </>
              )}
              {showTotal && (
                <Input
                  label={isEmom ? "Duración total (auto)" : "Duración total (seg)"}
                  placeholder={isEmom ? "600" : "600"}
                  value={isEmom ? (calculatedEmomTotal || total) : total}
                  onChange={(e) => !isEmom && setTotal(e.target.value)}
                  disabled={isEmom}
                />
              )}
              {isAmrap && (
                <div style={{ fontSize: 11, color: "var(--text-mute)" }}>
                  AMRAP = "As Many Rounds As Possible". El alumno hace tantas rondas como pueda en el tiempo total.
                </div>
              )}
            </>
          )}

          {/* Cardio-specific fields */}
          {isCardio && (
            <>
              <Input label="Minutos objetivo" placeholder="20" value={targetMinutes} onChange={(e) => setTargetMinutes(e.target.value)} />
              <Input label="Zona objetivo (opcional)" placeholder="Ej: Zona 2, 70-80% FCm" value={targetZone} onChange={(e) => setTargetZone(e.target.value)} />
            </>
          )}

          {/* Universal config for warmup/strength/cooldown */}
          {showUniversalConfig && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <Input label="Tiempo objetivo (min)" placeholder="Ej: 10" value={targetMinutes} onChange={(e) => setTargetMinutes(e.target.value)} />
                <Input label="Descanso entre ejercicios (seg)" placeholder="Ej: 60" value={restBetweenExercises} onChange={(e) => setRestBetweenExercises(e.target.value)} />
              </div>
            </>
          )}

          {/* Rest after block */}
          <Input
            label="Descanso después del bloque (seg, opcional)"
            placeholder="Ej: 120"
            value={restAfterSeconds}
            onChange={(e) => setRestAfterSeconds(e.target.value)}
          />
        </div>

        <div style={{ padding: "12px 18px 18px", borderTop: "1px solid var(--line)", display: "flex", gap: 8 }}>
          {block && (
            <Button variant="secondary" onClick={() => setConfirmDelete(true)} disabled={saving}>
              Eliminar
            </Button>
          )}
          <div style={{ flex: 1 }} />
          <Button variant="secondary" onClick={onClose} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving}>
            {block ? "Guardar" : "Crear"}
          </Button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          message="¿Eliminar este bloque? Los ejercicios dentro del bloque también se eliminarán."
          confirmLabel="Eliminar"
          onConfirm={del}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
}
