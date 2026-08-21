"use client";

import type { AssignmentStatus, CoachClientSummary, PlanSummary, SessionStatus } from "@regen/types";

const selectStyle = {
  height: 36,
  minWidth: 180,
  background: "var(--bg-1)",
  border: "1px solid var(--line-2)",
  borderRadius: 10,
  padding: "0 10px",
  fontSize: 13,
  color: "var(--text)",
  outline: "none",
} as const;

interface AgendaFiltersProps {
  clients: CoachClientSummary[];
  plans: PlanSummary[];
  clientId: string;
  planId: string;
  assignmentStatus: "" | AssignmentStatus;
  status: "" | "pending" | SessionStatus;
  showSessionStatus: boolean;
  onClientChange: (value: string) => void;
  onPlanChange: (value: string) => void;
  onAssignmentStatusChange: (value: "" | AssignmentStatus) => void;
  onStatusChange: (value: "" | "pending" | SessionStatus) => void;
}

export function AgendaFilters({
  clients,
  plans,
  clientId,
  planId,
  assignmentStatus,
  status,
  showSessionStatus,
  onClientChange,
  onPlanChange,
  onAssignmentStatusChange,
  onStatusChange,
}: AgendaFiltersProps) {
  return (
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <select
        value={clientId}
        onChange={(e) => onClientChange(e.target.value)}
        style={{ ...selectStyle, minWidth: 220 }}
      >
        <option value="">Todos los alumnos</option>
        {clients.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name?.trim() || c.email}
          </option>
        ))}
      </select>

      <select
        value={planId}
        onChange={(e) => onPlanChange(e.target.value)}
        style={{ ...selectStyle, minWidth: 220 }}
      >
        <option value="">Todos los planes</option>
        {plans.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>

      <select
        value={assignmentStatus}
        onChange={(e) => onAssignmentStatusChange(e.target.value as "" | AssignmentStatus)}
        style={selectStyle}
      >
        <option value="">Activos + pausados</option>
        <option value="active">Activos</option>
        <option value="paused">Pausados</option>
        <option value="finished">Finalizados</option>
      </select>

      {showSessionStatus && (
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as "" | "pending" | SessionStatus)}
          style={{ ...selectStyle, minWidth: 190 }}
        >
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="in_progress">En curso</option>
          <option value="completed">Completado</option>
        </select>
      )}
    </div>
  );
}
