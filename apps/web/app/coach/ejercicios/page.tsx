"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { Badge, Button, ConfirmModal, Icon, StateBlock } from "@/components/ui";
import { DesktopShell } from "@/components/layout/desktop-shell";
import { MediaManager } from "../workouts/[workoutTemplateId]/_components/media-manager";

interface Exercise {
  id: string;
  name: string;
  primaryMuscle: string | null;
  equipment: string | null;
  isSystem: boolean;
  thumbnailUrl: string | null;
}

const MUSCLES = [
  { value: "chest",      label: "Pecho" },
  { value: "back",       label: "Espalda" },
  { value: "shoulders",  label: "Hombros" },
  { value: "biceps",     label: "Bíceps" },
  { value: "triceps",    label: "Tríceps" },
  { value: "legs",       label: "Piernas" },
  { value: "glutes",     label: "Glúteos" },
  { value: "core",       label: "Core" },
  { value: "calves",     label: "Pantorrillas" },
  { value: "forearms",   label: "Antebrazos" },
  { value: "full_body",  label: "Cuerpo completo" },
];

const MUSCLE_LABEL: Record<string, string> = Object.fromEntries(
  MUSCLES.map((m) => [m.value, m.label])
);

// ─── Form modal ───────────────────────────────────────────────────────────────

interface MediaItem { id: string; url: string; mediaType: string; }

interface ExerciseFormProps {
  exercise?: Exercise;
  onClose: () => void;
  onSaved: (ex: Exercise) => void;
  onDeleted?: (id: string) => void;
}

