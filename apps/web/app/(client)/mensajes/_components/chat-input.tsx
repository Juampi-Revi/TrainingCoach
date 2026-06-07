"use client";

import { Button, Icon } from "@/components/ui";
import { RefPayload, UploadedChatMedia } from "../_types";

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
  uploading: boolean;
  attachment: UploadedChatMedia | null;
  onPickFile: (file: File) => void;
  onClearAttachment: () => void;
  reference: RefPayload | null;
  onClearRef: () => void;
  onOpenRefPicker: () => void;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  sending,
  uploading,
  attachment,
  onPickFile,
  onClearAttachment,
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
      {attachment && (
        <div className="ref-preview">
          <div className="ref-preview-content ta-ellipsis">
            {attachment.kind === "video" ? "Video" : "Foto"}
          </div>
          <Button variant="secondary" onClick={onClearAttachment} style={{ height: 36 }}>Quitar</Button>
        </div>
      )}
      <div className="chat-input-row">
        <Button variant="secondary" onClick={onOpenRefPicker} style={{ height: 44, padding: "0 12px" }}>
          <Icon name="book" size={16} />
        </Button>
        <label style={{ display: "inline-flex" }}>
          <input
            type="file"
            accept="image/*,video/*"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              e.target.value = "";
              if (!f) return;
              onPickFile(f);
            }}
            disabled={uploading || sending}
          />
          <Button variant="secondary" style={{ height: 44, padding: "0 12px" }} disabled={uploading || sending}>
            <Icon name="image" size={16} />
          </Button>
        </label>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Escribí un mensaje…"
          rows={1}
          className="chat-textarea"
        />
        <Button onClick={onSend} disabled={(!value.trim() && !attachment) || sending || uploading} style={{ height: 44, padding: "0 16px", fontWeight: 700 }}>
          {uploading ? "Subiendo…" : "Enviar"}
        </Button>
      </div>
    </div>
  );
}
