"use client";

// components/quick-log-strip.tsx — Strip de botones para log rápido

import { Icon } from "@/components/ui";

interface QuickLogStripProps {
  workoutsCompleted: number;
  workoutsTarget: number | null;
  foodCount: number;
  stepsCount: number | null;
  sleepMinutes: number | null;
  onLogWorkout: () => void;
  onLogFood: () => void;
  onLogSteps: () => void;
  onLogSleep: () => void;
}

export function QuickLogStrip({
  workoutsCompleted,
  workoutsTarget,
  foodCount,
  stepsCount,
  sleepMinutes,
  onLogWorkout,
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
          icon={<Icon name="dumbbell" size={22} />}
          label="Entreno"
          done={workoutsDone}
          onClick={onLogWorkout}
        />

        {/* Comida */}
        <QuickLogButton
          icon={<Icon name="beef" size={22} />}
          label="Comida"
          badge={foodCount > 0 ? String(foodCount) : undefined}
          onClick={onLogFood}
        />

        {/* Pasos */}
        <QuickLogButton
          icon={<Icon name="footprints" size={22} />}
          label="Pasos"
          done={hasSteps}
          badge={hasSteps ? (stepsCount! > 999 ? `${(stepsCount! / 1000).toFixed(1)}k` : String(stepsCount)) : undefined}
          onClick={onLogSteps}
        />

        {/* Sueño */}
        <QuickLogButton
          icon={<Icon name="moon" size={22} />}
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
  return (
    <button
      onClick={disabled ? undefined : onClick}
      className={`quick-log-btn ${done ? "done" : ""} ${disabled ? "disabled" : ""}`}
    >
      <div className="quick-log-icon-wrapper">
        <div className="quick-log-icon" style={{ color: done ? "var(--lime)" : "var(--text)" }}>
          {icon}
        </div>

        {/* Badge */}
        {badge && <div className="quick-log-badge">{badge}</div>}

        {/* Done checkmark */}
        {done && !badge && (
          <div className="quick-log-check">
            <Icon name="check" size={12} />
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