function ExerciseFormModal({ exercise, onClose, onSaved, onDeleted }: ExerciseFormProps) {
  const { api } = useAuth();
  const isEdit = !!exercise;
  const [name, setName] = useState(exercise?.name ?? "");
  const [muscle, setMuscle] = useState(exercise?.primaryMuscle ?? "");
  const [equipment, setEquipment] = useState(exercise?.equipment ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"info" | "media">("info");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [addingMedia, setAddingMedia] = useState(false);
  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  async function loadMedia() {
    if (!isEdit || !exercise?.id) return;
    try {
      const res = await api.get<{
        images: Array<{
          id: string;
          mediaType: "image";
          url: string;
          publicId?: string;
          thumbnailUrl?: string;
          previewUrl?: string;
          isPrimary?: boolean;
          displayOrder?: number;
        }>;
        videos: Array<{
          id: string;
          mediaType: "video";
          url: string;
          publicId?: string;
          videoId?: string;
          embedUrl?: string;
          thumbnailUrl?: string;
        }>;
      }>(`/coach/exercises/${exercise.id}/media`);
      
      const allMedia = [
        ...res.images.map(img => ({ ...img, mediaType: "image" as const })),
        ...res.videos.map(vid => ({ ...vid, mediaType: "video" as const })),
      ];
      setMedia(allMedia);
    } catch (e) {
      console.error("Error loading media:", e);
    }
  }

  useEffect(() => {
    if (isEdit && exercise?.id) {
      loadMedia();
    }
  }, [api, isEdit, exercise?.id]);

  async function addMedia() {
    if (!mediaUrl.trim() || !exercise?.id) return;
    setAddingMedia(true);
    try {
      const m = await api.post<MediaItem>(`/coach/exercises/${exercise.id}/media`, { url: mediaUrl.trim(), mediaType });
      setMedia((p) => [...p, m]);
      setMediaUrl("");
    } catch (e) { setError(e instanceof Error ? e.message : "Error al agregar media"); }
    finally { setAddingMedia(false); }
  }

  async function deleteMedia(mediaId: string) {
    setDeletingMediaId(mediaId);
    try {
      await api.del(`/coach/exercises/${exercise!.id}/media/${mediaId}`);
      setMedia((p) => p.filter((m) => m.id !== mediaId));
    } catch (e) { console.error(e); }
    finally { setDeletingMediaId(null); }
  }

  async function handleSave() {
    if (!name.trim()) { setError("El nombre es obligatorio"); return; }
    setSaving(true);
    setError(null);
    try {
      const body = { name: name.trim(), primaryMuscle: muscle || null, equipment: equipment.trim() || null };
      const saved = isEdit
        ? await api.patch<Exercise>(`/coach/exercises/${exercise!.id}`, body)
        : await api.post<Exercise>("/coach/exercises", body);
      onSaved(saved);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al guardar");
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
          setError(e instanceof Error ? e.message : "Error al eliminar");
          setDeleting(false);
        }
      },
    });
  }

  return (
    <>
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: "0 16px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 460,
          background: "var(--bg-1)", border: "1px solid var(--line)",
          borderRadius: 16, padding: 28,
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-.02em", marginBottom: 20 }}>
          {isEdit ? "Editar ejercicio" : "Nuevo ejercicio"}
        </div>

        {/* Tabs — edit mode only */}
        {isEdit && (
          <div style={{ display: "flex", gap: 2, marginBottom: 20, borderBottom: "1px solid var(--line)" }}>
            {(["info", "media"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: "6px 16px", fontSize: 13, fontWeight: 600,
                  background: "transparent", border: "none", cursor: "pointer",
                  color: tab === t ? "var(--text)" : "var(--text-mute)",
                  borderBottom: tab === t ? "2px solid var(--lime)" : "2px solid transparent",
                  marginBottom: -1,
                }}
              >
                {t === "info" ? "Info" : `Media${media.length ? ` (${media.length})` : ""}`}
              </button>
            ))}
          </div>
        )}

        {/* ── Info tab ── */}
        {tab === "info" && (
          <>
            {/* Name */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-mute)", display: "block", marginBottom: 6 }}>
                Nombre *
              </label>
              <div
                style={{
                  padding: "0 12px", height: 44, background: "var(--bg-2)",
                  border: `1px solid ${error && !name.trim() ? "var(--danger)" : "var(--line-2)"}`,
                  borderRadius: 10, display: "flex", alignItems: "center",
                }}
              >
                <input
                  autoFocus
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder="Ej: Press de banca"
                  style={{
                    flex: 1, background: "transparent", border: "none", outline: "none",
                    fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text)",
                  }}
                />
              </div>
            </div>

            {/* Primary muscle */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-mute)", display: "block", marginBottom: 6 }}>
                Músculo principal
              </label>
              <div
                style={{
                  padding: "0 12px", height: 44, background: "var(--bg-2)",
                  border: "1px solid var(--line-2)", borderRadius: 10,
                  display: "flex", alignItems: "center",
                }}
              >
                <select
                  value={muscle}
                  onChange={(e) => setMuscle(e.target.value)}
                  style={{
                    flex: 1, background: "transparent", border: "none", outline: "none",
                    fontFamily: "var(--font-sans)", fontSize: 14, color: muscle ? "var(--text)" : "var(--text-mute)",
                  }}
                >
                  <option value="">Sin especificar</option>
                  {MUSCLES.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Equipment */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-mute)", display: "block", marginBottom: 6 }}>
                Equipamiento
              </label>
              <div
                style={{
                  padding: "0 12px", height: 44, background: "var(--bg-2)",
                  border: "1px solid var(--line-2)", borderRadius: 10,
                  display: "flex", alignItems: "center",
                }}
              >
                <input
                  value={equipment}
                  onChange={(e) => setEquipment(e.target.value)}
                  placeholder="Ej: Barra, Mancuernas, Máquina…"
                  style={{
                    flex: 1, background: "transparent", border: "none", outline: "none",
                    fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text)",
                  }}
                />
              </div>
            </div>
          </>
        )}

        {/* ── Media tab ── */}
        {tab === "media" && isEdit && exercise && (
          <div style={{ marginBottom: 20 }}>
            <MediaManager
              exerciseId={exercise.id}
              exerciseName={exercise.name}
              media={media.map(m => ({ ...m, mediaType: m.mediaType as "image" | "video" }))}
              onMediaChange={loadMedia}
              limits={{ maxImages: 3, maxVideos: 1 }}
            />
          </div>
        )}

        {error && (
          <div style={{ fontSize: 12, color: "var(--danger)", marginBottom: 14 }}>{error}</div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          {isEdit && tab === "info" && (
            <Button
              variant="danger"
              disabled={deleting || saving}
              onClick={handleDelete}
              style={{ marginRight: "auto" }}
            >
              {deleting ? "Eliminando…" : "Eliminar"}
            </Button>
          )}
          <Button variant="secondary" onClick={onClose} disabled={saving || deleting}>
            {tab === "media" ? "Cerrar" : "Cancelar"}
          </Button>
          {tab === "info" && (
            <Button onClick={handleSave} disabled={saving || deleting || !name.trim()}>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EjerciciosPage() {
  const { api, user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[] | null>(null);
  const [search, setSearch] = useState("");
  const [muscle, setMuscle] = useState("Todos");
  const [modal, setModal] = useState<{ open: true; exercise?: Exercise } | null>(null);

  useEffect(() => {
    const q = search.trim();
    api
      .get<Exercise[]>(`/coach/exercises${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      .then(setExercises)
      .catch((e) => {
        console.error(e);
        setExercises([]);
      });
  }, [api, search]);

  const list = exercises ?? [];
  const muscleOptions = ["Todos", ...Array.from(new Set(
    list.map((e) => e.primaryMuscle).filter((m): m is string => m !== null)
  ))];
  const filtered = list.filter((e) => muscle === "Todos" || (e.primaryMuscle ?? "") === muscle);

  function handleSaved(saved: Exercise) {
    setExercises((prev) => {
      const list = prev ?? [];
      const idx = list.findIndex((e) => e.id === saved.id);
      if (idx >= 0) {
        const next = [...list];
        next[idx] = saved;
        return next;
      }
      return [saved, ...list];
    });
  }

  function handleDeleted(id: string) {
    setExercises((prev) => (prev ? prev.filter((e) => e.id !== id) : prev));
  }

  return (
    <>
      <DesktopShell
        active="library"
        title="Ejercicios"
        subtitle={`${list.length} ejercicios`}
        coachName={user?.name ?? "Coach"}
        actions={
          <>
            <div
              className="coach-header-action-secondary"
              style={{
                display: "flex", alignItems: "center", gap: 8,
                width: 240, height: 36,
                background: "var(--bg-2)", border: "1px solid var(--line-2)",
                borderRadius: 10, padding: "0 12px",
              }}
            >
              <Icon name="search" size={14} color="var(--text-mute)" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setExercises(null);
                }}
                placeholder="Buscar ejercicio…"
                style={{
                  flex: 1, background: "transparent", border: "none", outline: "none",
                  fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--text)",
                }}
              />
            </div>
            <Button size="sm" icon="plus" onClick={() => setModal({ open: true })}>
              Nuevo ejercicio
            </Button>
          </>
        }
      >
        <div className="coach-pad">
          {/* Mobile search */}
          <div
            className="coach-mobile-search"
            style={{
              display: "none", alignItems: "center", gap: 8,
              height: 40, background: "var(--bg-2)",
              border: "1px solid var(--line-2)", borderRadius: 10,
              padding: "0 12px", marginBottom: 16,
            }}
          >
            <Icon name="search" size={14} color="var(--text-mute)" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setExercises(null);
              }}
              placeholder="Buscar ejercicio…"
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--text)",
              }}
            />
          </div>

          {/* Muscle filter chips */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
            {muscleOptions.map((m) => (
              <button
                key={m}
                onClick={() => setMuscle(m)}
                style={{
                  padding: "5px 12px", borderRadius: 999,
                  border: `1px solid ${m === muscle ? "var(--lime)" : "var(--line-2)"}`,
                  background: m === muscle ? "rgba(215,255,58,.12)" : "transparent",
                  color: m === muscle ? "var(--lime)" : "var(--text-mute)",
                  fontSize: 12, fontWeight: 500, cursor: "pointer",
                }}
              >
                {m === "Todos" ? "Todos" : (MUSCLE_LABEL[m] ?? m)}
              </button>
            ))}
          </div>

          {exercises === null ? (
            <StateBlock kind="loading" title="Cargando ejercicios…" />
          ) : filtered.length === 0 ? (
            <StateBlock kind="empty" title="Sin resultados" body="Probá con otro término de búsqueda." />
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 12,
              }}
            >
              {filtered.map((ex) => (
                <div
                  key={ex.id}
                  onClick={() => !ex.isSystem && setModal({ open: true, exercise: ex })}
                  style={{
                    background: "var(--bg-1)",
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                    overflow: "hidden",
                    cursor: ex.isSystem ? "default" : "pointer",
                    position: "relative",
                  }}
                  className={ex.isSystem ? undefined : "ta-row"}
                >
                  {/* Thumbnail */}
                  <div
                    style={{
                      height: 100, background: "var(--bg-2)", position: "relative",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {ex.thumbnailUrl ? (
                      <Image
                        unoptimized
                        src={ex.thumbnailUrl}
                        alt={ex.name}
                        fill
                        sizes="(max-width: 600px) 100vw, 220px"
                        style={{ objectFit: "cover" }}
                      />
                    ) : (
                      <Icon name="dumbbell" size={28} color="var(--text-dim)" />
                    )}
                  </div>

                  {/* Edit indicator for own exercises */}
                  {!ex.isSystem && (
                    <div
                      style={{
                        position: "absolute", top: 8, right: 8,
                        width: 24, height: 24, borderRadius: 6,
                        background: "rgba(0,0,0,.5)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <Icon name="edit" size={12} color="var(--text)" />
                    </div>
                  )}

                  {/* Info */}
                  <div style={{ padding: "10px 12px 12px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginBottom: 6 }}>
                      {ex.name}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {ex.primaryMuscle && (
                        <Badge tone="neutral" size="sm">
                          {MUSCLE_LABEL[ex.primaryMuscle] ?? ex.primaryMuscle}
                        </Badge>
                      )}
                      {ex.equipment && (
                        <Badge tone="neutral" size="sm">{ex.equipment}</Badge>
                      )}
                      {!ex.isSystem && (
                        <Badge tone="limeSoft" size="sm">Propio</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DesktopShell>

      {modal && (
        <ExerciseFormModal
          exercise={modal.exercise}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
}
