"use client";

import { useState } from "react";
import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Button, StateBlock } from "@/components/ui";
import type { FoodLogEntry } from "@regen/types";

interface FoodHistoryProps {
  entries: FoodLogEntry[] | null;
  loading: boolean;
  onRefresh: () => void;
}

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  snack: "Snack",
  dinner: "Cena",
};

const QUALITY_CONFIG: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  good: { label: "Buena", color: "var(--success)", bg: "rgba(110,231,168,.12)" },
  regular: { label: "Regular", color: "#FF8E72", bg: "rgba(255,142,114,.12)" },
  poor: { label: "Pobre", color: "var(--danger)", bg: "rgba(255,91,91,.12)" },
};

function formatDay(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();

  if (isToday) return "Hoy";
  if (isYesterday) return "Ayer";

  return date.toLocaleDateString("es", {
    weekday: "long",
    day: "numeric",
    month: "short",
  });
}

function groupByDay(entries: FoodLogEntry[]): Map<string, FoodLogEntry[]> {
  const groups = new Map<string, FoodLogEntry[]>();

  entries.forEach((entry) => {
    const date = new Date(entry.loggedAt).toDateString();
    if (!groups.has(date)) {
      groups.set(date, []);
    }
    groups.get(date)!.push(entry);
  });

  return groups;
}

