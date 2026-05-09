"use client";

import { useState } from "react";
import { Button, Icon } from "@/components/ui";
import { RefPayload } from "../_types";

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  ref: RefPayload | null;
  onRef: RefPayload | null;
  onClearRef: () => void;
  onOpenRefPicker: () => void;
}

export function ChatInput({ value, onChange, onSend, sending, ref, onClearRef, onOpenRefPicker }: ChatInputProps) {
  return (
    <div className="chat-input-area">
      {ref && (
        <div className="ref-preview">
          <div className="ref-preview-content ta-ellipsis">
            {ref.kind === "session" ? "Sesión" : "Entrenamiento"}{ref.label ? ` · ${ref.label}` : ""}
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