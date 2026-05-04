"use client";

import { useState } from "react";
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
  
  const images = media.filter((m) => m.mediaType === "image");
  const videos = media.filter((m) => m.mediaType === "video");
  const allMedia = [...images, ...videos];
  
  const currentMedia = allMedia[currentIndex];
  const hasMultipleMedia = allMedia.length > 1;
  
  // Get hero image (primary or first)
  const heroImage = images.find((img) => img.isPrimary) || images[0];
  
  if (allMedia.length === 0 && !youtubeUrl) {
    return null;
  }

  return (
    <div style={{ position: "relative" }}>
      {/* Hero Image / Video Thumbnail */}
      <div
        onClick={onOpenLightbox}
        style={{
          position: "relative",
          height: 200,
          background: "linear-gradient(135deg, #1f1f23, #0f0f12)",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          overflow: "hidden",
        }}
      >
        {heroImage ? (
          <Image
            src={heroImage.heroUrl || heroImage.url}
            alt={exerciseName}
            fill
            sizes="100vw"
            style={{ objectFit: "cover", opacity: 0.9 }}
            priority
            unoptimized
          />
        ) : videos.length > 0 ? (
          <Image
            src={videos[0].thumbnailUrl || ""}
            alt={`${exerciseName} video`}
            fill
            sizes="100vw"
            style={{ objectFit: "cover", opacity: 0.9 }}
            unoptimized
          />
        ) : null}
        
        {/* Play Button Overlay */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: 64,
            height: 64,
            borderRadius: 32,
            background: "rgba(215,255,58,.95)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 20px rgba(215,255,58,.3)",
          }}
        >
          <Icon name="play" size={28} color="#0B0B0C" />
        </div>
        
        {/* Media Indicators */}
        {hasMultipleMedia && (
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: 6,
              zIndex: 2,
            }}
          >
            {allMedia.map((_, idx) => (
              <div
                key={idx}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  background: idx === currentIndex ? "var(--lime)" : "rgba(255,255,255,.4)",
                  transition: "background 0.2s",
                }}
              />
            ))}
          </div>
        )}
        
        {/* Media Count Badge */}
        {hasMultipleMedia && (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              padding: "4px 10px",
              background: "rgba(11,11,12,.7)",
              backdropFilter: "blur(8px)",
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 600,
              color: "var(--text)",
              zIndex: 2,
            }}
          >
            {currentIndex + 1} / {allMedia.length}
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div
        style={{
          position: "absolute",
          bottom: 12,
          left: 12,
          display: "flex",
          gap: 8,
          zIndex: 2,
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenLightbox?.();
          }}
          style={{
            padding: "6px 12px",
            background: "rgba(11,11,12,.7)",
            backdropFilter: "blur(8px)",
            border: "1px solid var(--line-2)",
            borderRadius: 6,
            color: "var(--text)",
            fontSize: 11,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="image" size={12} />
          Técnica
        </button>
        
        {youtubeUrl && (
          <a
            href={youtubeUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              padding: "6px 12px",
              background: "rgba(255,0,0,.85)",
              border: "none",
              borderRadius: 6,
              color: "#fff",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              textDecoration: "none",
            }}
          >
            <Icon name="play" size={12} />
            YouTube
          </a>
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
                width: 36,
                height: 36,
                borderRadius: 18,
                background: "rgba(11,11,12,.5)",
                border: "1px solid var(--line-2)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "auto",
              }}
            >
              <Icon name="chevL" size={16} color="#fff" />
            </button>
          )}
          {currentIndex < allMedia.length - 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex((prev) => prev + 1);
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background: "rgba(11,11,12,.5)",
                border: "1px solid var(--line-2)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "auto",
              }}
            >
              <Icon name="chevR" size={16} color="#fff" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