export function FoodHistory({ entries, loading, onRefresh }: FoodHistoryProps) {
  const { api } = useAuth();
  const toast = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar esta comida?")) return;
    setDeletingId(id);
    try {
      await api.del(`/client/food/${id}`);
      toast.success("Comida eliminada");
      onRefresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al eliminar");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="food-history">
        <div className="fh-header">Historial</div>
        <div className="fh-loading">
          {[1, 2, 3].map((i) => (
            <div key={i} className="fh-skeleton">
              <div className="fh-skeleton-line" />
            </div>
          ))}
        </div>
        <style jsx>{`
          .food-history { width: 100%; }
          .fh-header {
            font-size: 11px;
            color: var(--text-mute);
            text-transform: uppercase;
            letter-spacing: .1em;
            font-weight: 700;
            margin-bottom: 12px;
          }
          .fh-loading {
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .fh-skeleton {
            padding: 16px;
            background: var(--bg-1);
            border: 1px solid var(--line);
            border-radius: 12px;
            opacity: 0.5;
          }
          .fh-skeleton-line {
            height: 16px;
            background: var(--bg-2);
            border-radius: 4px;
            width: 60%;
          }
        `}</style>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="food-history">
        <div className="fh-header">Historial</div>
        <StateBlock kind="empty" title="Sin comidas registradas" body="Registrá tu primera comida arriba." />
        <style jsx>{`
          .food-history { width: 100%; }
          .fh-header {
            font-size: 11px;
            color: var(--text-mute);
            text-transform: uppercase;
            letter-spacing: .1em;
            font-weight: 700;
            margin-bottom: 12px;
          }
        `}</style>
      </div>
    );
  }

  const grouped = groupByDay(entries);
  const sortedDays = Array.from(grouped.keys()).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="food-history">
      <div className="fh-header">Historial · {entries.length} comidas</div>

      <div className="fh-days">
        {sortedDays.map((day) => {
          const dayEntries = grouped.get(day)!.sort(
            (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
          );

          return (
            <div key={day} className="fh-day">
              <div className="fh-day-label">
                {formatDay(dayEntries[0].loggedAt)}
              </div>

              <div className="fh-entries">
                {dayEntries.map((entry) => {
                  const quality = entry.quality ? QUALITY_CONFIG[entry.quality] : null;
                  const mealLabel = entry.mealType ? MEAL_LABELS[entry.mealType] : null;

                  return (
                    <div
                      key={entry.id}
                      className={`fh-entry ${deletingId === entry.id ? 'deleting' : ''}`}
                    >
                      {/* Header row */}
                      <div className="fh-entry-header">
                        <div className="fh-entry-meta">
                          <span className="fh-time">
                            {new Date(entry.loggedAt).toLocaleTimeString("es", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                          {mealLabel && (
                            <span className="fh-meal-tag">{mealLabel}</span>
                          )}
                          {quality && (
                            <span 
                              className="fh-quality-tag"
                              style={{ color: quality.color, background: quality.bg }}
                            >
                              {quality.label}
                            </span>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          icon="trash"
                          disabled={deletingId === entry.id}
                          onClick={() => handleDelete(entry.id)}
                        >
                          Borrar
                        </Button>
                      </div>

                      {/* Macro tags */}
                      {entry.macroTags && entry.macroTags.length > 0 && (
                        <div className="fh-macros">
                          {entry.macroTags.map((tag) => (
                            <span key={tag} className="fh-macro-tag">{tag}</span>
                          ))}
                        </div>
                      )}

                      {/* Text */}
                      {entry.text && (
                        <div className="fh-text">{entry.text}</div>
                      )}

                      {/* Photo */}
                      {entry.photoUrl && (
                        <div className="fh-photo">
                          <a href={entry.photoUrl} target="_blank" rel="noreferrer">
                            <Image
                              src={entry.photoUrl}
                              alt="Foto de comida"
                              width={120}
                              height={120}
                              className="fh-photo-img"
                            />
                          </a>
                        </div>
                      )}

                      {/* Coach comments */}
                      {entry.coachComments && entry.coachComments.length > 0 && (
                        <div className="fh-comments">
                          <div className="fh-comments-header">Comentarios del coach</div>
                          <div className="fh-comments-list">
                            {entry.coachComments.slice(0, 3).map((c) => (
                              <div key={c.id} className="fh-comment">
                                <div className="fh-comment-author">{c.coach.name ?? "Coach"}</div>
                                <div className="fh-comment-text">{c.text}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .food-history {
          width: 100%;
        }
        
        .fh-header {
          font-size: 11px;
          color: var(--text-mute);
          text-transform: uppercase;
          letter-spacing: .1em;
          font-weight: 700;
          margin-bottom: 12px;
        }
        
        @media (min-width: 900px) {
          .fh-header {
            font-size: 12px;
            margin-bottom: 16px;
          }
        }
        
        @media (min-width: 1400px) {
          .fh-header {
            font-size: 13px;
            margin-bottom: 20px;
          }
        }
        
        .fh-days {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        @media (min-width: 900px) {
          .fh-days {
            gap: 24px;
          }
        }
        
        @media (min-width: 1400px) {
          .fh-days {
            gap: 28px;
          }
        }
        
        .fh-day-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-mute);
          margin-bottom: 8px;
          padding-left: 4px;
        }
        
        @media (min-width: 900px) {
          .fh-day-label {
            font-size: 14px;
            margin-bottom: 12px;
          }
        }
        
        @media (min-width: 1400px) {
          .fh-day-label {
            font-size: 15px;
          }
        }
        
        .fh-entries {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        @media (min-width: 900px) {
          .fh-entries {
            gap: 12px;
          }
        }
        
        @media (min-width: 1400px) {
          .fh-entries {
            gap: 16px;
          }
        }
        
        .fh-entry {
          padding: 12px;
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 12px;
          transition: opacity 0.2s;
        }
        
        .fh-entry.deleting {
          opacity: 0.5;
        }
        
        @media (min-width: 900px) {
          .fh-entry {
            padding: 20px;
            border-radius: 14px;
          }
        }
        
        @media (min-width: 1400px) {
          .fh-entry {
            padding: 24px;
          }
        }
        
        .fh-entry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }
        
        @media (min-width: 900px) {
          .fh-entry-header {
            margin-bottom: 12px;
          }
        }
        
        .fh-entry-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        @media (min-width: 900px) {
          .fh-entry-meta {
            gap: 12px;
          }
        }
        
        .fh-time {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--text-mute);
        }
        
        @media (min-width: 900px) {
          .fh-time {
            font-size: 14px;
          }
        }
        
        .fh-meal-tag {
          font-size: 10px;
          font-weight: 600;
          color: var(--text);
          background: var(--bg-2);
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        @media (min-width: 900px) {
          .fh-meal-tag {
            font-size: 12px;
            padding: 4px 10px;
            border-radius: 6px;
          }
        }
        
        .fh-quality-tag {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        @media (min-width: 900px) {
          .fh-quality-tag {
            font-size: 12px;
            padding: 4px 10px;
            border-radius: 6px;
          }
        }
        
        .fh-macros {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          margin-bottom: 8px;
        }
        
        @media (min-width: 900px) {
          .fh-macros {
            gap: 8px;
            margin-bottom: 12px;
          }
        }
        
        .fh-macro-tag {
          font-size: 10px;
          color: var(--lime);
          background: rgba(215,255,58,.12);
          padding: 2px 6px;
          border-radius: 8px;
          border: 1px solid var(--lime);
        }
        
        @media (min-width: 900px) {
          .fh-macro-tag {
            font-size: 12px;
            padding: 4px 10px;
            border-radius: 12px;
          }
        }
        
        @media (min-width: 1400px) {
          .fh-macro-tag {
            font-size: 13px;
            padding: 6px 12px;
          }
        }
        
        .fh-text {
          font-size: 13px;
          color: var(--text);
          margin-bottom: 8px;
          white-space: pre-wrap;
          line-height: 1.5;
        }
        
        @media (min-width: 900px) {
          .fh-text {
            font-size: 15px;
            margin-bottom: 12px;
          }
        }
        
        @media (min-width: 1400px) {
          .fh-text {
            font-size: 16px;
          }
        }
        
        .fh-photo {
          margin-top: 4px;
        }
        
        @media (min-width: 900px) {
          .fh-photo {
            margin-top: 8px;
          }
        }
        
        .fh-photo-img {
          width: 120px;
          height: 120px;
          object-fit: cover;
          border-radius: 10px;
          border: 1px solid var(--line);
        }
        
        @media (min-width: 900px) {
          .fh-photo-img {
            width: 160px;
            height: 160px;
            border-radius: 12px;
          }
        }
        
        @media (min-width: 1400px) {
          .fh-photo-img {
            width: 200px;
            height: 200px;
          }
        }
        
        .fh-comments {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 1px solid var(--line);
        }
        
        @media (min-width: 900px) {
          .fh-comments {
            margin-top: 16px;
            padding-top: 16px;
          }
        }
        
        .fh-comments-header {
          font-size: 10px;
          color: var(--text-mute);
          text-transform: uppercase;
          letter-spacing: .08em;
          font-weight: 700;
          margin-bottom: 8px;
        }
        
        @media (min-width: 900px) {
          .fh-comments-header {
            font-size: 11px;
            margin-bottom: 12px;
          }
        }
        
        .fh-comments-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        @media (min-width: 900px) {
          .fh-comments-list {
            gap: 12px;
          }
        }
        
        .fh-comment {
          padding: 10px 12px;
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 10px;
        }
        
        @media (min-width: 900px) {
          .fh-comment {
            padding: 16px 20px;
            border-radius: 12px;
          }
        }
        
        .fh-comment-author {
          font-size: 12px;
          font-weight: 700;
          color: var(--text);
        }
        
        @media (min-width: 900px) {
          .fh-comment-author {
            font-size: 14px;
          }
        }
        
        .fh-comment-text {
          font-size: 13px;
          color: var(--text);
          margin-top: 2px;
          white-space: pre-wrap;
          line-height: 1.5;
        }
        
        @media (min-width: 900px) {
          .fh-comment-text {
            font-size: 15px;
            margin-top: 4px;
          }
        }
        
        @media (min-width: 1400px) {
          .fh-comment-text {
            font-size: 16px;
          }
        }
      `}</style>
    </div>
  );
}
