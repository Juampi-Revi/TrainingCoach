"use client";

import { AlternativesPanel } from "./alternatives-panel";
import { MediaManager } from "./media-manager";
import { Icon } from "@/components/ui";
import type { WE } from "./_types";

interface ExerciseInspectorDetailsProps {
  templateId: string;
  we: WE;
  gc: string | null;
  localNotes: string;
  setLocalNotes: (v: string) => void;
  commitNotes: () => void;
  localGroupNote: string;
  setLocalGroupNote: (v: string) => void;
  commitGroupNote: () => void;
  localYoutubeUrl: string;
  setLocalYoutubeUrl: (v: string) => void;
  commitYoutubeUrl: () => void;
  exerciseMedia: Array<{
    id: string;
    mediaType: "image" | "video";
    url: string;
    publicId?: string | null;
    thumbnailUrl?: string;
    previewUrl?: string;
    isPrimary?: boolean;
    displayOrder?: number;
    videoId?: string;
    embedUrl?: string;
  }>;
  onReloadMedia: () => void;
}

export function ExerciseInspectorDetails({
  templateId,
  we,
  gc,
  localNotes,
  setLocalNotes,
  commitNotes,
  localGroupNote,
  setLocalGroupNote,
  commitGroupNote,
  localYoutubeUrl,
  setLocalYoutubeUrl,
  commitYoutubeUrl,
  exerciseMedia,
  onReloadMedia,
}: ExerciseInspectorDetailsProps) {
  return (
    <>
      <div>
        <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 3 }}>
          EJERCICIO ALTERNATIVO
        </div>
        <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 8 }}>
          Si el equipo no está disponible el cliente puede cambiar al alternativo.
        </div>
        <AlternativesPanel weId={we.id} templateId={templateId} />
      </div>

      <div>
        <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 6 }}>
          NOTA TÉCNICA
        </div>
        <textarea
          value={localNotes}
          onChange={(e) => setLocalNotes(e.target.value)}
          onBlur={commitNotes}
          placeholder="Ej: Bajar controlado 3 seg, mantener tensión…"
          rows={3}
          style={{
            width: "100%",
            background: "var(--bg-2)",
            border: "1px solid var(--line-2)",
            borderRadius: 8,
            padding: "8px 10px",
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            color: "var(--text)",
            lineHeight: 1.45,
            resize: "none",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {we.supersetGroup && (
        <div>
          <div className="ta-mono" style={{ fontSize: 9, color: gc ?? "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 6 }}>
            NOTA DEL BLOQUE {we.supersetGroup}
          </div>
          <textarea
            value={localGroupNote}
            onChange={(e) => setLocalGroupNote(e.target.value.slice(0, 100))}
            onBlur={commitGroupNote}
            placeholder="Nota visible al lado del título del bloque…"
            rows={2}
            maxLength={100}
            style={{
              width: "100%",
              background: "var(--bg-2)",
              border: `1px solid ${gc ?? "var(--line-2)"}`,
              borderRadius: 8,
              padding: "8px 10px",
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              color: "var(--text)",
              lineHeight: 1.45,
              resize: "none",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <div style={{ fontSize: 10, color: "var(--text-dim)", textAlign: "right", marginTop: 2 }}>
            {localGroupNote.length}/100
          </div>
        </div>
      )}

      <div>
        <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 6 }}>
          YOUTUBE URL
        </div>
        <input
          type="url"
          value={localYoutubeUrl}
          onChange={(e) => setLocalYoutubeUrl(e.target.value)}
          onBlur={commitYoutubeUrl}
          placeholder="https://youtube.com/watch?v=…"
          disabled={we.exercise.isSystem}
          title={we.exercise.isSystem ? "Los ejercicios del sistema no se pueden modificar" : undefined}
          style={{
            height: 36,
            width: "100%",
            background: "var(--bg-2)",
            border: "1px solid var(--line-2)",
            borderRadius: 8,
            padding: "0 10px",
            fontSize: 12,
            color: "var(--text)",
            outline: "none",
            boxSizing: "border-box",
            opacity: we.exercise.isSystem ? 0.5 : 1,
          }}
        />
        {we.exercise.isSystem && (
          <div style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 3 }}>
            Solo lectura — ejercicio del sistema
          </div>
        )}
      </div>

      <div style={{ borderTop: "2px solid var(--lime)", paddingTop: 16, marginTop: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
          <Icon name="image" size={16} color="var(--lime)" />
          <div className="ta-mono" style={{ fontSize: 10, color: "var(--lime)", letterSpacing: ".12em", fontWeight: 700, textTransform: "uppercase" }}>
            Media del ejercicio
          </div>
        </div>
        <MediaManager
          exerciseId={we.exercise.id}
          exerciseName={we.exercise.name}
          media={exerciseMedia}
          onMediaChange={onReloadMedia}
          limits={{ maxImages: 3, maxVideos: 1 }}
        />
      </div>
    </>
  );
}
