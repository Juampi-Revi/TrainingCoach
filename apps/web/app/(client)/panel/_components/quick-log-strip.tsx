"use client";

// components/quick-log-strip.tsx — Strip de botones para log rápido

import { useState } from "react";

interface QuickLogStripProps {
  workoutsCompleted: number;
  workoutsTarget: number | null;
  foodCount: number;
  stepsCount: number | null;
  sleepMinutes: number | null;
  onLogFood: () => void;
  onLogSteps: () => void;
  onLogSleep: () => void;
}

// Simple SVG icons
function DumbbellIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 5v14M18 5v14M6 9h12M6 15h12M3 5h3M3 19h3M18 5h3M18 19h3" />
    </svg>
  );
}

function BookIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function FootprintIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2c2 0 3 2 3 4s-1 4-3 4-3-2-3-4 1-4 3-4z" />
      <path d="M7 10c1.5 0 2.5 1.5 2.5 3s-1 3-2.5 3-2.5-1.5-2.5-3 1-3 2.5-3z" />
      <path d="M17 10c1.5 0 2.5 1.5 2.5 3s-1 3-2.5 3-2.5-1.5-2.5-3 1-3 2.5-3z" />
    </svg>
  );
}

function MoonIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function QuickLogStrip({
  workoutsCompleted,
  workoutsTarget,
  foodCount,
  stepsCount,
  sleepMinutes,
  onLogFood,
  onLogSteps,
  onLogSleep,
}: QuickLogStripProps) {
  const target = workoutsTarget ?? 4;
  const workoutsDone = workoutsCompleted >= target;
  const hasSteps = stepsCount != null && stepsCount > 0;
  const hasSleep = sleepMinutes != null && sleepMinutes > 0;

  return (
    <div className="quick-log-container">
      <div className="quick-log-label">HOY · REGISTRAR</div>
      <div className="quick-log-grid">
        {/* Workout */}
        <QuickLogButton
          icon={<DumbbellIcon />}
          label="Workout"
          done={workoutsDone}
          onClick={() => {}}
        />

        {/* Comida */}
        <QuickLogButton
          icon={<BookIcon />}
          label="Comida"
          badge={foodCount > 0 ? String(foodCount) : undefined}
          onClick={onLogFood}
        />

        {/* Pasos */}
        <QuickLogButton
          icon={<FootprintIcon />}
          label="Pasos"
          done={hasSteps}
          badge={hasSteps ? (stepsCount! > 999 ? `${(stepsCount! / 1000).toFixed(1)}k` : String(stepsCount)) : undefined}
          onClick={onLogSteps}
        />

        {/* Sueño */}
        <QuickLogButton
          icon={<MoonIcon />}
          label="Sueño"
          done={hasSleep}
          badge={hasSleep ? `${Math.floor(sleepMinutes! / 60)}h` : undefined}
          onClick={onLogSleep}
        />
      </div>

      <style jsx>{`
        .quick-log-container {
          padding: 12px 0 8px;
        }

        .quick-log-label {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-mute);
          letter-spacing: 0.12em;
          font-weight: 700;
          margin-bottom: 10px;
        }

        .quick-log-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        /* Desktop */
        @media (min-width: 768px) {
          .quick-log-container {
            padding: 20px 0;
          }

          .quick-log-label {
            font-size: 12px;
            margin-bottom: 16px;
          }

          .quick-log-grid {
            gap: 16px;
          }
        }
      `}</style>
    </div>
  );
}

interface QuickLogButtonProps {
  icon: React.ReactNode;
  label: string;
  done?: boolean;
  badge?: string;
  disabled?: boolean;
  onClick: () => void;
}

function QuickLogButton({ icon, label, done, badge, disabled, onClick }: QuickLogButtonProps) {
  const [hovered, setHovered] = useState(false);
  const isActive = done || (!disabled && hovered);

  return (
    <button
      onClick={disabled ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`quick-log-btn ${done ? "done" : ""} ${disabled ? "disabled" : ""}`}
    >
      <div className="quick-log-icon-wrapper">
        <div className="quick-log-icon" style={{ color: done ? "var(--lime)" : "var(--text)" }}>
          {icon}
        </div>

        {/* Badge */}
        {badge && !done && <div className="quick-log-badge">{badge}</div>}

        {/* Done checkmark */}
        {done && (
          <div className="quick-log-check">
            <CheckIcon size={10} />
          </div>
        )}
      </div>
      <span className="quick-log-label-text" style={{ color: done ? "var(--lime)" : "var(--text-mute)" }}>
        {label}
      </span>

      <style jsx>{`
        .quick-log-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          padding: 12px 8px;
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 12px;
          cursor: pointer;
          position: relative;
          opacity: ${disabled ? 0.5 : 1};
          transition: all 0.2s;
        }

        .quick-log-btn.done {
          background: rgba(215, 255, 58, 0.08);
          border-color: var(--lime);
        }

        .quick-log-btn.disabled {
          cursor: not-allowed;
        }

        .quick-log-btn:hover:not(.disabled) {
          border-color: var(--lime);
          transform: translateY(-2px);
        }

        .quick-log-icon-wrapper {
          position: relative;
        }

        .quick-log-icon {
          transition: color 0.2s;
        }

        .quick-log-badge {
          position: absolute;
          top: -6px;
          right: -8px;
          min-width: 16px;
          height: 16px;
          padding: 0 4px;
          border-radius: 8px;
          background: var(--lime);
          color: #0b0b0c;
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .quick-log-check {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 14px;
          height: 14px;
          border-radius: 7px;
          background: var(--success);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .quick-log-label-text {
          font-size: 11px;
          font-weight: 600;
          transition: color 0.2s;
        }

        /* Desktop */
        @media (min-width: 768px) {
          .quick-log-btn {
            padding: 20px 16px;
            gap: 10px;
            border-radius: 16px;
          }

          .quick-log-icon :global(svg) {
            width: 28px;
            height: 28px;
          }

          .quick-log-badge {
            min-width: 20px;
            height: 20px;
            border-radius: 10px;
            font-size: 11px;
            top: -10px;
            right: -12px;
          }

          .quick-log-check {
            width: 18px;
            height: 18px;
            border-radius: 9px;
            top: -8px;
            right: -8px;
          }

          .quick-log-label-text {
            font-size: 14px;
          }
        }
      `}</style>
    </button>
  );
}
