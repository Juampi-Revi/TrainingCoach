"use client";

import { Button, Icon } from "@/components/ui";
import type { RefPayload, UploadedChatMedia } from "./chat-types";

export function CoachChatComposer({
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
  clientName,
}: {
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

      {attachment && (
        <div style={{ marginBottom: 8, display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 0, padding: "8px 10px", borderRadius: 12, border: "1px solid var(--line)", background: "var(--bg-1)" }}>
            <div className="ta-ellipsis" style={{ fontSize: 12, fontWeight: 600 }}>
              {attachment.kind === "video" ? "Video" : "Foto"}
            </div>
          </div>
          <Button variant="secondary" onClick={onClearAttachment} style={{ height: 36 }}>
            Quitar
          </Button>
        </div>
      )}

      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
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
        <Button onClick={onSend} disabled={(!value.trim() && !attachment) || sending || uploading} style={{ height: 44, padding: "0 16px", fontWeight: 700 }}>
          {uploading ? "Subiendo…" : "Enviar"}
        </Button>
      </div>
    </div>
  );
}
