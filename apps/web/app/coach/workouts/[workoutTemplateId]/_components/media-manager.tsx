"use client";

import { useState, useCallback } from "react";
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
}

export function MediaManager({
  exerciseId,
  exerciseName,
  media,
  onMediaChange,
  limits = { maxImages: 3, maxVideos: 1 },
}: MediaManagerProps) {
  const { api } = useAuth();
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [addingVideo, setAddingVideo] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);

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

        await api.post(`/coach/exercises/${exerciseId}/media`, formData);
        
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
    disabled: uploading || !canAddImage,
    multiple: false,
  });

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
                {img.thumbnailUrl ? (
                  <Image
                    src={img.thumbnailUrl}
                    alt={`${exerciseName} ${idx + 1}`}
                    fill
                    sizes="100px"
                    style={{ objectFit: "cover" }}
                    unoptimized
                  />
                ) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="image" size={24} color="var(--text-mute)" />
                  </div>
                )}
                
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
                  {!img.isPrimary && (
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
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Zone */}
        {canAddImage && (
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
                : "Agregar imagen"}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-mute)", marginTop: 4 }}>
              JPG, PNG, WebP · Máx 10MB
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
          </div>
        ))}

        {/* Add YouTube Video - ALWAYS SHOW IF CAN ADD */}
        {canAddVideo && (
          <div style={{ marginTop: 8 }}>
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
    </div>
  );
}
