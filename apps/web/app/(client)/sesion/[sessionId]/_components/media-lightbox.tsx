"use client";

import { useState } from "react";
import Image from "next/image";

export function MediaLightbox({
  media,
  onClose,
}: {
  media: { id: string; url: string; mediaType: string }[];
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const m = media[idx] ?? media[0];
  if (!m) return null;

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.93)", zIndex: 1100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <button
        onClick={onClose}
        style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.15)", border: "none", color: "#fff", fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
      >×</button>

      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 540, padding: "0 16px" }}>
        {m.mediaType === "video" ? (
          <video key={m.url} src={m.url} controls autoPlay style={{ width: "100%", borderRadius: 12, maxHeight: "70dvh" }} />
        ) : (
          <div style={{ position: "relative", width: "100%", height: "70dvh" }}>
            <Image unoptimized src={m.url} alt="" fill sizes="(max-width: 540px) 100vw, 540px" style={{ borderRadius: 12, objectFit: "contain" }} />
          </div>
        )}

        {media.length > 1 && (
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 14 }}>
            {media.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)}
                style={{ width: 8, height: 8, borderRadius: "50%", background: i === idx ? "#fff" : "rgba(255,255,255,.3)", border: "none", cursor: "pointer", padding: 0 }} />
            ))}
          </div>
        )}

        {media.length > 1 && (
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, padding: "0 8px" }}>
            <button onClick={() => setIdx((i) => Math.max(0, i - 1))} disabled={idx === 0}
              style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8, color: "#fff", padding: "8px 18px", fontSize: 14, cursor: "pointer", opacity: idx === 0 ? 0.3 : 1 }}>
              ← Ant.
            </button>
            <button onClick={() => setIdx((i) => Math.min(media.length - 1, i + 1))} disabled={idx === media.length - 1}
              style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8, color: "#fff", padding: "8px 18px", fontSize: 14, cursor: "pointer", opacity: idx === media.length - 1 ? 0.3 : 1 }}>
              Sig. →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
