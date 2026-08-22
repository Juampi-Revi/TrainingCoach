"use client";

export type PlanZoom = "structure" | "detail" | "preview";

const OPTIONS: Array<{ id: PlanZoom; label: string }> = [
  { id: "structure", label: "Estructura" },
  { id: "detail", label: "Detalle" },
  { id: "preview", label: "Vista alumno" },
];

export function PlanZoomToggle({
  value,
  onChange,
}: {
  value: PlanZoom;
  onChange: (next: PlanZoom) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Nivel de zoom del plan"
      style={{
        display: "inline-flex",
        gap: 2,
        padding: 3,
        borderRadius: 10,
        border: "1px solid var(--line-2)",
        background: "var(--bg-2)",
      }}
    >
      {OPTIONS.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            style={{
              border: "none",
              cursor: "pointer",
              padding: "6px 10px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "var(--font-sans)",
              background: active ? "var(--bg-1)" : "transparent",
              color: active ? "var(--text)" : "var(--text-mute)",
              boxShadow: active ? "var(--shadow-sm)" : "none",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
