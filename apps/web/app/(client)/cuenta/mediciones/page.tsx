"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { createClient } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { useAuth } from "@/lib/auth";

interface MetricEntry {
  id: string;
  measuredAt: string;
  weightKg: string | null;
  waistCm: string | null;
  chestCm: string | null;
  hipsCm: string | null;
  armCm: string | null;
  thighCm: string | null;
  notes: string | null;
  shareWithCoach: boolean;
}

// Componente de gráfico simple
function WeightChart({ metrics }: { metrics: MetricEntry[] }) {
  const weightData = metrics
    .filter(m => m.weightKg)
    .map(m => ({ date: new Date(m.measuredAt), weight: parseFloat(m.weightKg!) }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  
  if (weightData.length < 2) return null;
  
  const weights = weightData.map(d => d.weight);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const range = max - min || 1;
  
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const width = 100;
  const height = 60;
  
  const points = weightData.map((d, i) => {
    const x = padding.left + (i / (weightData.length - 1)) * (width - padding.left - padding.right);
    const y = padding.top + (1 - (d.weight - min) / range) * (height - padding.top - padding.bottom);
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="weight-chart">
      {/* Grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => (
        <line
          key={i}
          x1={padding.left}
          y1={padding.top + pct * (height - padding.top - padding.bottom)}
          x2={width - padding.right}
          y2={padding.top + pct * (height - padding.top - padding.bottom)}
          stroke="var(--line)"
          strokeWidth="0.5"
          strokeDasharray="2,2"
        />
      ))}
      
      {/* Y-axis labels */}
      {[0, 0.5, 1].map((pct, i) => (
        <text
          key={i}
          x={padding.left - 5}
          y={padding.top + pct * (height - padding.top - padding.bottom) + 2}
          textAnchor="end"
          fontSize="4"
          fill="var(--text-mute)"
        >
          {(max - pct * range).toFixed(1)}
        </text>
      ))}
      
      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke="var(--lime)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      
      {/* Points */}
      {weightData.map((d, i) => {
        const x = padding.left + (i / (weightData.length - 1)) * (width - padding.left - padding.right);
        const y = padding.top + (1 - (d.weight - min) / range) * (height - padding.top - padding.bottom);
        const isLast = i === weightData.length - 1;
        return (
          <g key={i}>
            <circle
              cx={x}
              cy={y}
              r={isLast ? 4 : 2.5}
              fill={isLast ? "var(--lime)" : "var(--bg-1)"}
              stroke="var(--lime)"
              strokeWidth="1.5"
            />
            {isLast && (
              <text
                x={x}
                y={y - 8}
                textAnchor="middle"
                fontSize="4"
                fill="var(--lime)"
                fontWeight="bold"
              >
                {d.weight.toFixed(1)}
              </text>
            )}
          </g>
        );
      })}
      
      {/* X-axis labels - first and last date */}
      <text
        x={padding.left}
        y={height - 5}
        textAnchor="start"
        fontSize="4"
        fill="var(--text-mute)"
      >
        {weightData[0].date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
      </text>
      <text
        x={width - padding.right}
        y={height - 5}
        textAnchor="end"
        fontSize="4"
        fill="var(--text-mute)"
      >
        {weightData[weightData.length - 1].date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
      </text>
    </svg>
  );
}

const METRIC_FIELDS = [
  { key: "weightKg", label: "Peso", unit: "kg", icon: "scale" as const, step: 0.1 },
  { key: "waistCm", label: "Cintura", unit: "cm", icon: "ruler" as const, step: 0.5 },
  { key: "chestCm", label: "Pecho", unit: "cm", icon: "chest" as const, step: 0.5 },
  { key: "hipsCm", label: "Cadera", unit: "cm", icon: "hips" as const, step: 0.5 },
  { key: "armCm", label: "Brazo", unit: "cm", icon: "arm" as const, step: 0.5 },
  { key: "thighCm", label: "Muslo", unit: "cm", icon: "leg" as const, step: 0.5 },
] as const;

export default function MedicionesPage() {
  const router = useRouter();
  const { token } = useAuth();
  const toast = useToast();
  const api = createClient(token);
  const [metrics, setMetrics] = useState<MetricEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingShare, setUpdatingShare] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    loadMetrics();
  }, []);

  async function loadMetrics() {
    try {
      setLoading(true);
      const data = await api.get<MetricEntry[]>("/client/metrics");
      setMetrics(data);
    } catch (error) {
      toast.error("Error al cargar mediciones");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    const hasValue = METRIC_FIELDS.some((f) => formData[f.key] && parseFloat(formData[f.key]) > 0);
    if (!hasValue) {
      toast.error("Ingresa al menos una medición");
      return;
    }

    try {
      setSubmitting(true);
      const payload: Record<string, unknown> = {};
      METRIC_FIELDS.forEach((f) => {
        if (formData[f.key] && parseFloat(formData[f.key]) > 0) {
          payload[f.key] = parseFloat(formData[f.key]);
        }
      });

      await api.post("/client/metrics", payload);
      toast.success("Medición guardada");
      setFormData({});
      setShowForm(false);
      loadMetrics();
    } catch (error) {
      toast.error("Error al guardar medición");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.del(`/client/metrics/${id}`);
      toast.success("Medición eliminada");
      loadMetrics();
    } catch (error) {
      toast.error("Error al eliminar");
    }
  }

  async function toggleShareWithCoach() {
    const newValue = !metrics.some((m) => m.shareWithCoach);
    try {
      setUpdatingShare(true);
      await api.patch("/client/metrics", { shareWithCoach: newValue });
      toast.success(newValue ? "Compartiendo con tu entrenador" : "Dejaste de compartir");
      setMetrics((prev) => prev.map((m) => ({ ...m, shareWithCoach: newValue })));
    } catch (error) {
      toast.error("Error al actualizar configuración");
    } finally {
      setUpdatingShare(false);
    }
  }

  function formatDiff(current: string | null, previous: string | null): { value: string; positive: boolean } | null {
    if (!current || !previous) return null;
    const diff = parseFloat(current) - parseFloat(previous);
    if (isNaN(diff)) return null;
    return {
      value: diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1),
      positive: diff > 0,
    };
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  }

  const latestMetric = metrics[0];
  const previousMetric = metrics[1];
  const hasMetrics = metrics.length > 0;
  const anyShared = metrics.some((m) => m.shareWithCoach);

  if (loading) {
    return (
      <div className="mediciones-page">
        <div className="mediciones-header">
          <button onClick={() => router.back()} className="back-button">
            <Icon name="chevL" size={16} color="var(--text-mute)" />
            Volver
          </button>
          <div className="mediciones-title">Mediciones</div>
          <div className="mediciones-subtitle">Registra tu progreso físico</div>
        </div>
        <div className="mediciones-content">
          <div className="loading-state">
            <Icon name="refresh" size={32} color="var(--text-mute)" />
            <div className="loading-text">Cargando mediciones...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mediciones-page">
      <div className="mediciones-header">
        <button onClick={() => router.back()} className="back-button">
          <Icon name="chevL" size={16} color="var(--text-mute)" />
          Volver
        </button>
        <div className="mediciones-title">Mediciones</div>
        <div className="mediciones-subtitle">Registra tu progreso físico</div>
      </div>

      <div className="mediciones-content">
        <div className="share-section">
          <div className="share-card">
            <div className="share-info">
              <div className="share-icon">
                <Icon name={anyShared ? "eye" : "eyeOff"} size={20} color="var(--lime)" />
              </div>
              <div className="share-text">
                <div className="share-title">Compartir con entrenador</div>
                <div className="share-desc">
                  {anyShared ? "Tu entrenador puede ver tus mediciones" : "Las mediciones son privadas"}
                </div>
              </div>
            </div>
            <button
              onClick={toggleShareWithCoach}
              disabled={updatingShare}
              className={`share-toggle ${anyShared ? "active" : ""}`}
            >
              <div className="share-toggle-knob" />
            </button>
          </div>
        </div>

        {hasMetrics && latestMetric && (
          <>
            <div className="latest-section">
              <div className="section-label">Última medición</div>
              <div className="latest-card">
                <div className="latest-date">
                  <Icon name="calendar" size={14} color="var(--text-mute)" />
                  {formatDate(latestMetric.measuredAt)}
                </div>
                <div className="metrics-grid">
                  {METRIC_FIELDS.map((field) => {
                    const value = latestMetric[field.key as keyof MetricEntry] as string | null;
                    if (!value) return null;
                    const prevValue = previousMetric?.[field.key as keyof MetricEntry] as string | null;
                    const diff = formatDiff(value, prevValue);

                    return (
                      <div key={field.key} className="metric-item">
                        <div className="metric-icon">
                          <Icon name={field.icon} size={20} color="var(--lime)" />
                        </div>
                        <div className="metric-data">
                          <div className="metric-label">{field.label}</div>
                          <div className="metric-value-row">
                            <span className="metric-value">{parseFloat(value).toFixed(1)}</span>
                            <span className="metric-unit">{field.unit}</span>
                            {diff && (
                              <span className={`metric-diff ${diff.positive ? "up" : "down"}`}>
                                {diff.positive ? "↑" : "↓"} {diff.value}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {latestMetric.notes && (
                  <div className="latest-notes">
                    <Icon name="msg" size={14} color="var(--text-mute)" />
                    {latestMetric.notes}
                  </div>
                )}
              </div>
            </div>

            {metrics.length >= 2 && (
              <div className="progress-section">
                <div className="section-label">Tu progreso</div>
                <div className="progress-card">
                  <div className="progress-header">
                    <div className="progress-title">
                      <Icon name="chart" size={18} color="var(--lime)" />
                      Evolución del peso
                    </div>
                    <div className="progress-summary">
                      {(() => {
                        const firstWeight = metrics[metrics.length - 1]?.weightKg;
                        const latestWeight = metrics[0]?.weightKg;
                        if (firstWeight && latestWeight) {
                          const diff = parseFloat(latestWeight) - parseFloat(firstWeight);
                          const weeks = Math.max(1, Math.ceil((new Date(metrics[0].measuredAt).getTime() - new Date(metrics[metrics.length - 1].measuredAt).getTime()) / (1000 * 60 * 60 * 24 * 7)));
                          const isPositive = diff > 0;
                          return (
                            <div className={`progress-total ${isPositive ? 'up' : 'down'}`}>
                              <span className="progress-arrow">{isPositive ? '↑' : '↓'}</span>
                              <span className="progress-value">{Math.abs(diff).toFixed(1)} kg</span>
                              <span className="progress-time">en {weeks} semana{weeks > 1 ? 's' : ''}</span>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                  
                  <div className="chart-container">
                    <WeightChart metrics={metrics} />
                  </div>

                  <div className="progress-stats">
                    {(() => {
                      const weightMetrics = metrics.filter(m => m.weightKg).map(m => ({ 
                        date: new Date(m.measuredAt), 
                        weight: parseFloat(m.weightKg!) 
                      }));
                      
                      if (weightMetrics.length >= 2) {
                        const weights = weightMetrics.map(m => m.weight);
                        const max = Math.max(...weights);
                        const min = Math.min(...weights);
                        const first = weights[weights.length - 1];
                        const latest = weights[0];
                        const totalChange = latest - first;
                        const avg = weights.reduce((a, b) => a + b, 0) / weights.length;
                        
                        return (
                          <>
                            <div className="stat-item">
                              <div className="stat-label">Inicio</div>
                              <div className="stat-value">{first.toFixed(1)} kg</div>
                            </div>
                            <div className="stat-item">
                              <div className="stat-label">Actual</div>
                              <div className="stat-value highlight">{latest.toFixed(1)} kg</div>
                            </div>
                            <div className="stat-item">
                              <div className="stat-label">Máximo</div>
                              <div className="stat-value">{max.toFixed(1)} kg</div>
                            </div>
                            <div className="stat-item">
                              <div className="stat-label">Mínimo</div>
                              <div className="stat-value">{min.toFixed(1)} kg</div>
                            </div>
                            <div className="stat-item">
                              <div className="stat-label">Promedio</div>
                              <div className="stat-value">{avg.toFixed(1)} kg</div>
                            </div>
                            <div className="stat-item">
                              <div className="stat-label">Medidas</div>
                              <div className="stat-value">{weightMetrics.length}</div>
                            </div>
                          </>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        <div className="add-section">
          {!showForm ? (
            <button onClick={() => setShowForm(true)} className="add-button">
              <Icon name="plus" size={18} color="var(--bg)" />
              Nueva medición
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="measurement-form">
              <div className="form-header">
                <div className="form-title">Nueva medición</div>
                <button type="button" onClick={() => setShowForm(false)} className="form-close">
                  <Icon name="x" size={18} color="var(--text-mute)" />
                </button>
              </div>
              <div className="form-grid">
                {METRIC_FIELDS.map((field) => (
                  <div key={field.key} className="form-field">
                    <label className="form-label">
                      <Icon name={field.icon} size={14} color="var(--text-mute)" />
                      {field.label}
                    </label>
                    <div className="form-input-wrapper">
                      <input
                        type="number"
                        step={field.step}
                        value={formData[field.key] || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, [field.key]: e.target.value }))}
                        className="form-input"
                        placeholder="0"
                      />
                      <span className="form-input-unit">{field.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setShowForm(false)} className="form-btn cancel">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting} className="form-btn save">
                  {submitting ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          )}
        </div>

        {hasMetrics && (
          <div className="history-section">
            <div className="section-label">Historial</div>
            <div className="history-list">
              {metrics.slice(1, 11).map((metric) => (
                <div key={metric.id} className="history-item">
                  <div className="history-date">
                    <Icon name="calendar" size={12} color="var(--text-mute)" />
                    {formatDate(metric.measuredAt)}
                  </div>
                  <div className="history-metrics">
                    {METRIC_FIELDS.map((field) => {
                      const value = metric[field.key as keyof MetricEntry] as string | null;
                      if (!value) return null;
                      return (
                        <span key={field.key} className="history-metric">
                          {field.label}: {parseFloat(value).toFixed(1)}{field.unit}
                        </span>
                      );
                    })}
                  </div>
                  <button onClick={() => handleDelete(metric.id)} className="history-delete" title="Eliminar">
                    <Icon name="trash" size={14} color="var(--text-mute)" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {!hasMetrics && (
          <div className="empty-state">
            <div className="empty-icon">
              <Icon name="chart" size={48} color="var(--text-mute)" />
            </div>
            <div className="empty-title">Sin mediciones</div>
            <div className="empty-desc">
              Comenzá a registrar tus mediciones para hacer un seguimiento de tu progreso físico. 
              Podés registrar peso, medidas corporales y más.
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .mediciones-page {
          min-height: 100dvh;
          background: var(--bg);
          padding-bottom: calc(100px + env(safe-area-inset-bottom));
        }

        .mediciones-header {
          padding: 20px 16px 16px;
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          color: var(--text-mute);
          font-size: 14px;
          padding: 0;
          margin-bottom: 16px;
          transition: color 0.2s ease;
        }

        .back-button:hover {
          color: var(--text);
        }

        .mediciones-title {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 6px;
        }

        .mediciones-subtitle {
          font-size: 13px;
          color: var(--text-mute);
        }

        .mediciones-content {
          padding: 0 16px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          gap: 16px;
        }

        .loading-text {
          font-size: 14px;
          color: var(--text-mute);
        }

        .share-section {
          margin-top: 4px;
        }

        .share-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 14px;
        }

        .share-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .share-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(215, 255, 58, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .share-title {
          font-size: 15px;
          font-weight: 600;
          letter-spacing: -0.01em;
        }

        .share-desc {
          font-size: 12px;
          color: var(--text-mute);
          margin-top: 2px;
        }

        .share-toggle {
          width: 52px;
          height: 28px;
          border-radius: 14px;
          background: var(--bg-2);
          border: 2px solid var(--line);
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
          padding: 0;
        }

        .share-toggle.active {
          background: var(--lime);
          border-color: var(--lime);
        }

        .share-toggle:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .share-toggle-knob {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--text);
          position: absolute;
          top: 2px;
          left: 2px;
          transition: transform 0.2s ease;
        }

        .share-toggle.active .share-toggle-knob {
          transform: translateX(24px);
          background: var(--bg);
        }

        .section-label {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-mute);
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }

        .latest-section {
          margin-top: 4px;
        }

        .latest-card {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 20px;
        }

        .latest-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          color: var(--text-mute);
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--line);
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        .metric-item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .metric-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(215, 255, 58, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .metric-data {
          flex: 1;
          min-width: 0;
        }

        .metric-label {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-mute);
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .metric-value-row {
          display: flex;
          align-items: baseline;
          gap: 4px;
          flex-wrap: wrap;
        }

        .metric-value {
          font-size: 22px;
          font-weight: 700;
          color: var(--lime);
          line-height: 1;
        }

        .metric-unit {
          font-size: 12px;
          color: var(--text-mute);
        }

        .metric-diff {
          font-size: 11px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: auto;
        }

        .metric-diff.up {
          color: var(--danger);
          background: rgba(255, 91, 91, 0.15);
        }

        .metric-diff.down {
          color: var(--lime);
          background: rgba(215, 255, 58, 0.15);
        }

        .latest-notes {
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid var(--line);
          font-size: 13px;
          color: var(--text-mute);
          display: flex;
          align-items: flex-start;
          gap: 8px;
          line-height: 1.5;
        }

        .progress-section {
          margin-top: 4px;
        }

        .progress-card {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 20px;
        }

        .progress-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .progress-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 700;
        }

        .progress-summary {
          display: flex;
          align-items: center;
        }

        .progress-total {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
        }

        .progress-total.up {
          color: var(--danger);
          background: rgba(255, 91, 91, 0.15);
        }

        .progress-total.down {
          color: var(--lime);
          background: rgba(215, 255, 58, 0.15);
        }

        .progress-arrow {
          font-size: 14px;
        }

        .progress-value {
          font-size: 14px;
        }

        .progress-time {
          font-size: 11px;
          opacity: 0.8;
          margin-left: 4px;
        }

        .chart-container {
          background: var(--bg);
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          border: 1px solid var(--line);
        }

        .weight-chart {
          width: 100%;
          height: 200px;
          overflow: visible;
        }

        .progress-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid var(--line);
        }

        .stat-item {
          text-align: center;
          padding: 10px 8px;
          background: var(--bg);
          border-radius: 10px;
          border: 1px solid var(--line);
        }

        .stat-label {
          font-family: var(--font-mono);
          font-size: 8px;
          color: var(--text-mute);
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 15px;
          font-weight: 700;
          color: var(--text);
        }

        .stat-value.highlight {
          color: var(--lime);
        }

        .add-section {
          margin-top: 4px;
        }

        .add-button {
          width: 100%;
          padding: 16px;
          background: var(--lime);
          border: none;
          border-radius: 12px;
          color: var(--bg);
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .add-button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .measurement-form {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 20px;
        }

        .form-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid var(--line);
        }

        .form-title {
          font-size: 16px;
          font-weight: 700;
        }

        .form-close {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: var(--bg-2);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .form-close:hover {
          background: var(--line);
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-label {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: var(--text-mute);
          font-weight: 500;
        }

        .form-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .form-input {
          width: 100%;
          padding: 10px 12px;
          padding-right: 36px;
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 10px;
          color: var(--text);
          font-size: 15px;
          font-weight: 600;
          outline: none;
          transition: all 0.2s ease;
        }

        .form-input:focus {
          border-color: var(--lime);
        }

        .form-input::-webkit-outer-spin-button,
        .form-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .form-input-unit {
          position: absolute;
          right: 10px;
          font-size: 12px;
          color: var(--text-mute);
          pointer-events: none;
        }

        .form-actions {
          display: flex;
          gap: 10px;
        }

        .form-btn {
          flex: 1;
          padding: 12px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
        }

        .form-btn.cancel {
          background: var(--bg-2);
          color: var(--text);
        }

        .form-btn.cancel:hover {
          background: var(--line);
        }

        .form-btn.save {
          background: var(--lime);
          color: var(--bg);
        }

        .form-btn.save:hover:not(:disabled) {
          opacity: 0.9;
        }

        .form-btn.save:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .history-section {
          margin-top: 4px;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .history-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .history-item:hover {
          background: var(--bg-2);
          border-color: var(--line);
        }

        .history-date {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--text-mute);
          white-space: nowrap;
          min-width: 90px;
        }

        .history-metrics {
          flex: 1;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .history-metric {
          font-size: 13px;
          color: var(--text);
          background: rgba(215, 255, 58, 0.1);
          padding: 4px 8px;
          border-radius: 6px;
        }

        .history-delete {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: transparent;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .history-delete:hover {
          background: rgba(255, 91, 91, 0.1);
        }

        .empty-state {
          text-align: center;
          padding: 40px 24px;
          margin-top: 20px;
        }

        .empty-icon {
          margin-bottom: 16px;
          opacity: 0.5;
        }

        .empty-title {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .empty-desc {
          font-size: 14px;
          color: var(--text-mute);
          max-width: 320px;
          margin: 0 auto;
          line-height: 1.5;
        }

        @media (min-width: 768px) {
          .mediciones-page {
            padding-bottom: 32px;
          }

          .mediciones-header {
            padding: 48px 28px 24px;
            border-bottom: 1px solid var(--line);
          }

          .mediciones-title {
            font-size: 32px;
          }

          .mediciones-subtitle {
            font-size: 15px;
          }

          .mediciones-content {
            padding: 0 28px;
            max-width: 900px;
            margin: 0 auto;
            gap: 24px;
          }

          .share-section,
          .latest-section,
          .progress-section,
          .add-section,
          .history-section {
            margin-top: 8px;
          }

          .share-card {
            padding: 20px 24px;
            border-radius: 16px;
          }

          .share-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
          }

          .share-title {
            font-size: 16px;
          }

          .share-desc {
            font-size: 14px;
          }

          .section-label {
            font-size: 10px;
            margin-bottom: 12px;
          }

          .latest-card {
            padding: 24px;
            border-radius: 16px;
          }

          .latest-date {
            font-size: 14px;
            margin-bottom: 20px;
            padding-bottom: 16px;
          }

          .metrics-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }

          .metric-icon {
            width: 44px;
            height: 44px;
            border-radius: 12px;
          }

          .metric-value {
            font-size: 28px;
          }

          .metric-unit {
            font-size: 13px;
          }

          .metric-diff {
            font-size: 12px;
            padding: 3px 8px;
          }

          .latest-notes {
            margin-top: 20px;
            padding-top: 16px;
            font-size: 14px;
          }

          .progress-section {
            margin-top: 8px;
          }

          .progress-card {
            padding: 24px;
            border-radius: 16px;
          }

          .progress-header {
            margin-bottom: 20px;
          }

          .progress-title {
            font-size: 17px;
          }

          .progress-total {
            padding: 8px 16px;
            font-size: 14px;
          }

          .progress-value {
            font-size: 15px;
          }

          .chart-container {
            padding: 20px;
            margin-bottom: 20px;
          }

          .weight-chart {
            height: 240px;
          }

          .progress-stats {
            grid-template-columns: repeat(6, 1fr);
            gap: 16px;
            padding-top: 20px;
          }

          .stat-item {
            padding: 14px 10px;
          }

          .stat-label {
            font-size: 9px;
            margin-bottom: 6px;
          }

          .stat-value {
            font-size: 17px;
          }

          .add-button {
            padding: 18px;
            font-size: 16px;
          }

          .measurement-form {
            padding: 24px;
            border-radius: 16px;
          }

          .form-header {
            margin-bottom: 20px;
            padding-bottom: 16px;
          }

          .form-title {
            font-size: 18px;
          }

          .form-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 16px;
            margin-bottom: 20px;
          }

          .form-label {
            font-size: 12px;
          }

          .form-input {
            padding: 12px 14px;
            padding-right: 40px;
            font-size: 16px;
          }

          .form-input-unit {
            font-size: 13px;
          }

          .form-actions {
            gap: 12px;
          }

          .form-btn {
            padding: 14px;
            font-size: 15px;
          }

          .history-item {
            padding: 16px 20px;
            border-radius: 14px;
          }

          .history-date {
            font-size: 13px;
            min-width: 110px;
          }

          .history-metric {
            font-size: 14px;
            padding: 5px 10px;
          }

          .empty-state {
            padding: 60px 24px;
          }

          .empty-icon {
            transform: scale(1.2);
          }

          .empty-title {
            font-size: 20px;
          }

          .empty-desc {
            font-size: 15px;
            max-width: 400px;
          }
        }

        @media (min-width: 1200px) {
          .mediciones-header {
            padding: 48px 48px 24px;
          }

          .mediciones-content {
            padding: 0 48px;
            max-width: 1100px;
          }

          .metrics-grid {
            gap: 24px;
          }

          .metric-value {
            font-size: 32px;
          }

          .weight-chart {
            height: 280px;
          }

          .progress-stats {
            gap: 20px;
          }
        }
      `}</style>
    </div>
  );
}
