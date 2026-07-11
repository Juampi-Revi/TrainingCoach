"use client";

import type {
  WorkoutEffortLabel,
  WorkoutExecutionLabel,
  WorkoutLabelsSummary,
  WorkoutRoleLabel,
} from "@regen/types";
import {
  EFFORT_LABEL_OPTIONS,
  EXECUTION_LABEL_OPTIONS,
  ROLE_LABEL_OPTIONS,
  labelText,
  labelTone,
} from "@/lib/workout-labels";

function pillStyle(active: boolean, toneKey: string): React.CSSProperties {
  const tone = labelTone(toneKey);
  return {
    padding: "7px 10px",
    borderRadius: 999,
    border: `1px solid ${active ? tone.border : "var(--line-2)"}`,
    background: active ? tone.bg : "var(--bg-2)",
    color: active ? tone.text : "var(--text-mute)",
    fontSize: 12,
    fontWeight: 700,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

function PillGroup<T extends string>({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: Array<{ value: T; label: string }>;
  value: T | null;
  onChange: (value: T | null) => void;
}) {
  return (
    <div>
      <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700, marginBottom: 6 }}>
        {title}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(active ? null : option.value)}
              style={pillStyle(active, option.value)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function WorkoutLabelEditor({
  value,
  onChange,
  isExtra,
  onToggleExtra,
  title = "Labels",
  extraLabel = "Marcar como extra",
}: {
  value: WorkoutLabelsSummary;
  onChange: (next: WorkoutLabelsSummary) => void;
  isExtra?: boolean;
  onToggleExtra?: (next: boolean) => void;
  title?: string;
  extraLabel?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div className="ta-mono" style={{ fontSize: 9, color: "var(--text-mute)", letterSpacing: ".1em", fontWeight: 700 }}>
        {title}
      </div>
      {onToggleExtra && (
        <button
          type="button"
          onClick={() => onToggleExtra(!isExtra)}
          style={pillStyle(!!isExtra, "extra")}
        >
          {extraLabel}
        </button>
      )}
      <PillGroup<WorkoutRoleLabel>
        title="Tipo"
        options={ROLE_LABEL_OPTIONS}
        value={value.role}
        onChange={(role) => onChange({ ...value, role })}
      />
      <PillGroup<WorkoutEffortLabel>
        title="Esfuerzo"
        options={EFFORT_LABEL_OPTIONS}
        value={value.effort}
        onChange={(effort) => onChange({ ...value, effort })}
      />
      <PillGroup<WorkoutExecutionLabel>
        title="Ejecución"
        options={EXECUTION_LABEL_OPTIONS}
        value={value.execution}
        onChange={(execution) => onChange({ ...value, execution })}
      />
      <div style={{ fontSize: 11, color: "var(--text-dim)", lineHeight: 1.45 }}>
        Visible siempre para el alumno. Combiná {labelText(value.role) ?? "tipo"}, {labelText(value.effort) ?? "esfuerzo"} y {labelText(value.execution) ?? "ejecución"} según la intención del trabajo.
      </div>
    </div>
  );
}
