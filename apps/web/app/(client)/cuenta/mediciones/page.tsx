"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";
import { useToast } from "@/lib/toast";
import { useAuth } from "@/lib/auth";
import { WeightChart } from "./_components/weight-chart";
import { MetricsHistory } from "./_components/metrics-history";
import { METRIC_FIELDS } from "./metric-fields";
import "./_styles.css";

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

export default function MedicionesPage() {
  const router = useRouter();
  const { api } = useAuth();
  const toast = useToast();
  const [metrics, setMetrics] = useState<MetricEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingShare, setUpdatingShare] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<MetricEntry[]>("/client/metrics");
      setMetrics(data);
    } catch (error) {
      toast.error("Error al cargar mediciones");
    } finally {
      setLoading(false);
    }
  }, [api, toast]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void loadMetrics();
    }, 0);
    return () => window.clearTimeout(t);
  }, [loadMetrics]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
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
  const isInitialLoading = loading && metrics.length === 0;

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
        {isInitialLoading ? (
          <div className="mediciones-skeleton">
            <div className="skeleton-block skeleton-lg" />
            <div className="skeleton-block skeleton-sm skeleton-delay-1" />
            <div className="skeleton-block skeleton-sm skeleton-delay-2" />
          </div>
        ) : (
          <div className="mediciones-grid">
            <div className="mediciones-side">
              <div className="card-cuenta">
                <div className="card-cuenta-row is-disabled">
                  <div className="card-cuenta-left">
                    <Icon name={anyShared ? "eye" : "eyeOff"} size={20} color="var(--lime)" />
                    <span>Compartir con entrenador</span>
                  </div>
                  <div className="card-cuenta-right">
                    <button
                      onClick={toggleShareWithCoach}
                      disabled={!hasMetrics || updatingShare}
                      className={`share-toggle ${anyShared ? "active" : ""}`}
                      aria-label="Compartir con entrenador"
                    >
                      <div className="share-toggle-knob" />
                    </button>
                  </div>
                </div>

                <div className="card-cuenta-row" onClick={() => setShowForm((v) => !v)}>
                  <div className="card-cuenta-left">
                    <Icon name="plus" size={20} color="var(--lime)" />
                    <span>Nueva medición</span>
                  </div>
                  <div className="card-cuenta-right">
                    <Icon name={showForm ? "chevUp" : "chevD"} size={18} color="var(--text-dim)" />
                  </div>
                </div>

                {showForm && (
                  <form onSubmit={handleSubmit} className="card-editor measurement-form" style={{ borderBottom: "none" }}>
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
            </div>

            <div className="mediciones-main">
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
                                const weeks = Math.max(
                                  1,
                                  Math.ceil(
                                    (new Date(metrics[0].measuredAt).getTime() -
                                      new Date(metrics[metrics.length - 1].measuredAt).getTime()) /
                                      (1000 * 60 * 60 * 24 * 7)
                                  )
                                );
                                const isPositive = diff > 0;
                                return (
                                  <div className={`progress-total ${isPositive ? "up" : "down"}`}>
                                    <span className="progress-arrow">{isPositive ? "↑" : "↓"}</span>
                                    <span className="progress-value">{Math.abs(diff).toFixed(1)} kg</span>
                                    <span className="progress-time">
                                      en {weeks} semana{weeks > 1 ? "s" : ""}
                                    </span>
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
                            const weightMetrics = metrics
                              .filter((m) => m.weightKg)
                              .map((m) => ({
                                date: new Date(m.measuredAt),
                                weight: parseFloat(m.weightKg!),
                              }));

                            if (weightMetrics.length >= 2) {
                              const weights = weightMetrics.map((m) => m.weight);
                              const max = Math.max(...weights);
                              const min = Math.min(...weights);
                              const first = weights[weights.length - 1];
                              const latest = weights[0];
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

              {hasMetrics && <MetricsHistory metrics={metrics} onDelete={handleDelete} />}

              {!hasMetrics && (
                <div className="empty-state">
                  <div className="empty-icon">
                    <Icon name="chart" size={48} color="var(--text-mute)" />
                  </div>
                  <div className="empty-title">Sin mediciones</div>
                  <div className="empty-desc">
                    Comenzá a registrar tus mediciones para hacer un seguimiento de tu progreso físico. Podés registrar
                    peso, medidas corporales y más.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
