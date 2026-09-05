"use client";

import Image from "next/image";
import { Icon } from "@/components/ui";

export function LoggerTechniquePreview({
  url,
  exerciseName,
  hidden,
  onHide,
  variant = "media",
}: {
  url: string;
  exerciseName: string;
  hidden: boolean;
  onHide: () => void;
  variant?: "media" | "guide";
}) {
  if (hidden) return null;
  return (
    <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "16px 16px 10px", pointerEvents: "none" }}>
      <div
        style={{
          width: "100%",
          maxWidth: 320,
          aspectRatio: "16 / 9",
          position: "relative",
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid var(--line-2)",
          background: "linear-gradient(135deg, color-mix(in srgb, var(--bg-1) 95%, transparent), color-mix(in srgb, var(--bg) 90%, transparent))",
          boxShadow: "var(--shadow-md)",
        }}
      >
        <Image
          src={url}
          alt={`Técnica de ${exerciseName}`}
          fill
          sizes="(max-width: 540px) calc(100vw - 32px), 320px"
          style={{ objectFit: variant === "guide" ? "contain" : "cover", padding: variant === "guide" ? 12 : 0 }}
          unoptimized
          onError={onHide}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent, color-mix(in srgb, var(--bg) 28%, transparent))" }} />
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            padding: "6px 10px",
            borderRadius: 999,
            background: "color-mix(in srgb, var(--bg) 72%, transparent)",
            border: "1px solid var(--line-2)",
            color: "var(--text)",
            fontSize: 11,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="image" size={12} color="var(--text)" />
          Técnica
        </div>
      </div>
    </div>
  );
}
