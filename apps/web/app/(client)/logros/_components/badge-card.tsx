"use client";

import { useState } from "react";
import type { UserBadge } from "@regen/types";

interface BadgeCardProps {
  badge: UserBadge;
  unlocked: boolean;
}

const tierColors = {
  bronze: "#CD7F32",
  silver: "#C0C0C0",
  gold: "#FFD700",
  platinum: "#E5E4E2",
};

const categoryIcons: Record<string, string> = {
  steps: "👟",
  workouts: "💪",
  streak: "🔥",
  nutrition: "🥗",
  social: "👥",
  special: "⭐",
};

export function BadgeCard({ badge, unlocked }: BadgeCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  const tierColor = tierColors[badge.badge.tier];
  const icon = categoryIcons[badge.badge.category] || "🏆";

  return (
    <div
      className={`badge-card ${unlocked ? "unlocked" : "locked"}`}
      style={{ borderColor: unlocked ? tierColor : undefined }}
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className="badge-icon" style={{ color: tierColor }}>
        {unlocked ? icon : "🔒"}
      </div>
      
      <div className="badge-content">
        <h3 className="badge-name">{badge.badge.name}</h3>
        <p className="badge-description">{badge.badge.description}</p>
        
        {unlocked && badge.unlockedAt && (
          <span className="badge-date">
            Desbloqueado el {new Date(badge.unlockedAt).toLocaleDateString("es-ES")}
          </span>
        )}
        
        <span
          className="badge-tier"
          style={{ backgroundColor: unlocked ? tierColor : "#666" }}
        >
          {badge.badge.tier}
        </span>
      </div>

      {showDetails && (
        <div className="badge-details">
          <p>
            <strong>Categoría:</strong> {badge.badge.category}
          </p>
          <p>
            <strong>Requisito:</strong> {badge.badge.requirement.type} - {badge.badge.requirement.value}
          </p>
        </div>
      )}
    </div>
  );
}
