"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Button, ConfirmModal } from "@/components/ui";
import type { ExerciseLibraryItem } from "../_hooks/use-exercise-library";
import { ExerciseFormInfoTab, type ExerciseFormValue } from "./exercise-form-info-tab";
import { ExerciseFormMediaTab } from "./exercise-form-media-tab";

export function ExerciseFormModal({
  exercise,
  onClose,
  onSaved,
  onDeleted,
}: {
  exercise?: ExerciseLibraryItem;
  onClose: () => void;
  onSaved: (ex: ExerciseLibraryItem) => void;
  onDeleted?: (id: string) => void;
}) {
  const { api } = useAuth();
  const toast = useToast();
  const isEdit = !!exercise;

  const [value, setValue] = useState<ExerciseFormValue>({
    name: exercise?.name ?? "",
    primaryMuscle: exercise?.primaryMuscle ?? null,
    equipment: exercise?.equipment ?? null,
    difficulty: exercise?.difficulty ?? null,
    objective: exercise?.objective ?? null,
    youtubeUrl: exercise?.youtubeUrl ?? null,
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tab, setTab] = useState<"info" | "media">("info");
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  async function handleSave() {
    const name = value.name.trim();
    if (!name) {
      toast.error("El nombre es obligatorio");
      return;
    }

    setSaving(true);
    try {
      const body: ExerciseFormValue = {
        name,
        primaryMuscle: value.primaryMuscle || null,
        equipment: value.equipment?.trim() || null,
        difficulty: value.difficulty || null,
        objective: value.objective || null,
        youtubeUrl: value.youtubeUrl?.trim() || null,
      };

      const saved = isEdit
        ? await api.patch<ExerciseLibraryItem>(`/coach/exercises/${exercise!.id}`, body)
        : await api.post<ExerciseLibraryItem>("/coach/exercises", body);

      onSaved(saved);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  function handleDelete() {
    setConfirmDialog({
      message: `¿Eliminar "${exercise!.name}"? Esta acción no se puede deshacer.`,
      onConfirm: async () => {
        setConfirmDialog(null);
        setDeleting(true);
        try {
          await api.del(`/coach/exercises/${exercise!.id}`);
          onDeleted?.(exercise!.id);
          onClose();
        } catch (e) {
          toast.error(e instanceof Error ? e.message : "Error al eliminar");
          setDeleting(false);
        }
      },
    });
  }

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "0 16px",
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: 520,
            background: "var(--bg-1)",
            border: "1px solid var(--line)",
            borderRadius: 16,
            padding: 28,
            maxHeight: "90vh",
            overflowY: "auto",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 20 }}>
            {isEdit ? "Editar ejercicio" : "Nuevo ejercicio"}
          </div>

          {isEdit && (
            <div style={{ display: "flex", gap: 2, marginBottom: 20, borderBottom: "1px solid var(--line)" }}>
              {(["info", "media"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: "6px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: tab === t ? "var(--text)" : "var(--text-mute)",
                    borderBottom: tab === t ? "2px solid var(--lime)" : "2px solid transparent",
                    marginBottom: -1,
                  }}
                >
                  {t === "info" ? "Info" : "Media"}
                </button>
              ))}
            </div>
          )}

          {tab === "info" && (
            <ExerciseFormInfoTab value={value} setValue={setValue} onSave={handleSave} />
          )}

          {tab === "media" && isEdit && exercise && (
            <div style={{ marginBottom: 20 }}>
              <ExerciseFormMediaTab exerciseId={exercise.id} exerciseName={exercise.name} />
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            {isEdit && tab === "info" && (
              <Button variant="danger" disabled={deleting || saving} onClick={handleDelete} style={{ marginRight: "auto" }}>
                {deleting ? "Eliminando…" : "Eliminar"}
              </Button>
            )}
            <Button variant="secondary" onClick={onClose} disabled={saving || deleting}>
              {tab === "media" ? "Cerrar" : "Cancelar"}
            </Button>
            {tab === "info" && (
              <Button onClick={handleSave} disabled={saving || deleting || !value.name.trim()}>
                {saving ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear"}
              </Button>
            )}
          </div>
        </div>
      </div>
      {confirmDialog && (
        <ConfirmModal
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </>
  );
}
