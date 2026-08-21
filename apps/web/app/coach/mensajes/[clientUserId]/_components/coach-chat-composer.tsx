"use client";

import { Button, Icon } from "@/components/ui";
import type { RefPayload } from "./chat-types";

export function CoachChatComposer({
  value,
  onChange,
  onSend,
  sending,
  reference,
  onClearRef,
  onOpenRefPicker,
  clientName,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  reference: RefPayload | null;
  onClearRef: () => void;
  onOpenRefPicker: () => void;
  clientName: string;
}) {
  return (
    <div style={{ flexShrink: 0, padding: 18, borderTop: "1px solid var(--line)", background: "var(--bg)" }}>
      {reference && (
        <div style={{ marginBottom: 8, display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 0, padding: "8px 10px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--bg-1)" }}>
            <div className="ta-ellipsis" style={{ fontSize: 12, fontWeight: 600 }}>
              {reference.kind === "session" ? `Alumnos / ${clientName} / ${reference.label ?? "Sesión"}` : `Entrenamientos / ${reference.label ?? "Entrenamiento"}`}
            </div>
          </div>
          <Button variant="secondary" onClick={onClearRef} style={{ height: 36 }}>
            Quitar
          </Button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <Button variant="secondary" onClick={onOpenRefPicker} style={{ height: 44, padding: "0 12px" }}>
          <Icon name="book" size={16} />
        </Button>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escribí un mensaje…"
          rows={1}
          style={{
            flex: 1,
            resize: "none",
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: 14,
            padding: "12px 12px",
            color: "var(--text)",
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            lineHeight: 1.35,
            outline: "none",
            minHeight: 44,
            maxHeight: 120,
          }}
        />
        <Button onClick={onSend} disabled={!value.trim() || sending} style={{ height: 44, padding: "0 16px", fontWeight: 700 }}>
          Enviar
        </Button>
      </div>
    </div>
  );
}
