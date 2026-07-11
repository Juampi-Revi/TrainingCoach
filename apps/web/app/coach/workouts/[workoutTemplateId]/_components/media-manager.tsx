"use client";

import { useRef, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Icon, Button, ConfirmModal } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";

interface MediaItem {
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
}

interface MediaManagerProps {
  exerciseId: string;
  exerciseName: string;
  media: MediaItem[];
  onMediaChange: () => void;
  limits?: { maxImages: number; maxVideos: number };
  readOnly?: boolean;
}

export function MediaManager({
  exerciseId,
  exerciseName,
  media,
  onMediaChange,
  limits = { maxImages: 3, maxVideos: 1 },
  readOnly = false,
}: MediaManagerProps) {
  const { api } = useAuth();
  const toast = useToast();
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [addingImageUrl, setAddingImageUrl] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [addingVideo, setAddingVideo] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);
  const [brokenImageIds, setBrokenImageIds] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState<
    | { kind: "image"; url: string }
    | { kind: "video"; url: string }
    | null
  >(null);

  // Safety check for media array
  const safeMedia = Array.isArray(media) ? media : [];
  
  // Helper to get YouTube thumbnail
  const getYouTubeThumbnailUrl = (videoId: string | null | undefined) => {
    if (!videoId) return null;
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  };
  
  // Process videos to ensure they have thumbnails
  const processedMedia = safeMedia.map((m) => {
    if (m.mediaType === "video" && m.publicId && !m.thumbnailUrl) {
      return { ...m, thumbnailUrl: getYouTubeThumbnailUrl(m.publicId) };
    }
    return m;
  });
  
  const images = processedMedia.filter((m) => m.mediaType === "image");
  const videos = processedMedia.filter((m) => m.mediaType === "video");
  const canAddImage = images.length < limits.maxImages;
  const canAddVideo = videos.length < limits.maxVideos;

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      
      const file = acceptedFiles[0];
      if (!file.type.startsWith("image/")) {
        toast.error("Solo se permiten imágenes");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error("La imagen debe ser menor a 10MB");
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        await api.postForm(`/coach/exercises/${exerciseId}/media`, formData);
        
        toast.success("Imagen subida");
        onMediaChange();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Error al subir imagen";
        toast.error(msg);
      } finally {
        setUploading(false);
      }
    },
    [api, exerciseId, onMediaChange, toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    maxSize: 10 * 1024 * 1024,
    disabled: readOnly || uploading || !canAddImage,
    multiple: false,
  });

  async function uploadVideo(file: File) {
    if (!file.type.startsWith("video/")) {
      toast.error("Solo se permiten videos");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error("El video debe ser menor a 50MB");
      return;
    }
    if (!canAddVideo) {
      toast.error(`Límite de ${limits.maxVideos} video alcanzado`);
      return;
    }

    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.postForm(`/coach/exercises/${exerciseId}/media`, formData);
      toast.success("Video subido");
      onMediaChange();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al subir video";
      toast.error(msg);
    } finally {
      setUploadingVideo(false);
    }
  }

  async function addImageByUrl() {
    const trimmed = imageUrl.trim();
    if (!trimmed) {
      toast.error("Ingresá una URL de imagen");
      return;
    }
    if (!canAddImage) {
      toast.error(`Límite de ${limits.maxImages} imágenes alcanzado`);
      return;
    }

    setAddingImageUrl(true);
    try {
      await api.post(`/coach/exercises/${exerciseId}/media`, { url: trimmed });
      toast.success("Imagen agregada");
      setImageUrl("");
      onMediaChange();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al agregar imagen";
      toast.error(msg);
    } finally {
      setAddingImageUrl(false);
    }
  }

  function youTubeIdFromUrl(url: string): string | null {
    const u = url.trim();
    const m1 = u.match(/[?&]v=([^&\s]{11})/);
    if (m1?.[1]) return m1[1];
    const m2 = u.match(/youtu\.be\/([^?&\s]{11})/);
    if (m2?.[1]) return m2[1];
    const m3 = u.match(/\/shorts\/([^?&\s]{11})/);
    if (m3?.[1]) return m3[1];
    return null;
  }

  async function addYouTubeVideo() {
    if (!youtubeUrl.trim()) {
      toast.error("Ingresá una URL de YouTube");
      return;
    }
    
    setAddingVideo(true);
    try {
      await api.post(`/coach/exercises/${exerciseId}/media/video`, {
        url: youtubeUrl.trim(),
      });
      toast.success("Video agregado");
      setYoutubeUrl("");
      onMediaChange();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error al agregar video";
      toast.error(msg);
    } finally {
      setAddingVideo(false);
    }
  }

  async function deleteMedia(mediaId: string) {
    try {
      await api.del(`/coach/exercises/${exerciseId}/media/${mediaId}`);
      toast.success("Media eliminada");
      onMediaChange();
    } catch (e) {
      toast.error("Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  }

  async function setAsPrimary(mediaId: string) {
    try {
      await api.patch(`/coach/exercises/${exerciseId}/media/${mediaId}`, {
        isPrimary: true,
      });
      toast.success("Imagen principal actualizada");
      onMediaChange();
    } catch (e) {
      toast.error("Error al actualizar");
    } finally {
      setSettingPrimaryId(null);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Images Section */}
      <div style={{ border: "1px dashed var(--line-2)", borderRadius: 8, padding: 12 }}>
        <div
          className="ta-mono"
          style={{
            fontSize: 10,
            color: "var(--text-mute)",
            letterSpacing: ".1em",
            fontWeight: 700,
            marginBottom: 10,
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="image" size={14} color="var(--text-mute)" />
          Imágenes {images.length > 0 && `(${images.length})`}
        </div>

        {images.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {images.map((img, idx) => (
              <div
                key={img.id}
                style={{
                  position: "relative",
                  aspectRatio: "4/5",
                  borderRadius: 8,
                  overflow: "hidden",
                  border: img.isPrimary
                    ? "2px solid var(--lime)"
                    : "1px solid var(--line)",
                  background: "var(--bg-2)",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    const url = img.previewUrl || img.url;
                    if (!url) return;
                    setPreview({ kind: "image", url });
                  }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    padding: 0,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                  aria-label={`Ver imagen ${idx + 1}`}
                >
                  {img.thumbnailUrl && !brokenImageIds[img.id] ? (
                    <Image
                      src={img.thumbnailUrl}
                      alt={`${exerciseName} ${idx + 1}`}
                      fill
                      sizes="100px"
                      style={{ objectFit: "cover" }}
                      unoptimized
                      onError={() => {
                        setBrokenImageIds((prev) => ({ ...prev, [img.id]: true }));
                      }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 8 }}>
                        <Icon name="image" size={24} color="var(--text-mute)" />
                        {brokenImageIds[img.id] && (
                          <span style={{ fontSize: 9, color: "var(--text-dim)", textAlign: "center" }}>
                            URL no disponible
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </button>
                
                {img.isPrimary && (
                  <div
                    style={{
                      position: "absolute",
                      top: 4,
                      left: 4,
                      padding: "2px 6px",
                      background: "var(--lime)",
                      borderRadius: 4,
                      fontSize: 9,
                      fontWeight: 700,
                      color: "#0B0B0C",
                    }}
                  >
                    Principal
                  </div>
                )}

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "rgba(0,0,0,0.5)",
                    opacity: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
                  onMouseLeave={(e) => (e.currentTarget.style.opacity = "0")}
                >
                  {!readOnly && !img.isPrimary && (
                    <button
                      onClick={() => setSettingPrimaryId(img.id)}
                      style={{
                        padding: "4px 8px",
                        background: "var(--bg-1)",
                        border: "none",
                        borderRadius: 4,
                        fontSize: 11,
                        cursor: "pointer",
                        color: "var(--text)",
                      }}
                    >
                      Hacer principal
                    </button>
                  )}
                  {!readOnly && (
                    <button
                      onClick={() => setDeletingId(img.id)}
                      style={{
                        padding: "4px 8px",
                        background: "var(--danger)",
                        border: "none",
                        borderRadius: 4,
                        fontSize: 11,
                        cursor: "pointer",
                        color: "#fff",
                      }}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Zone */}
        {!readOnly && canAddImage && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div
              {...getRootProps()}
              style={{
                padding: "20px",
                border: `2px dashed ${isDragActive ? "var(--lime)" : "var(--line)"}`,
                borderRadius: 8,
                background: isDragActive
                  ? "rgba(215,255,58,0.05)"
                  : "var(--bg-2)",
                cursor: uploading ? "wait" : "pointer",
                opacity: uploading ? 0.6 : 1,
                textAlign: "center",
              }}
            >
              <input {...getInputProps()} />
              <Icon
                name="image"
                size={32}
                color={isDragActive ? "var(--lime)" : "var(--text-mute)"}
              />
              <div style={{ fontSize: 13, marginTop: 8, color: "var(--text)", fontWeight: 600 }}>
                {uploading
                  ? "Subiendo..."
                  : isDragActive
                  ? "Soltá la imagen aquí"
                  : "Subir imagen"}
              </div>
              <div style={{ fontSize: 10, color: "var(--text-mute)", marginTop: 4 }}>
                JPG, PNG, WebP · Máx 10MB
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: "var(--text)", marginBottom: 8, fontWeight: 600 }}>
                Agregar imagen por URL:
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    background: "var(--bg-1)",
                    border: "1px solid var(--line-2)",
                    borderRadius: 6,
                    fontSize: 13,
                    color: "var(--text)",
                    outline: "none",
                  }}
                />
                <Button
                  size="md"
                  disabled={!imageUrl.trim() || addingImageUrl}
                  onClick={addImageByUrl}
                  style={{ minWidth: 100 }}
                >
                  {addingImageUrl ? "Agregando..." : "Agregar"}
                </Button>
              </div>
              <div style={{ fontSize: 10, color: "var(--text-mute)", marginTop: 6 }}>
                Se guarda la URL externa tal cual. Si deja de existir, la app la oculta sin romper la vista.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Videos Section */}
      <div style={{ border: "1px dashed var(--line-2)", borderRadius: 8, padding: 12 }}>
        <div
          className="ta-mono"
          style={{
            fontSize: 10,
            color: "var(--text-mute)",
            letterSpacing: ".1em",
            fontWeight: 700,
            marginBottom: 10,
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="video" size={14} color="var(--text-mute)" />
          Videos de YouTube {videos.length > 0 && `(${videos.length})`}
        </div>

        {videos.map((video) => (
          <div
            key={video.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: 12,
              background: "var(--bg-1)",
              borderRadius: 10,
              marginBottom: 8,
              border: "1px solid var(--line-2)",
            }}
          >
            <div
              style={{
                width: 90,
                height: 50,
                borderRadius: 6,
                background: "linear-gradient(135deg, #FF0000 0%, #CC0000 100%)",
                position: "relative",
                overflow: "hidden",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(255,0,0,0.2)",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setPreview({ kind: "video", url: video.url });
                }}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  padding: 0,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                aria-label="Ver video"
              >
                {video.thumbnailUrl ? (
                <>
                  <Image
                    src={video.thumbnailUrl}
                    alt="Video thumbnail"
                    fill
                    sizes="90px"
                    style={{ objectFit: "cover" }}
                    unoptimized
                    onError={(e) => {
                      // Si falla la carga, ocultar la imagen y mostrar el icono
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(0,0,0,0.25)",
                    }}
                  >
                    <div style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      background: "rgba(255,255,255,0.95)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <Icon name="play" size={12} color="#FF0000" />
                    </div>
                  </div>
                </>
                ) : (
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  background: "rgba(255,255,255,0.95)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Icon name="play" size={16} color="#FF0000" />
                </div>
                )}
              </button>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 4,
                }}
              >
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: 2,
                  background: "#FF0000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <Icon name="play" size={8} color="#fff" />
                </div>
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--text-mute)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}>
                  YouTube
                </span>
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {video.url.replace("https://www.youtube.com/watch?v=", "")}
              </div>
            </div>
            {!readOnly && (
              <button
                onClick={() => setDeletingId(video.id)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: "var(--bg-2)",
                  border: "1px solid var(--line-2)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--danger)";
                  e.currentTarget.style.borderColor = "var(--danger)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--bg-2)";
                  e.currentTarget.style.borderColor = "var(--line-2)";
                }}
              >
                <Icon name="trash" size={14} color="var(--danger)" />
              </button>
            )}
          </div>
        ))}

        {/* Add YouTube Video - ALWAYS SHOW IF CAN ADD */}
        {!readOnly && canAddVideo && (
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: "var(--text)", fontWeight: 600 }}>
                Subir video (MP4):
              </div>
              <div>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    void uploadVideo(f);
                    e.target.value = "";
                  }}
                />
                <Button
                  size="md"
                  variant="secondary"
                  disabled={uploadingVideo}
                  onClick={() => videoInputRef.current?.click()}
                  style={{ minWidth: 140 }}
                >
                  {uploadingVideo ? "Subiendo..." : "Elegir archivo"}
                </Button>
              </div>
            </div>

            <div style={{ fontSize: 12, color: "var(--text)", marginBottom: 8, fontWeight: 600 }}>
              Agregar video de YouTube:
            </div>
            <div
              style={{
                display: "flex",
                gap: 8,
              }}
            >
              <input
                type="text"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  background: "var(--bg-1)",
                  border: "1px solid var(--line-2)",
                  borderRadius: 6,
                  fontSize: 13,
                  color: "var(--text)",
                  outline: "none",
                }}
              />
              <Button
                size="md"
                disabled={!youtubeUrl.trim() || addingVideo}
                onClick={addYouTubeVideo}
                style={{ minWidth: 100 }}
              >
                {addingVideo ? "Agregando..." : "Agregar"}
              </Button>
            </div>
            <div style={{ fontSize: 10, color: "var(--text-mute)", marginTop: 6 }}>
              Pegá la URL completa del video de YouTube
            </div>
          </div>
        )}
        
        {!canAddVideo && (
          <div style={{ fontSize: 12, color: "var(--text-mute)", textAlign: "center", padding: "10px" }}>
            Límite de 1 video alcanzado
          </div>
        )}
      </div>

      {/* Confirm Delete Modal */}
      {deletingId && (
        <ConfirmModal
          message="¿Eliminar este elemento? Esta acción no se puede deshacer."
          onConfirm={() => deleteMedia(deletingId)}
          onCancel={() => setDeletingId(null)}
        />
      )}

      {/* Confirm Set Primary Modal */}
      {settingPrimaryId && (
        <ConfirmModal
          message="¿Establecer como imagen principal?"
          onConfirm={() => setAsPrimary(settingPrimaryId)}
          onCancel={() => setSettingPrimaryId(null)}
        />
      )}

      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.72)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1200,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(980px, 96vw)",
              background: "var(--bg-1)",
              border: "1px solid var(--line)",
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 12px",
                borderBottom: "1px solid var(--line)",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>
                {preview.kind === "image" ? "Imagen" : "Video"}
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  border: "1px solid var(--line-2)",
                  background: "var(--bg-2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                aria-label="Cerrar"
              >
                <Icon name="x" size={16} color="var(--text)" />
              </button>
            </div>

            {preview.kind === "image" ? (
              <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", background: "var(--bg-2)" }}>
                <Image
                  unoptimized
                  src={preview.url}
                  alt={exerciseName}
                  fill
                  sizes="(max-width: 980px) 96vw, 980px"
                  style={{ objectFit: "contain" }}
                />
              </div>
            ) : (
              <div style={{ width: "100%", aspectRatio: "16/9", background: "#000" }}>
                {preview.url.includes("youtube.com") || preview.url.includes("youtu.be") ? (
                  <iframe
                    src={`https://www.youtube.com/embed/${youTubeIdFromUrl(preview.url) ?? ""}`}
                    title="YouTube video player"
                    style={{ width: "100%", height: "100%", border: 0 }}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <video controls playsInline style={{ width: "100%", height: "100%" }} src={preview.url} />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
