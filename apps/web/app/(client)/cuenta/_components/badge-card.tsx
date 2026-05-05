"use client";

import { Icon } from "@/components/ui";
import type { Badge } from "@/lib/hooks/use-badges";

interface BadgeCardProps {
  badge: Badge;
  onClick?: () => void;
}

const TIER_COLORS = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#E5E4E2",
};

const CATEGORY_ICONS: Record<string, string> = {
  steps: "footprint",
  workouts: "dumbbell",
  streak: "flame",
  nutrition: "target",
  social: "users",
  special: "star",
};

export function BadgeCard({ badge, onClick }: BadgeCardProps) {
  const tierColor = TIER_COLORS[badge.tier];
  const isLocked = !badge.unlocked;

  return (
    <div
      className={`badge-card ${isLocked ? "locked" : "unlocked"}`}
      onClick={onClick}
    >
      {/* Glow effect for unlocked badges */}
      {!isLocked && <div className="badge-glow" style={{ background: tierColor }} />}

      {/* Badge icon */}
      <div
        className="badge-icon"
        style={{
          background: isLocked ? "var(--bg-2)" : `${tierColor}20`,
          borderColor: isLocked ? "var(--line)" : tierColor,
        }}
      >
        <Icon
          name={(CATEGORY_ICONS[badge.category] as any) || "star"}
          size={28}
          color={isLocked ? "var(--text-mute)" : tierColor}
        />
        {!badge.viewed && !isLocked && <div className="badge-new-indicator" />}
      </div>

      {/* Badge info */}
      <div className="badge-info">
        <div className="badge-name">{badge.name}</div>
        <div className="badge-description">{badge.description}</div>
        <div className="badge-meta">
          <span
            className="badge-tier"
            style={{ color: isLocked ? "var(--text-mute)" : tierColor }}
          >
            {badge.tier.charAt(0).toUpperCase() + badge.tier.slice(1)}
          </span>
          {badge.unlockedAt && (
            <span className="badge-date">
              {new Date(badge.unlockedAt).toLocaleDateString("es-ES", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
        </div>
      </div>

      {/* Lock overlay for locked badges */}
      {isLocked && (
        <div className="badge-lock">
          <Icon name="lock" size={20} color="var(--text-mute)" />
        </div>
      )}

      <style jsx>{`
        .badge-card {
          position: relative;
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 20px;
          display: flex;
          gap: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          overflow: hidden;
        }

        .badge-card:hover {
          transform: translateY(-2px);
          border-color: var(--lime);
        }

        .badge-card.locked {
          opacity: 0.7;
        }

        .badge-card.locked:hover {
          opacity: 0.9;
        }

        .badge-glow {
          position: absolute;
          top: -50%;
          right: -50%;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          filter: blur(40px);
          opacity: 0.15;
          pointer-events: none;
        }

        .badge-icon {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          border: 2px solid;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          position: relative;
        }

        .badge-new-indicator {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 14px;
          height: 14px;
          background: var(--danger);
          border-radius: 50%;
          border: 2px solid var(--bg-1);
        }

        .badge-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }

        .badge-name {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.01em;
          margin-bottom: 4px;
        }

        .badge-description {
          font-size: 13px;
          color: var(--text-mute);
          line-height: 1.4;
          margin-bottom: 8px;
        }

        .badge-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          font-family: var(--font-mono);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .badge-tier {
          font-weight: 700;
        }

        .badge-date {
          color: var(--text-mute);
        }

        .badge-lock {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 32px;
          height: 32px;
          background: var(--bg);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--line);
        }

        @media (min-width: 768px) {
          .badge-card {
            padding: 24px;
          }

          .badge-icon {
            width: 72px;
            height: 72px;
            border-radius: 20px;
          }

          .badge-icon :global(svg) {
            width: 32px;
            height: 32px;
          }

          .badge-name {
            font-size: 18px;
          }

          .badge-description {
            font-size: 14px;
          }

          .badge-meta {
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
}
