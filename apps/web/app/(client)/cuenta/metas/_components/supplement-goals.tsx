"use client";

import { useCallback, useEffect, useState } from "react";
import { Icon, StateBlock } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { SUPPLEMENT_PRESETS, SUPPLEMENT_TIME_LABELS, SUPPLEMENT_TIMES } from "@/lib/supplements";
import type { AssistantSupplement } from "@regen/types";

export function SupplementGoals() {
  const { api } = useAuth();
  const toast = useToast();
  const [items, setItems] = useState<AssistantSupplement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customTime, setCustomTime] = useState<string>("morning");

  const load = useCallback(async () => {
    try {
      const result = await api.get<{ supplements: AssistantSupplement[] }>("/client/assistant/supplements");
      setItems(result.supplements);
    } catch {
      toast.error("No se pudieron cargar los suplementos");
    } finally {
      setLoading(false);
    }
  }, [api, toast]);

  useEffect(() => { void load(); }, [load]);

  async function add(name: string, timeOfDay: string) {
    if (saving) return;
    try {
      setSaving(true);
      const created = await api.post<AssistantSupplement>("/client/assistant/supplements", { name, timeOfDay });
      setItems((prev) => {
        const rest = prev.filter((item) => item.id !== created.id);
        return [...rest, created];
      });
      setCustomName("");
      toast.success(`${created.name} guardado`);
    } catch {
      toast.error("No se pudo guardar el suplemento");
    } finally {
      setSaving(false);
    }
  }

  async function patch(id: string, body: Partial<Pick<AssistantSupplement, "timeOfDay" | "remind">>) {
    try {
      const updated = await api.patch<AssistantSupplement>(`/client/assistant/supplements/${id}`, body);
      setItems((prev) => prev.map((item) => item.id === id ? updated : item));
    } catch {
      toast.error("No se pudo actualizar el suplemento");
    }
  }

  async function remove(id: string) {
    try {
      await api.del(`/client/assistant/supplements/${id}`);
      setItems((prev) => prev.filter((item) => item.id !== id));
      toast.success("Suplemento sacado");
    } catch {
      toast.error("No se pudo sacar el suplemento");
    }
  }

  if (loading) {
    return <StateBlock kind="loading" title="Cargando suplementos…" />;
  }

  const taken = new Set(items.map((item) => item.name.toLowerCase()));
  const presets = SUPPLEMENT_PRESETS.filter((preset) => !taken.has(preset.name.toLowerCase()));

  return (
    <div className="metas-nutrition">
      <p className="metas-nutrition-hint">
        Si tomás algo todos los días, el chat te pregunta si lo tomaste y te llega un aviso a esa hora.
      </p>

      {presets.length > 0 && (
        <div className="supplement-presets">
          {presets.map((preset) => (
            <button
              key={preset.name}
              type="button"
              className="supplement-preset"
              disabled={saving}
              onClick={() => void add(preset.name, preset.timeOfDay)}
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}

      <div className="card-cuenta">
        {items.length === 0 ? (
          <div className="card-cuenta-row is-disabled">
            <div className="card-cuenta-left">
              <Icon name="bolt" size={20} color="var(--lime)" />
              <span>Todavía no cargaste ninguno</span>
            </div>
          </div>
        ) : items.map((item) => (
          <div className="card-cuenta-row is-disabled supplement-row" key={item.id}>
            <div className="card-cuenta-left">
              <Icon name="bolt" size={20} color="var(--lime)" />
              <span>{item.name}</span>
            </div>
            <div className="card-cuenta-right">
              <select
                className="supplement-time"
                value={item.timeOfDay}
                aria-label={`Horario de ${item.name}`}
                onChange={(event) => void patch(item.id, { timeOfDay: event.target.value })}
              >
                {SUPPLEMENT_TIMES.map((time) => (
                  <option key={time} value={time}>{SUPPLEMENT_TIME_LABELS[time]}</option>
                ))}
              </select>
              <button
                type="button"
                className={`share-toggle ${item.remind ? "active" : ""}`}
                aria-label={item.remind ? `Avisar ${item.name}` : `No avisar ${item.name}`}
                onClick={() => void patch(item.id, { remind: !item.remind })}
              >
                <div className="share-toggle-knob" />
              </button>
              <button
                type="button"
                className="ghost-btn supplement-remove"
                aria-label={`Sacar ${item.name}`}
                onClick={() => void remove(item.id)}
              >
                <Icon name="trash" size={16} color="var(--danger)" />
              </button>
            </div>
          </div>
        ))}

        <div className="card-editor">
          <div className="editor-row">
            <input
              className="goal-input supplement-name"
              value={customName}
              placeholder="Otro, ej. hierro"
              onChange={(event) => setCustomName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && customName.trim()) {
                  void add(customName.trim(), customTime);
                }
              }}
            />
            <select
              className="supplement-time"
              value={customTime}
              aria-label="Horario del suplemento"
              onChange={(event) => setCustomTime(event.target.value)}
            >
              {SUPPLEMENT_TIMES.map((time) => (
                <option key={time} value={time}>{SUPPLEMENT_TIME_LABELS[time]}</option>
              ))}
            </select>
            <button
              className="primary-btn"
              type="button"
              disabled={saving || !customName.trim()}
              onClick={() => void add(customName.trim(), customTime)}
            >
              Sumar
            </button>
          </div>
          <div className="editor-help">El interruptor enciende o apaga el aviso de ese suplemento.</div>
        </div>
      </div>
    </div>
  );
}
