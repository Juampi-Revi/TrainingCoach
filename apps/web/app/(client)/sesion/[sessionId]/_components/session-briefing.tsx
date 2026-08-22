"use client";

import { Button, Icon } from "@/components/ui";
import type { SessionDetail } from "@regen/types";
import { buildSessionBriefing } from "../_lib/session-briefing";
import "../_styles.css";

export function SessionBriefing({
  session,
  onStart,
}: {
  session: SessionDetail;
  onStart: () => void;
}) {
  const model = buildSessionBriefing(session);
  const focus = model.tags[0] ?? model.timeline.find((t) => t.type === "strength" || t.type === "intervals")?.label ?? "Entrenamiento";

  return (
    <div className="session-briefing">
      <div className="session-briefing__hero">
        <div className="session-briefing__eyebrow ta-mono">HOY TOCA</div>
        <h1 className="session-briefing__title">{model.title}</h1>
        <p className="session-briefing__meta ta-mono">
          {focus} · ~{model.estimatedMinutes} min · {model.workExerciseCount} ejercicios
        </p>
      </div>

      <div className="session-briefing__timeline">
        <div className="session-briefing__section-label ta-mono">BLOQUES</div>
        <ol className="session-briefing__steps">
          {model.timeline.map((item, idx) => (
            <li key={item.key} className="session-briefing__step">
              <span className="session-briefing__step-dot" data-type={item.type} />
              <div className="session-briefing__step-body">
                <div className="session-briefing__step-title">{item.label}</div>
                <div className="session-briefing__step-sub ta-mono">
                  ~{item.minutes} min
                  {item.exerciseCount > 0 ? ` · ${item.exerciseCount} ej.` : ""}
                </div>
              </div>
              {idx < model.timeline.length - 1 && <span className="session-briefing__step-line" aria-hidden />}
            </li>
          ))}
        </ol>
      </div>

      {model.muscles.length > 0 && (
        <div className="session-briefing__chips">
          <div className="session-briefing__section-label ta-mono">ENFOQUE</div>
          <div className="session-briefing__chip-row">
            {model.muscles.map((m) => (
              <span key={m} className="session-briefing__chip">{m}</span>
            ))}
          </div>
        </div>
      )}

      {model.coachNote && (
        <div className="session-briefing__note">
          <div className="session-briefing__section-label ta-mono">NOTA DEL COACH</div>
          <p>{model.coachNote}</p>
        </div>
      )}

      <div className="session-briefing__cta">
        <Button size="lg" onClick={onStart} style={{ width: "100%" }}>
          Empezar
          <Icon name="play" size={16} color="var(--bg-1)" />
        </Button>
      </div>
    </div>
  );
}
