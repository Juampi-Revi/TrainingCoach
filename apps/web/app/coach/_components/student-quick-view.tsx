"use client";

import { useRouter } from "next/navigation";
import { Avatar, Icon, Button, Badge } from "@/components/ui";
import type { CoachClientSummary } from "@regen/types";

interface StudentQuickViewProps {
  student: CoachClientSummary | null;
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_TONES = ["#FF5B5B", "#FFB547", "#7AB8FF", "var(--lime)", "#6EE7A8"];

export function StudentQuickView({ student, isOpen, onClose }: StudentQuickViewProps) {
  const router = useRouter();

  if (!isOpen || !student) return null;

  const daysSinceLastSession = student.lastSession
    ? Math.floor(
        (new Date().getTime() - new Date(student.lastSession.performedAt).getTime()) / 86400000
      )
    : null;

  const getStatusBadge = () => {
    if (!student.assignment) {
      return <Badge tone="neutral">Sin plan</Badge>;
    }
    if (daysSinceLastSession === null || daysSinceLastSession > 7) {
      return <Badge tone="danger">Inactivo {daysSinceLastSession ? `${daysSinceLastSession}d` : ""}</Badge>;
    }
    return <Badge tone="success">Activo</Badge>;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="student-info">
            <Avatar
              name={student.name ?? student.email}
              size={64}
              tone={AVATAR_TONES[0]}
            />
            <div className="student-details">
              <h2 className="student-name">{student.name || "Sin nombre"}</h2>
              <p className="student-email">{student.email}</p>
              <div className="student-status">{getStatusBadge()}</div>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <Icon name="x" size={24} color="var(--text-mute)" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Última sesión</div>
            <div className="stat-value">
              {daysSinceLastSession !== null
                ? `Hace ${daysSinceLastSession} días`
                : "Nunca"}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Plan actual</div>
            <div className="stat-value">
              {student.assignment?.plan?.title || "Sin plan"}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Estado</div>
            <div className="stat-value">
              {student.assignment?.status === "active" ? "Activo" : "Inactivo"}
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Plan asignado</div>
            <div className="stat-value">
              {student.assignment?.plan?.title || "Sin plan"}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        {student.lastSession && (
          <div className="recent-activity">
            <h3 className="section-title">Última actividad</h3>
            <div className="activity-card">
              <div className="activity-name">
                {student.lastSession.status === "completed" ? "Entrenamiento completado" : "Entrenamiento en progreso"}
              </div>
              <div className="activity-date">
                {new Date(student.lastSession.performedAt).toLocaleDateString("es-ES", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
          <Button
            onClick={() => {
              onClose();
              router.push(`/coach/alumnos/${student.id}`);
            }}
          >
            Ver perfil completo
          </Button>
        </div>
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          z-index: 1000;
          padding: 0;
        }

        .modal-content {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 20px 20px 0 0;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
        }

        .student-info {
          display: flex;
          align-items: center;
          gap: 16px;
          flex: 1;
        }

        .student-details {
          flex: 1;
          min-width: 0;
        }

        .student-name {
          font-size: 20px;
          font-weight: 700;
          margin: 0 0 4px 0;
          letter-spacing: -0.01em;
        }

        .student-email {
          font-size: 14px;
          color: var(--text-mute);
          margin: 0 0 8px 0;
        }

        .student-status {
          display: flex;
        }

        .close-btn {
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          border-radius: 8px;
          transition: background 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          background: var(--bg-2);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .stat-card {
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 16px;
        }

        .stat-label {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-mute);
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .stat-value {
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
        }

        .progress-bar {
          height: 4px;
          background: var(--bg-2);
          border-radius: 2px;
          margin-top: 8px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.3s ease;
        }

        .section-title {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-mute);
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin: 0 0 10px 0;
        }

        .activity-card {
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 16px;
        }

        .activity-name {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 4px;
        }

        .activity-date {
          font-size: 13px;
          color: var(--text-mute);
        }

        .modal-actions {
          display: flex;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid var(--line);
        }

        .modal-actions :global(button) {
          flex: 1;
        }

        @media (min-width: 768px) {
          .modal-overlay {
            align-items: center;
            padding: 24px;
          }

          .modal-content {
            border-radius: 20px;
            max-height: 85vh;
            padding: 32px;
          }

          .student-name {
            font-size: 24px;
          }

          .stats-grid {
            grid-template-columns: repeat(4, 1fr);
          }

          .modal-actions {
            justify-content: flex-end;
          }

          .modal-actions :global(button) {
            flex: 0 0 auto;
          }
        }
      `}</style>
    </div>
  );
}
