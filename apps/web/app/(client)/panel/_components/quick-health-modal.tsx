"use client";

import { useState } from "react";
import { Button, Icon } from "@/components/ui";

interface QuickHealthModalProps {
  type: "steps" | "sleep";
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { date: string; value: number }) => Promise<void>;
  currentValue?: number | null;
}

export function QuickHealthModal({ type, isOpen, onClose, onSave, currentValue }: QuickHealthModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const isSteps = type === "steps";
  const title = isSteps ? "Registrar pasos" : "Registrar sueño";
  const icon = isSteps ? "footprints" : "moon";
  const unit = isSteps ? "pasos" : "horas";
  const placeholder = isSteps ? "6000" : "7";
  const step = isSteps ? "1" : "0.5";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) return;

    try {
      setSaving(true);
      await onSave({ date, value: numValue });
      setValue("");
      onClose();
    } catch {
      // error handled by parent
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Icon name={icon} size={20} color="var(--lime)" />
            {title}
          </div>
          <button onClick={onClose} className="modal-close">
            <Icon name="x" size={18} color="var(--text-mute)" />
          </button>
        </div>

        {currentValue != null && (
          <div className="modal-current">
            <span className="modal-current-label">Valor actual:</span>
            <span className="modal-current-value">
              {isSteps ? currentValue.toLocaleString() : `${Math.floor(currentValue / 60)}h ${currentValue % 60}m`}
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="modal-field">
            <label className="modal-label">Fecha</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={today}
              className="modal-input"
            />
          </div>

          <div className="modal-field">
            <label className="modal-label">
              {isSteps ? "Pasos" : "Horas de sueño"}
            </label>
            <div className="modal-input-wrapper">
              <input
                type="number"
                step={step}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={placeholder}
                className="modal-input"
                autoFocus
              />
              <span className="modal-input-unit">{unit}</span>
            </div>
          </div>

          <div className="modal-actions">
            <Button variant="secondary" size="md" type="button" onClick={onClose} disabled={saving} style={{ flex: 1 }}>
              Cancelar
            </Button>
            <Button size="md" type="submit" disabled={saving || !value} style={{ flex: 1 }}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 16px;
        }

        .modal-content {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 16px;
          width: 100%;
          max-width: 360px;
          overflow: hidden;
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--line);
        }

        .modal-title {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 16px;
          font-weight: 700;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: var(--bg-2);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .modal-close:hover {
          background: var(--line);
        }

        .modal-current {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 20px;
          background: var(--bg);
          border-bottom: 1px solid var(--line);
        }

        .modal-current-label {
          font-size: 13px;
          color: var(--text-mute);
        }

        .modal-current-value {
          font-size: 15px;
          font-weight: 700;
          color: var(--lime);
        }

        .modal-form {
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .modal-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .modal-label {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-mute);
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .modal-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .modal-input {
          width: 100%;
          padding: 12px 14px;
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 10px;
          color: var(--text);
          font-size: 16px;
          font-weight: 600;
          outline: none;
          transition: all 0.2s ease;
        }

        .modal-input:focus {
          border-color: var(--lime);
        }

        .modal-input::-webkit-outer-spin-button,
        .modal-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .modal-input-unit {
          position: absolute;
          right: 12px;
          font-size: 13px;
          color: var(--text-mute);
          pointer-events: none;
        }

        .modal-actions {
          display: flex;
          gap: 10px;
          margin-top: 4px;
        }

        @media (min-width: 768px) {
          .modal-content {
            max-width: 400px;
          }

          .modal-header {
            padding: 20px 24px;
          }

          .modal-title {
            font-size: 18px;
          }

          .modal-form {
            padding: 24px;
          }

          .modal-label {
            font-size: 11px;
          }

          .modal-input {
            padding: 14px 16px;
            font-size: 17px;
          }
        }
      `}</style>
    </div>
  );
}
