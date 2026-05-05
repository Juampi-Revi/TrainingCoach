"use client";

import { useState, useMemo } from "react";
import { Icon } from "@/components/ui";
import type { CoachClientSummary } from "@regen/types";

interface StudentFiltersProps {
  students: CoachClientSummary[];
  onFilterChange: (filtered: CoachClientSummary[]) => void;
}

export function StudentFilters({ students, onFilterChange }: StudentFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "no-plan">("all");
  const [sortBy, setSortBy] = useState<"name" | "last-session" | "progress">("name");

  const filteredStudents = useMemo(() => {
    let result = [...students];

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          (s.name?.toLowerCase() || "").includes(query) ||
          s.email.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((s) => {
        const hasPlan = s.assignment?.status === "active";
        const lastSession = s.lastSession
          ? (new Date().getTime() - new Date(s.lastSession.performedAt).getTime()) / 86400000
          : null;
        const isInactive = lastSession !== null ? lastSession > 7 : true;

        switch (statusFilter) {
          case "active":
            return hasPlan && !isInactive;
          case "inactive":
            return hasPlan && isInactive;
          case "no-plan":
            return !hasPlan;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return (a.name || a.email).localeCompare(b.name || b.email);
        case "last-session":
          const aDate = a.lastSession ? new Date(a.lastSession.performedAt).getTime() : 0;
          const bDate = b.lastSession ? new Date(b.lastSession.performedAt).getTime() : 0;
          return bDate - aDate;
        case "progress":
          // Sort by last session date as a proxy for progress
          const aProgress = a.lastSession ? new Date(a.lastSession.performedAt).getTime() : 0;
          const bProgress = b.lastSession ? new Date(b.lastSession.performedAt).getTime() : 0;
          return bProgress - aProgress;
        default:
          return 0;
      }
    });

    return result;
  }, [students, searchQuery, statusFilter, sortBy]);

  // Notify parent of filter changes
  useMemo(() => {
    onFilterChange(filteredStudents);
  }, [filteredStudents, onFilterChange]);

  return (
    <div className="student-filters">
      <div className="search-row">
        <div className="search-input-wrapper">
          <Icon name="search" size={18} color="var(--text-mute)" />
          <input
            type="text"
            placeholder="Buscar alumno..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              className="clear-btn"
              onClick={() => setSearchQuery("")}
              title="Limpiar búsqueda"
            >
              <Icon name="x" size={16} color="var(--text-mute)" />
            </button>
          )}
        </div>

        <div className="filter-selects">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="filter-select"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos (7d+)</option>
            <option value="no-plan">Sin plan</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="filter-select"
          >
            <option value="name">Ordenar por nombre</option>
            <option value="last-session">Última sesión</option>
            <option value="progress">Progreso semanal</option>
          </select>
        </div>
      </div>

      <div className="results-count">
        {filteredStudents.length} {filteredStudents.length === 1 ? "alumno" : "alumnos"} encontrados
      </div>

      <style jsx>{`
        .student-filters {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .search-row {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .search-input-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 10px;
          padding: 12px 14px;
          transition: all 0.2s ease;
        }

        .search-input-wrapper:focus-within {
          border-color: var(--lime);
          background: var(--bg);
        }

        .search-input {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text);
          font-size: 15px;
          outline: none;
        }

        .search-input::placeholder {
          color: var(--text-mute);
        }

        .clear-btn {
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background 0.2s ease;
        }

        .clear-btn:hover {
          background: var(--bg-2);
        }

        .filter-selects {
          display: flex;
          gap: 10px;
        }

        .filter-select {
          flex: 1;
          padding: 10px 12px;
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 8px;
          color: var(--text);
          font-size: 14px;
          cursor: pointer;
          outline: none;
        }

        .filter-select:focus {
          border-color: var(--lime);
        }

        .results-count {
          font-size: 13px;
          color: var(--text-mute);
        }

        @media (min-width: 768px) {
          .search-row {
            flex-direction: row;
            align-items: center;
          }

          .search-input-wrapper {
            flex: 1;
            max-width: 400px;
          }

          .filter-selects {
            flex-shrink: 0;
          }

          .filter-select {
            min-width: 160px;
          }
        }
      `}</style>
    </div>
  );
}
