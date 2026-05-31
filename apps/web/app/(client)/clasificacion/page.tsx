"use client";

import { useState } from "react";
import Image from "next/image";
import { useLeaderboard } from "@/lib/hooks/use-leaderboard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { LeaderboardMetric, LeaderboardPeriod } from "@regen/types";

const METRIC_OPTIONS: { value: LeaderboardMetric; label: string; unit: string }[] = [
  { value: "workouts", label: "Entrenamientos", unit: "" },
  { value: "volume", label: "Volumen", unit: "kg" },
  { value: "xp", label: "XP", unit: "" },
  { value: "streak", label: "Racha", unit: "días" },
];

const PERIOD_OPTIONS: { value: LeaderboardPeriod; label: string }[] = [
  { value: "weekly", label: "Semanal" },
  { value: "monthly", label: "Mensual" },
  { value: "allTime", label: "Histórico" },
];

export default function ClasificacionPage() {
  const [metric, setMetric] = useState<LeaderboardMetric>("workouts");
  const [period, setPeriod] = useState<LeaderboardPeriod>("weekly");
  const [friendsOnly, setFriendsOnly] = useState(false);

  const { data, isLoading } = useLeaderboard(metric, period, friendsOnly);

  const metricConfig = METRIC_OPTIONS.find((m) => m.value === metric)!;

  return (
    <div className="clasificacion-page">
      <header className="clasificacion-header">
        <h1>Clasificación</h1>
        <p className="subtitle">Competí contra otros atletas</p>
      </header>

      {/* Filters */}
      <div className="leaderboard-filters">
        {/* Metric selector */}
        <div className="filter-group">
          <label>Métrica</label>
          <div className="filter-buttons">
            {METRIC_OPTIONS.map((m) => (
              <button
                key={m.value}
                className={metric === m.value ? "active" : ""}
                onClick={() => setMetric(m.value)}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Period selector */}
        <div className="filter-group">
          <label>Período</label>
          <div className="filter-buttons">
            {PERIOD_OPTIONS.map((p) => (
              <button
                key={p.value}
                className={period === p.value ? "active" : ""}
                onClick={() => setPeriod(p.value)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Friends toggle */}
        <div className="filter-group">
          <label>Filtrar</label>
          <div className="filter-buttons">
            <button
              className={!friendsOnly ? "active" : ""}
              onClick={() => setFriendsOnly(false)}
            >
              Global
            </button>
            <button
              className={friendsOnly ? "active" : ""}
              onClick={() => setFriendsOnly(true)}
            >
              Amigos
            </button>
          </div>
        </div>
      </div>

      {/* Stats summary */}
      {data && !isLoading && (
        <div className="leaderboard-summary">
          <div className="stat-card">
            <span className="stat-value">{data.currentUserRank ?? "-"}</span>
            <span className="stat-label">Tu posición</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {data.currentUserValue ?? 0}
              {metricConfig.unit && <small>{metricConfig.unit}</small>}
            </span>
            <span className="stat-label">Tu {metricConfig.label.toLowerCase()}</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{data.totalParticipants}</span>
            <span className="stat-label">Participantes</span>
          </div>
        </div>
      )}

      {/* Leaderboard table */}
      <div className="leaderboard-table-container">
        {isLoading ? (
          <LeaderboardSkeleton />
        ) : data ? (
          <LeaderboardTable entries={data.entries} metric={metric} />
        ) : null}
      </div>
    </div>
  );
}

interface LeaderboardTableProps {
  entries: Array<{
    rank: number;
    userId: string;
    name: string;
    avatarUrl: string | null;
    value: number;
    isCurrentUser: boolean;
  }>;
  metric: LeaderboardMetric;
}

function LeaderboardTable({ entries, metric }: LeaderboardTableProps) {
  const metricConfig = METRIC_OPTIONS.find((m) => m.value === metric)!;

  const getRankStyle = (rank: number) => {
    if (rank === 1) return { color: "#FFD700" }; // Gold
    if (rank === 2) return { color: "#C0C0C0" }; // Silver
    if (rank === 3) return { color: "#CD7F32" }; // Bronze
    return {};
  };

  return (
    <table className="leaderboard-table">
      <thead>
        <tr>
          <th>Posición</th>
          <th>Atleta</th>
          <th>{metricConfig.label}</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => (
          <tr
            key={entry.userId}
            className={entry.isCurrentUser ? "current-user" : ""}
          >
            <td className="rank-cell" style={getRankStyle(entry.rank)}>
              {entry.rank === 1 && "🥇"}
              {entry.rank === 2 && "🥈"}
              {entry.rank === 3 && "🥉"}
              {entry.rank > 3 && entry.rank}
            </td>
            <td className="user-cell">
              <div className="user-avatar">
                {entry.avatarUrl ? (
                  <Image src={entry.avatarUrl} alt={entry.name} width={32} height={32} unoptimized />
                ) : (
                  <span>{entry.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="user-name">{entry.name}</span>
              {entry.isCurrentUser && <span className="you-badge">Vos</span>}
            </td>
            <td className="value-cell">
              {entry.value.toLocaleString()}
              {metricConfig.unit && <small>{metricConfig.unit}</small>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LeaderboardSkeleton() {
  return (
    <div className="leaderboard-skeleton">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
        <div key={i} className="skeleton-row">
          <Skeleton width={40} height={24} />
          <Skeleton width={150} height={24} />
          <Skeleton width={80} height={24} />
        </div>
      ))}
    </div>
  );
}
