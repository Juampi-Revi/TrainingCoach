"use client";

import Link from "next/link";
import { Badge, Icon } from "@/components/ui";

export function WeekWorkoutCard({
  href,
  title,
  description,
  tags,
  exerciseCount,
  progressionNote,
  variant,
  badge,
}: {
  href: string;
  title: string;
  description: string | null;
  tags: string[];
  exerciseCount: number;
  progressionNote: string | null;
  variant: "pending" | "completed" | "in_progress";
  badge?: { text: string; tone: "success" | "warn" | "neutral" };
}) {
  const isCompleted = variant === "completed";
  const isInProgress = variant === "in_progress";

  const iconName = isCompleted ? "check" : "dumbbell";
  const iconColor = isCompleted ? "var(--success)" : isInProgress ? "var(--warn)" : "var(--text-mute)";
  const iconBg = isCompleted ? "var(--bg-3)" : "var(--bg-2)";

  return (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 14,
          borderRadius: 12,
          background: "var(--bg-1)",
          border: "1px solid var(--line)",
          marginBottom: 8,
          opacity: isCompleted ? 0.9 : 1,
        }}
      >
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 9,
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "1px solid var(--line)",
          }}
        >
          <Icon name={iconName} size={18} color={iconColor} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div className="ta-ellipsis" style={{ fontSize: 15, fontWeight: 700 }}>
              {title}
            </div>
            {isInProgress && (
              <span className="ta-mono" style={{ fontSize: 10, fontWeight: 800, letterSpacing: ".08em", color: "var(--warn)" }}>
                EN CURSO
              </span>
            )}
          </div>
          <div className="ta-ellipsis" style={{ fontSize: 12, color: "var(--text-mute)", marginTop: 2 }}>
            {description ?? tags.join(" · ")} · {exerciseCount} ej
          </div>
          {progressionNote && (
            <div className="ta-ellipsis" style={{ fontSize: 12, color: "var(--accent-text)", marginTop: 4, fontWeight: 700 }}>
              {progressionNote}
            </div>
          )}
        </div>
        {badge && (
          <Badge tone={badge.tone} size="sm">
            {badge.text}
          </Badge>
        )}
      </div>
    </Link>
  );
}
