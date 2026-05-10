"use client";

import { Icon } from "@/components/ui";
import { METRIC_FIELDS } from "../metric-fields";

type MetricFieldKey = (typeof METRIC_FIELDS)[number]["key"];
type MetricEntryLike = {
  id: string;
  measuredAt: string;
} & Partial<Record<MetricFieldKey, string | null>>;

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

export function MetricsHistory({
  metrics,
  onDelete,
}: {
  metrics: MetricEntryLike[];
  onDelete: (id: string) => void;
}) {
  const items = metrics.slice(1, 11);
  if (items.length === 0) return null;

  return (
    <div className="history-section">
      <div className="section-label">Historial</div>
      <div className="history-list">
        {items.map((metric) => (
          <div key={metric.id} className="history-item">
            <div className="history-date">
              <Icon name="calendar" size={12} color="var(--text-mute)" />
              {formatDate(metric.measuredAt)}
            </div>
            <div className="history-metrics">
              {METRIC_FIELDS.map((field) => {
                const value = metric[field.key];
                if (!value) return null;
                return (
                  <span key={field.key} className="history-metric">
                    {field.label}: {parseFloat(value).toFixed(1)}
                    {field.unit}
                  </span>
                );
              })}
            </div>
            <button onClick={() => onDelete(metric.id)} className="history-delete" title="Eliminar">
              <Icon name="trash" size={14} color="var(--text-mute)" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
