"use client";

import { useState } from "react";
import { useBadges } from "@/lib/hooks/use-badges";
import { BadgeCard } from "../_components/badge-card";
import { Button, Icon } from "@/components/ui";

const CATEGORIES = [
  { id: "all", name: "Todos", icon: "star" },
  { id: "steps", name: "Pasos", icon: "footprint" },
  { id: "workouts", name: "Entrenos", icon: "dumbbell" },
  { id: "streak", name: "Rachas", icon: "flame" },
  { id: "nutrition", name: "Nutrición", icon: "target" },
  { id: "social", name: "Social", icon: "users" },
  { id: "special", name: "Especiales", icon: "star" },
] as const;

export default function BadgesPage() {
  const { badges, unlockedBadges, lockedBadges, stats, loading, markAllAsViewed } = useBadges();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showUnlockedOnly, setShowUnlockedOnly] = useState(false);

  const filteredBadges = badges.filter((badge) => {
    if (selectedCategory !== "all" && badge.category !== selectedCategory) return false;
    if (showUnlockedOnly && !badge.unlocked) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="badges-page">
        <div className="badges-loading">
          <Icon name="star" size={48} color="var(--text-mute)" />
          <p>Cargando logros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="badges-page">
      {/* Header */}
      <div className="badges-header">
        <div className="badges-title-section">
          <h1 className="badges-title">Logros</h1>
          <p className="badges-subtitle">
            Has desbloqueado {stats.unlocked} de {stats.total} logros
          </p>
        </div>

        {stats.unviewed > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsViewed}>
            <Icon name="check" size={16} />
            Marcar todos como vistos
          </Button>
        )}
      </div>

      {/* Stats */}
      <div className="badges-stats">
        <div className="stat-item">
          <div className="stat-value">{stats.unlocked}</div>
          <div className="stat-label">Desbloqueados</div>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <div className="stat-value">{stats.total - stats.unlocked}</div>
          <div className="stat-label">Por desbloquear</div>
        </div>
        <div className="stat-divider" />
        <div className="stat-item">
          <div className="stat-value">
            {Math.round((stats.unlocked / stats.total) * 100)}%
          </div>
          <div className="stat-label">Completado</div>
        </div>
      </div>

      {/* Filters */}
      <div className="badges-filters">
        <div className="category-tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`category-tab ${selectedCategory === cat.id ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <Icon
                name={cat.icon as any}
                size={16}
                color={selectedCategory === cat.id ? "var(--text)" : "var(--text-mute)"}
              />
              {cat.name}
            </button>
          ))}
        </div>

        <label className="filter-toggle">
          <input
            type="checkbox"
            checked={showUnlockedOnly}
            onChange={(e) => setShowUnlockedOnly(e.target.checked)}
          />
          <span>Solo desbloqueados</span>
        </label>
      </div>

      {/* Badges Grid */}
      <div className="badges-grid">
        {filteredBadges.length === 0 ? (
          <div className="badges-empty">
            <Icon name="star" size={48} color="var(--text-mute)" />
            <p>No hay logros que coincidan con los filtros</p>
          </div>
        ) : (
          filteredBadges.map((badge) => <BadgeCard key={badge.id} badge={badge} />)
        )}
      </div>

      <style jsx>{`
        .badges-page {
          min-height: 100dvh;
          background: var(--bg);
          padding: 20px 16px calc(100px + env(safe-area-inset-bottom));
        }

        .badges-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          gap: 16px;
          color: var(--text-mute);
        }

        .badges-loading p {
          font-size: 15px;
          margin: 0;
        }

        .badges-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 24px;
        }

        .badges-title {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin: 0 0 4px 0;
        }

        .badges-subtitle {
          font-size: 14px;
          color: var(--text-mute);
          margin: 0;
        }

        .badges-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 24px;
          padding: 20px;
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 16px;
          margin-bottom: 24px;
        }

        .stat-item {
          text-align: center;
        }

        .stat-value {
          font-family: var(--font-mono);
          font-size: 28px;
          font-weight: 700;
          color: var(--text);
        }

        .stat-label {
          font-size: 11px;
          color: var(--text-mute);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-top: 4px;
        }

        .stat-divider {
          width: 1px;
          height: 40px;
          background: var(--line);
        }

        .badges-filters {
          margin-bottom: 20px;
        }

        .category-tabs {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 12px;
          margin-bottom: 12px;
          scrollbar-width: none;
        }

        .category-tabs::-webkit-scrollbar {
          display: none;
        }

        .category-tab {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 16px;
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 20px;
          color: var(--text-mute);
          font-size: 13px;
          font-weight: 600;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .category-tab:hover {
          border-color: var(--lime);
          color: var(--text);
        }

        .category-tab.active {
          background: var(--lime);
          border-color: var(--lime);
          color: #0B0B0C;
        }

        .filter-toggle {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          color: var(--text-mute);
          cursor: pointer;
        }

        .filter-toggle input {
          width: 18px;
          height: 18px;
          accent-color: var(--lime);
          cursor: pointer;
        }

        .badges-grid {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .badges-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          color: var(--text-mute);
          text-align: center;
          gap: 16px;
        }

        .badges-empty p {
          font-size: 15px;
          margin: 0;
        }

        @media (min-width: 768px) {
          .badges-page {
            padding: 48px 28px 32px;
          }

          .badges-title {
            font-size: 32px;
          }

          .badges-stats {
            padding: 28px;
            border-radius: 20px;
            margin-bottom: 32px;
          }

          .stat-value {
            font-size: 36px;
          }

          .stat-label {
            font-size: 12px;
          }

          .badges-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 16px;
          }
        }

        @media (min-width: 1200px) {
          .badges-page {
            padding: 48px 48px 32px;
          }

          .badges-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
          }
        }
      `}</style>
    </div>
  );
}
