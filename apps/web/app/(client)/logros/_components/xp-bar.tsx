"use client";

import type { XpStats } from "@regen/types";

interface XpBarProps {
  stats: XpStats;
}

export function XpBar({ stats }: XpBarProps) {
  const { level, currentXp, xpToNextLevel, progressPercent, title } = stats;

  return (
    <div className="xp-bar-container">
      <div className="xp-header">
        <div className="level-info">
          <span className="level-number">Nivel {level}</span>
          <span className="level-title">{title}</span>
        </div>
        <span className="xp-total">{currentXp.toLocaleString()} XP total</span>
      </div>

      <div className="xp-progress-wrapper">
        <div className="xp-progress-bar">
          <div
            className="xp-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="xp-progress-labels">
          <span>{progressPercent}%</span>
          <span>{xpToNextLevel.toLocaleString()} XP para nivel {level + 1}</span>
        </div>
      </div>
    </div>
  );
}
