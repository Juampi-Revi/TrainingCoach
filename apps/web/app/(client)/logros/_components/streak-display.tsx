"use client";

import type { StreakStats } from "@regen/types";

interface StreakDisplayProps {
  stats: StreakStats;
}

export function StreakDisplay({ stats }: StreakDisplayProps) {
  const { currentStreak, longestStreak, streakActive } = stats;

  return (
    <div className="streak-display">
      <div className="streak-header">
        <h3>🔥 Racha de Entrenamientos</h3>
        {streakActive && <span className="streak-badge active">Activa</span>}
      </div>
      
      <div className="streak-stats">
        <div className="streak-stat">
          <span className="streak-number">{currentStreak}</span>
          <span className="streak-label">
            {currentStreak === 1 ? "día" : "días"} actual
          </span>
        </div>
        
        <div className="streak-divider">/</div>
        
        <div className="streak-stat">
          <span className="streak-number">{longestStreak}</span>
          <span className="streak-label">
            {longestStreak === 1 ? "día" : "días"} récord
          </span>
        </div>
      </div>

      {!streakActive && currentStreak > 0 && (
        <p className="streak-warning">
          Tu racha se perderá si no entrenás hoy
        </p>
      )}

      {currentStreak === 0 && (
        <p className="streak-hint">
          Completá un entrenamiento hoy para empezar tu racha
        </p>
      )}
    </div>
  );
}
