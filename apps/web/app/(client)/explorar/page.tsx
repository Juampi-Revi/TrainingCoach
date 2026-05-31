"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import { Avatar, Button, Icon, StateBlock, Tabs } from "@/components/ui";

type PlanType = "all" | "strength" | "cardio" | "hypertrophy" | "weight_loss" | "endurance";
type Difficulty = "all" | "beginner" | "intermediate" | "advanced";
type Duration = "all" | "short" | "medium" | "long";

type PublicPlan = {
  id: string; 
  title: string; 
  goal: string | null; 
  notes: string | null;
  weeksCount: number; 
  periodDays: number; 
  planType: string;
  difficulty?: string;
  tags?: string[];
  coach: { id: string; name: string | null; avatarUrl: string | null };
  enrollmentCount: number;
  rating?: number;
  reviewCount?: number;
};

const planTypeLabels: Record<string, string> = {
  strength: "Fuerza",
  cardio: "Cardio",
  hypertrophy: "Hipertrofia",
  weight_loss: "Pérdida de peso",
  endurance: "Resistencia",
};

const difficultyLabels: Record<string, string> = {
  beginner: "Principiante",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

export default function ExplorarPage() {
  const { api, user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [plans, setPlans] = useState<PublicPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Filters
  const [selectedType, setSelectedType] = useState<PlanType>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("all");
  const [selectedDuration, setSelectedDuration] = useState<Duration>("all");
  const [sortBy, setSortBy] = useState<"popular" | "newest" | "rating">("popular");

  const loadPlans = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search.trim()) params.set("q", search.trim());
    if (selectedType !== "all") params.set("type", selectedType);
    if (selectedDifficulty !== "all") params.set("difficulty", selectedDifficulty);
    if (selectedDuration !== "all") params.set("duration", selectedDuration);
    params.set("sort", sortBy);
    
    api
      .get<PublicPlan[]>(`/plans/public?${params.toString()}`)
      .then(setPlans)
      .catch(() => toast.error("No se pudieron cargar los planes"))
      .finally(() => setLoading(false));
  }, [api, search, selectedType, selectedDifficulty, selectedDuration, sortBy, toast]);

  useEffect(() => {
    const t = setTimeout(() => {
      loadPlans();
    }, 0);
    return () => clearTimeout(t);
  }, [loadPlans]);

  async function subscribe(planId: string) {
    try {
      await api.post(`/client/plans/${planId}/subscribe`, {});
      toast.success("Plan asignado. Ya podés empezar a entrenar.");
      router.push("/semana");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo asignar el plan");
    }
  }

  const filteredPlans = plans;

  return (
    <div className="explorar-page">
      <div className="explorar-header">
        <h1>Explorar planes</h1>
        <p className="subtitle">Encontrá el plan perfecto para tus objetivos</p>
      </div>

      {/* Search */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <Icon name="search" size={14} color="var(--text-mute)" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && loadPlans()}
            placeholder="Buscar plan…"
            className="search-input"
          />
          {search.trim() && <Button size="sm" onClick={loadPlans}>Buscar</Button>}
        </div>
      </div>

      {/* Filters */}
      <div className="filters-container">
        <div className="filter-group">
          <label>Tipo</label>
          <div className="filter-buttons">
            <button className={selectedType === "all" ? "active" : ""} onClick={() => setSelectedType("all")}>
              Todos
            </button>
            {Object.entries(planTypeLabels).map(([key, label]) => (
              <button 
                key={key} 
                className={selectedType === key ? "active" : ""}
                onClick={() => setSelectedType(key as PlanType)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-row">
          <div className="filter-group">
            <label>Dificultad</label>
            <select 
              value={selectedDifficulty} 
              onChange={(e) => setSelectedDifficulty(e.target.value as Difficulty)}
              className="filter-select"
            >
              <option value="all">Todas</option>
              {Object.entries(difficultyLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Duración</label>
            <select 
              value={selectedDuration} 
              onChange={(e) => setSelectedDuration(e.target.value as Duration)}
              className="filter-select"
            >
              <option value="all">Todas</option>
              <option value="short">1-4 semanas</option>
              <option value="medium">5-8 semanas</option>
              <option value="long">9+ semanas</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Ordenar</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="filter-select"
            >
              <option value="popular">Más populares</option>
              <option value="newest">Más recientes</option>
              <option value="rating">Mejor valorados</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="results-container">
        <div className="results-header">
          <span>{filteredPlans.length} planes encontrados</span>
        </div>

        {loading ? (
          <StateBlock kind="loading" title="Cargando planes…" />
        ) : filteredPlans.length === 0 ? (
          <StateBlock 
            kind="empty" 
            title="Sin resultados" 
            body={search ? "Probá con otros filtros o término de búsqueda" : "No hay planes públicos todavía"} 
          />
        ) : (
          <div className="plans-grid">
            {filteredPlans.map((p) => (
              <div key={p.id} className="plan-card">
                <div className="plan-header">
                  <div className="plan-info">
                    <h3>{p.title}</h3>
                    <div className="plan-meta">
                      <span className="duration">{p.weeksCount} semanas</span>
                      <span className="separator">·</span>
                      <span className="frequency">{p.periodDays} días/sem</span>
                      {p.difficulty && (
                        <>
                          <span className="separator">·</span>
                          <span className={`difficulty ${p.difficulty}`}>
                            {difficultyLabels[p.difficulty]}
                          </span>
                        </>
                      )}
                    </div>
                    {p.goal && <p className="plan-goal">{p.goal}</p>}
                    {p.tags && p.tags.length > 0 && (
                      <div className="plan-tags">
                        {p.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="plan-rating">
                    {p.rating && (
                      <>
                        <span className="stars">{"★".repeat(Math.round(p.rating))}</span>
                        <span className="rating-value">{p.rating.toFixed(1)}</span>
                        {p.reviewCount && (
                          <span className="review-count">({p.reviewCount})</span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                <div className="plan-coach">
                  <Avatar name={p.coach.name ?? "Coach"} src={p.coach.avatarUrl} size={28} />
                  <span className="coach-name">{p.coach.name ?? "Coach"}</span>
                  {p.enrollmentCount > 0 && (
                    <span className="enrollment-count">
                      {p.enrollmentCount} alumnos
                    </span>
                  )}
                </div>

                <Button 
                  size="sm" 
                  icon="plus" 
                  onClick={() => subscribe(p.id)}
                  className="subscribe-btn"
                >
                  Empezar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
