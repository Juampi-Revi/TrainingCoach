"use client";

import { useState } from "react";
import Image from "next/image";
import { Icon, ConfirmModal } from "@/components/ui";
import { MUSCLE_LABEL, GROUP_COLORS } from "@/lib/constants";
import type { WE } from "./_types";
import type { BlockType } from "@regen/types";

export function ExerciseRow({ we, blockType, selected, onSelect, onMoveUp, onMoveDown, onDelete }: {
  we: WE;
  blockType?: BlockType;
  selected: boolean;
  onSelect: () => void;
  onMoveUp: (() => void) | null;
  onMoveDown: (() => void) | null;
  onDelete: () => void;
}) {
  const gc = we.supersetGroup ? (GROUP_COLORS[we.supersetGroup] ?? null) : null;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const muscleLabel = we.exercise.primaryMuscle ? (MUSCLE_LABEL[we.exercise.primaryMuscle] ?? we.exercise.primaryMuscle) : null;
  
  // Check if exercise has media indicators
  const hasMedia = we.exercise.thumbnailUrl || we.exercise.youtubeUrl;
  const hasVideo = we.exercise.youtubeUrl;

  return (
    <>
      <div
        onClick={onSelect}
        style={{
          display: "grid",
          gridTemplateColumns: "20px 52px 1fr auto auto auto auto 68px",
          gap: 10, alignItems: "center",
          padding: "9px 14px",
          borderBottom: "1px solid var(--line)",
          borderLeft: selected ? "3px solid var(--lime)" : gc ? `3px solid ${gc}40` : "3px solid transparent",
          background: selected ? "rgba(215,255,58,.04)" : "transparent",
          cursor: "pointer",
          paddingLeft: selected || gc ? 11 : 14,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 1 }} onClick={(e) => e.stopPropagation()}>
          <button onClick={onMoveUp ?? undefined} disabled={!onMoveUp}
            style={{ background: "none", border: "none", cursor: onMoveUp ? "pointer" : "default", padding: "2px 3px", opacity: onMoveUp ? 0.7 : 0.15, lineHeight: 1 }}>
            <Icon name="chevUp" size={10} color="var(--text-mute)" />
          </button>
          <button onClick={onMoveDown ?? undefined} disabled={!onMoveDown}
            style={{ background: "none", border: "none", cursor: onMoveDown ? "pointer" : "default", padding: "2px 3px", opacity: onMoveDown ? 0.7 : 0.15, lineHeight: 1 }}>
            <Icon name="chevD" size={10} color="var(--text-mute)" />
          </button>
        </div>

        <div style={{ position: "relative", width: 52, height: 52, borderRadius: 8, background: we.exercise.thumbnailUrl ? "var(--bg-2)" : hasVideo ? "linear-gradient(135deg, #FF0000 0%, #CC0000 100%)" : "var(--bg-2)", border: we.exercise.thumbnailUrl || hasVideo ? "1px solid var(--line-2)" : "1px dashed var(--line-2)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
          {we.exercise.thumbnailUrl ? (
            <Image unoptimized src={we.exercise.thumbnailUrl} alt="" fill sizes="52px" style={{ objectFit: "cover" }} />
          ) : hasVideo ? (
            <div style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              background: "rgba(255,255,255,0.95)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <Icon name="play" size={14} color="#FF0000" />
            </div>
          ) : (
            <div style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              background: "var(--bg-3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "1px dashed var(--line-2)",
            }}>
              <Icon name="dumbbell" size={16} color="var(--text-mute)" />
            </div>
          )}
          {/* Group badge */}
          {gc && (
            <div style={{ position: "absolute", top: 2, left: 2, width: 16, height: 16, borderRadius: 3, background: gc, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#0B0B0C", fontFamily: "var(--font-mono)" }}>
              {we.supersetGroup}
            </div>
          )}
          {/* Video indicator (only when thumbnail exists) */}
          {hasVideo && we.exercise.thumbnailUrl && (
            <div style={{ position: "absolute", bottom: 2, right: 2, width: 16, height: 16, borderRadius: 8, background: "#FF0000", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="play" size={8} color="#fff" />
            </div>
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{we.exercise.name}</div>
          <div className="ta-mono" style={{ fontSize: 10, color: "var(--text-mute)", marginTop: 2 }}>
            {muscleLabel ? muscleLabel.toUpperCase() : "—"}
          </div>
        </div>

        {/* Sets/Reps for strength, Duration for time-based blocks */}
        <div className="ta-mono" style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", whiteSpace: "nowrap" }}>
          {blockType === "strength" ? (
            we.targetSets && we.targetReps ? `${we.targetSets} × ${we.targetReps}` : we.targetSets ? `${we.targetSets} ×` : "—"
          ) : blockType === "warmup" || blockType === "cooldown" || blockType === "cardio" ? (
            we.durationSeconds ? `${Math.round(we.durationSeconds / 60)}min` : "—"
          ) : blockType === "intervals" ? (
            <span style={{ color: "var(--lime)" }}>○</span>
          ) : (
            we.targetSets && we.targetReps ? `${we.targetSets} × ${we.targetReps}` : "—"
          )}
        </div>

        <div className="ta-mono" style={{ fontSize: 11, fontWeight: 600, color: "var(--accent-text)", whiteSpace: "nowrap" }}>
          {blockType === "intervals" ? (
            <span style={{ color: "var(--text-mute)" }}>por ronda</span>
          ) : (
            we.intensityTarget ? `${we.intensityType?.toUpperCase() ?? ""} ${we.intensityTarget}`.trim() : "—"
          )}
        </div>

        <div className="ta-mono" style={{ fontSize: 11, color: "var(--text-mute)", whiteSpace: "nowrap" }}>
          {blockType === "intervals" ? (
            <span style={{ color: "var(--lime)" }}>↻</span>
          ) : (
            we.restSeconds ? `${we.restSeconds}s` : "—"
          )}
        </div>

        <div>
          {(we.alternativesCount ?? 0) > 0 ? (
            <span style={{ padding: "2px 6px", borderRadius: 5, background: "rgba(122,184,255,.15)", border: "1px solid rgba(122,184,255,.3)", fontSize: 9, fontWeight: 700, color: "#7AB8FF", fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>
              {we.alternativesCount} alt
            </span>
          ) : (
            <span style={{ fontSize: 9, color: "var(--bg-3)", fontFamily: "var(--font-mono)" }}>—</span>
          )}
        </div>

        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onSelect}
            title="Editar"
            style={{ width: 28, height: 28, borderRadius: 7, background: selected ? "var(--lime)" : "transparent", border: `1px solid ${selected ? "var(--lime)" : "var(--line-2)"}`, color: selected ? "#0B0B0C" : "var(--text-mute)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Icon name="edit" size={12} color={selected ? "#0B0B0C" : "var(--text-mute)"} />
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            title="Eliminar"
            style={{ width: 28, height: 28, borderRadius: 7, background: "transparent", border: "1px solid var(--line-2)", color: "var(--text-mute)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
          >
            <Icon name="trash" size={12} color="var(--text-mute)" />
          </button>
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal
          message={`¿Eliminar "${we.exercise.name}" de este workout?`}
          onConfirm={() => { setConfirmDelete(false); onDelete(); }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </>
  );
}
