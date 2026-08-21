"use client";

import { Button, Icon } from "@/components/ui";
import { RefPayload } from "../_types";

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  reference: RefPayload | null;
  onClearRef: () => void;
  onOpenRefPicker: () => void;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  sending,
  reference,
  onClearRef,
  onOpenRefPicker,
}: ChatInputProps) {
  return (
    <div className="chat-input-area">
      {reference && (
        <div className="ref-preview">
          <div className="ref-preview-content ta-ellipsis">
            {reference.kind === "session" ? "Sesión" : "Entrenamiento"}{reference.label ? ` · ${reference.label}` : ""}
          </div>
          <Button variant="secondary" onClick={onClearRef} style={{ height: 36 }}>Quitar</Button>
        </div>
      )}
      <div className="chat-input-row">
        <Button variant="secondary" onClick={onOpenRefPicker} style={{ height: 44, padding: "0 12px" }}>
          <Icon name="book" size={16} />
        </Button>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Escribí un mensaje…"
          rows={1}
          className="chat-textarea"
        />
        <Button onClick={onSend} disabled={!value.trim() || sending} style={{ height: 44, padding: "0 16px", fontWeight: 700 }}>
          Enviar
        </Button>
      </div>
    </div>
  );
}
