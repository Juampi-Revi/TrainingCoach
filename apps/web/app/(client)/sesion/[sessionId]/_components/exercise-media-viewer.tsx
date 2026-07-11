"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui";

interface MediaItem {
  id: string;
  mediaType: "image" | "video";
  url: string;
  publicId?: string | null;
  isPrimary?: boolean;
  thumbnailUrl?: string;
  heroUrl?: string;
  heroDesktopUrl?: string;
  fullUrl?: string;
  videoId?: string;
  embedUrl?: string;
}

interface ExerciseMediaViewerProps {
  media: MediaItem[];
  exerciseName: string;
  youtubeUrl?: string | null;
  onOpenLightbox?: () => void;
}

export function ExerciseMediaViewer({
  media,
  exerciseName,
  youtubeUrl,
  onOpenLightbox,
}: ExerciseMediaViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>({});
  
  const images = media.filter((m) => m.mediaType === "image" && !failedImageIds[m.id]);
  const videos = media.filter((m) => m.mediaType === "video");
  const allMedia = useMemo(() => [...images, ...videos], [images, videos]);
  
  const currentMedia = allMedia[currentIndex];
  const hasMultipleMedia = allMedia.length > 1;
  
  // Get hero image (primary or first)
  const heroImage = images.find((img) => img.isPrimary) || images[0];
  
  if (allMedia.length === 0 && !youtubeUrl) {
    return null;
  }

  useEffect(() => {
    if (currentIndex < allMedia.length) return;
    setCurrentIndex(Math.max(0, allMedia.length - 1));
  }, [allMedia.length, currentIndex]);

  return (
    <div style={{ position: "relative", padding: "0 16px", marginTop: 8, marginBottom: 12 }}>
      {/* Hero Image / Video Thumbnail */}
      <div
        onClick={onOpenLightbox}
        style={{
          position: "relative",
          height: 180,
          maxWidth: 320,
          margin: "0 auto",
          background: "linear-gradient(135deg, #1f1f23, #0f0f12)",
          borderRadius: 12,
          border: "1px solid var(--line-2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          overflow: "hidden",
        }}
      >
        {videos.length > 0 && videos[0].embedUrl ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <iframe
              src={videos[0].embedUrl}
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
        ) : videos.length > 0 && videos[0].url ? (
          <video
            src={videos[0].url}
            controls
            playsInline
            preload="metadata"
            autoPlay={false}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : heroImage ? (
          <Image
            src={heroImage.heroUrl || heroImage.url}
            alt={exerciseName}
            fill
            sizes="100vw"
            style={{ objectFit: "cover", opacity: 0.9 }}
            priority
            unoptimized
            onError={() => {
              setFailedImageIds((prev) => ({ ...prev, [heroImage.id]: true }));
            }}
          />
        ) : null}
        
        {/* Media Count Badge — arriba a la derecha */}
        {hasMultipleMedia && (
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              padding: "3px 8px",
              background: "rgba(11,11,12,.7)",
              backdropFilter: "blur(8px)",
              borderRadius: 10,
              fontSize: 10,
              fontWeight: 600,
              color: "var(--text)",
              zIndex: 2,
            }}
          >
            {currentIndex + 1} / {allMedia.length}
          </div>
        )}
        
        {/* Técnica badge — arriba a la izquierda */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenLightbox?.();
          }}
          style={{
            position: "absolute",
            top: 8,
            left: 8,
            zIndex: 2,
            padding: "4px 8px",
            background: "rgba(11,11,12,.7)",
            backdropFilter: "blur(8px)",
            border: "1px solid var(--line-2)",
            borderRadius: 6,
            color: "var(--text)",
            fontSize: 10,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Icon name="image" size={10} />
          Técnica
        </button>
        
        {/* YouTube link — abajo a la izquierda */}
        {youtubeUrl && (
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              zIndex: 2,
              padding: "4px 8px",
              background: "rgba(255,0,0,.85)",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              fontSize: 10,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              textDecoration: "none",
            }}
          >
            <Icon name="play" size={10} />
            YouTube
          </a>
        )}
        
        {/* Media Indicators — abajo al centro */}
        {hasMultipleMedia && (
          <div
            style={{
              position: "absolute",
              bottom: 8,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 4,
              zIndex: 2,
            }}
          >
            {allMedia.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  background: idx === currentIndex ? "var(--lime)" : "rgba(255,255,255,.4)",
                  transition: "background 0.2s",
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Swipe hint (mobile) */}
      {hasMultipleMedia && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            transform: "translateY(-50%)",
            width: "100%",
            maxWidth: 320,
            left: "50%",
            marginLeft: -160,
            display: "flex",
            justifyContent: "space-between",
            padding: "0 8px",
            pointerEvents: "none",
            zIndex: 1,
          }}
        >
          {currentIndex > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((prev) => prev - 1);
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                background: "rgba(11,11,12,.5)",
                border: "1px solid var(--line-2)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "auto",
              }}
            >
              <Icon name="chevL" size={14} color="#fff" />
            </button>
          )}
          {currentIndex < allMedia.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((prev) => prev + 1);
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                background: "rgba(11,11,12,.5)",
                border: "1px solid var(--line-2)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "auto",
              }}
            >
              <Icon name="chevR" size={14} color="#fff" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
