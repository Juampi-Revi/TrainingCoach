"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Icon } from "@/components/ui";
import type { TemplateSummary } from "./types";

export function TemplatePicker({
  onSelect,
  onClose,
}: {
  onSelect: (t: TemplateSummary) => void;
  onClose: () => void;
}) {
  const { api } = useAuth();
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get<TemplateSummary[]>("/coach/workouts")
      .then(setTemplates)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [api]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) => t.title.toLowerCase().includes(q));
  }, [templates, search]);

  return (
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
          maxWidth: 460,
          maxHeight: "75vh",
          background: "var(--bg-1)",
          border: "1px solid var(--line)",
          borderRadius: 16,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "18px 20px 12px", borderBottom: "1px solid var(--line)" }}>
          <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>
            Seleccionar entrenamiento
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              height: 40,
              background: "var(--bg-2)",
              border: "1px solid var(--line-2)",
              borderRadius: 10,
              padding: "0 12px",
            }}
          >
            <Icon name="search" size={14} color="var(--text-mute)" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar entrenamiento…"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                color: "var(--text)",
              }}
            />
          </div>
        </div>
        <div style={{ overflowY: "auto", flex: 1 }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>
              Cargando…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-mute)", fontSize: 13 }}>
              Sin resultados
            </div>
          ) : (
            filtered.map((t) => (
              <div
                key={t.id}
                onClick={() => onSelect(t)}
                className="ta-row"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 20px",
                  borderBottom: "1px solid var(--line)",
                  cursor: "pointer",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: "var(--bg-2)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon name="dumbbell" size={16} color="var(--text-mute)" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{t.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 1 }}>
                    {t.exerciseCount} ejercicios{t.tags.length ? ` · ${t.tags.slice(0, 2).join(", ")}` : ""}
                  </div>
                </div>
                <Icon name="plus" size={16} color="var(--text-mute)" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

