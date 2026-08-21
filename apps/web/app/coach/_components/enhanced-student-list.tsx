"use client";

import { useState } from "react";
import { Avatar, Icon, Badge } from "@/components/ui";
import { StudentQuickView } from "./student-quick-view";
import type { CoachClientSummary } from "@regen/types";
import { AVATAR_TONES } from "@/lib/constants";

interface EnhancedStudentListProps {
  students: CoachClientSummary[];
}

export function EnhancedStudentList({ students }: EnhancedStudentListProps) {
  const [selectedStudent, setSelectedStudent] = useState<CoachClientSummary | null>(null);

  if (students.length === 0) {
    return (
      <div className="empty-state">
        <Icon name="users" size={48} color="var(--text-mute)" />
        <p>No se encontraron alumnos</p>
      </div>
    );
  }

  return (
    <>
      <div className="student-list">
        {students.map((student, index) => {
          const daysSinceLastSession = student.lastSession
            ? Math.floor(
                (new Date().getTime() - new Date(student.lastSession.performedAt).getTime()) /
                  86400000
              )
            : null;

          const isInactive = daysSinceLastSession === null || daysSinceLastSession > 7;
          const hasPlan = student.assignment?.status === "active";

          // Simplified progress - could be expanded with real data from API
          const completionRate = 0;

          return (
            <div
              key={student.id}
              className="student-card"
              onClick={() => setSelectedStudent(student)}
            >
              <div className="student-main">
                <Avatar
                  name={student.name ?? student.email}
                  size={48}
                  tone={AVATAR_TONES[index % AVATAR_TONES.length]}
                />
                <div className="student-info">
                  <div className="student-name">{student.name || "Sin nombre"}</div>
                  <div className="student-email">{student.email}</div>
                  <div className="student-meta">
                    {!hasPlan ? (
                      <Badge tone="neutral" size="sm">Sin plan</Badge>
                    ) : isInactive ? (
                      <Badge tone="danger" size="sm">
                        Inactivo {daysSinceLastSession ? `${daysSinceLastSession}d` : ""}
                      </Badge>
                    ) : (
                      <Badge tone="success" size="sm">Activo</Badge>
                    )}
                    {student.assignment?.plan && (
                      <span className="plan-name">{student.assignment.plan.title}</span>
                    )}
                  </div>
                </div>
                <Icon name="chevR" size={20} color="var(--text-mute)" />
              </div>


            </div>
          );
        })}
      </div>

      <StudentQuickView
        student={selectedStudent}
        isOpen={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />

      <style jsx>{`
        .student-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .student-card {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .student-card:hover {
          border-color: var(--lime);
          background: var(--bg);
          transform: translateY(-1px);
        }

        .student-main {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .student-info {
          flex: 1;
          min-width: 0;
        }

        .student-name {
          font-size: 16px;
          font-weight: 700;
          letter-spacing: -0.01em;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .student-email {
          font-size: 13px;
          color: var(--text-mute);
          margin-bottom: 6px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .student-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .plan-name {
          font-size: 12px;
          color: var(--text-mute);
        }

        .student-progress {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--line);
        }

        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .progress-label {
          font-size: 12px;
          color: var(--text-mute);
        }

        .progress-value {
          font-family: var(--font-mono);
          font-size: 12px;
          font-weight: 600;
          color: var(--text);
        }

        .progress-bar {
          height: 6px;
          background: var(--bg-2);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.3s ease;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px;
          color: var(--text-mute);
          text-align: center;
          gap: 16px;
        }

        .empty-state p {
          font-size: 15px;
          margin: 0;
        }

        @media (min-width: 768px) {
          .student-card {
            padding: 20px;
            border-radius: 16px;
          }

          .student-main {
            gap: 16px;
          }

          .student-name {
            font-size: 17px;
          }

          .student-progress {
            margin-top: 16px;
            padding-top: 16px;
          }

          .progress-bar {
            height: 8px;
            border-radius: 4px;
          }

          .progress-fill {
            border-radius: 4px;
          }
        }
      `}</style>
    </>
  );
}
