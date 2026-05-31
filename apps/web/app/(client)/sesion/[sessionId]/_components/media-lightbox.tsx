"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui";

interface MediaItem {
  id: string;
  mediaType: "image" | "video";
  url: string;
  publicId?: string | null;
  fullUrl?: string;
  videoId?: string;
  embedUrl?: string;
  thumbnailUrl?: string;
}

interface MediaLightboxProps {
  media: MediaItem[];
  exerciseName?: string;
  initialIndex?: number;
  onClose: () => void;
}

export function MediaLightbox({
  media,
  exerciseName,
  initialIndex = 0,
  onClose,
}: MediaLightboxProps) {
  const [idx, setIdx] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const m = media[idx];

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && idx > 0) setIdx((i) => i - 1);
      if (e.key === "ArrowRight" && idx < media.length - 1) setIdx((i) => i + 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [idx, media.length, onClose]);

  if (!m) return null;

  const isYouTubeVideo = m.mediaType === "video" && m.embedUrl;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.95)",
        zIndex: 1100,
        display: "flex",
        flexDirection: "column",
      }}
      onClick={onClose}
    >
      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          padding: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          zIndex: 10,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          {exerciseName && (
            <div style={{ fontSize: 16, fontWeight: 600, color: "#fff" }}>
              {exerciseName}
            </div>
          )}
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.6)", marginTop: 2 }}>
            {m.mediaType === "image" ? "Imagen" : "Video"} {idx + 1} de {media.length}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            background: "rgba(255,255,255,.15)",
            border: "none",
            color: "#fff",
            fontSize: 20,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(8px)",
          }}
        >
          <Icon name="x" size={20} />
        </button>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "60px 16px 100px",
          position: "relative",
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* Navigation Arrows (Desktop) */}
        {media.length > 1 && idx > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => i - 1);
            }}
            style={{
              position: "absolute",
              left: 16,
              top: "50%",
              transform: "translateY(-50%)",
              width: 48,
              height: 48,
              borderRadius: 24,
              background: "rgba(255,255,255,.1)",
              border: "1px solid rgba(255,255,255,.2)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(8px)",
              zIndex: 5,
            }}
          >
            <Icon name="chevL" size={24} />
          </button>
        )}
        
        {media.length > 1 && idx < media.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIdx((i) => i + 1);
            }}
            style={{
              position: "absolute",
              right: 16,
              top: "50%",
              transform: "translateY(-50%)",
              width: 48,
              height: 48,
              borderRadius: 24,
              background: "rgba(255,255,255,.1)",
              border: "1px solid rgba(255,255,255,.2)",
              color: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(8px)",
              zIndex: 5,
            }}
          >
            <Icon name="chevR" size={24} />
          </button>
        )}

        {/* Media Display */}
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: isYouTubeVideo ? 900 : 800,
            maxHeight: "80vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {m.mediaType === "video" && m.embedUrl ? (
            <div
              style={{
                position: "relative",
                width: "100%",
                paddingBottom: "56.25%", // 16:9 aspect ratio
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <iframe
                src={m.embedUrl}
                title="Exercise video"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  border: "none",
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "70vh",
                cursor: isZoomed ? "zoom-out" : "zoom-in",
              }}
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <Image
                src={m.fullUrl || m.url}
                alt={exerciseName || "Exercise"}
                fill
                sizes="(max-width: 800px) 100vw, 800px"
                style={{
                  objectFit: isZoomed ? "contain" : "contain",
                  borderRadius: 12,
                }}
                unoptimized
              />
              {!isZoomed && (
                <div
                  style={{
                    position: "absolute",
                    bottom: 12,
                    right: 12,
                    padding: "6px 12px",
                    background: "rgba(0,0,0,.5)",
                    borderRadius: 6,
                    fontSize: 11,
                    color: "#fff",
                  }}
                >
                  Click para zoom
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Thumbnails Strip */}
      {media.length > 1 && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "16px",
            background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
            display: "flex",
            justifyContent: "center",
            gap: 8,
            overflowX: "auto",
            zIndex: 10,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {media.map((item, i) => (
            <button
              key={item.id}
              onClick={() => setIdx(i)}
              style={{
                width: 64,
                height: 64,
                borderRadius: 8,
                border: `2px solid ${i === idx ? "var(--lime)" : "transparent"}`,
                overflow: "hidden",
                cursor: "pointer",
                flexShrink: 0,
                position: "relative",
                background: "var(--bg-2)",
              }}
            >
              {item.mediaType === "video" ? (
                <>
                  <Image
                    src={item.thumbnailUrl || ""}
                    alt="Video thumbnail"
                    fill
                    sizes="64px"
                    style={{ objectFit: "cover" }}
                    unoptimized
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "rgba(0,0,0,.3)",
                    }}
                  >
                    <Icon name="play" size={20} color="#fff" />
                  </div>
                </>
              ) : (
                <Image
                  src={item.thumbnailUrl || item.url}
                  alt="Thumbnail"
                  fill
                  sizes="64px"
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
