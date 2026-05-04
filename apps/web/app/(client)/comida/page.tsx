"use client";

import { useRouter } from "next/navigation";
import { QuickFoodLogger } from "@/app/(client)/panel/_components/quick-food-logger";
import { useFoodData } from "./_hooks/use-food-data";
import { FoodHistory } from "./_components/food-history";
import { NutritionSummary } from "./_components/nutrition-summary";

function ChevronLeftIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function weekLabel(weekStart: string): string {
  const s = new Date(weekStart);
  const e = new Date(s.getTime() + 6 * 24 * 60 * 60 * 1000);
  const fmt = (d: Date) => d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
  return `${fmt(s)} – ${fmt(e)}`;
}

export default function ComidaPage() {
  const router = useRouter();
  const { entries, dashboard, loading, refresh } = useFoodData();

  const good = dashboard?.foodGood ?? 0;
  const regular = dashboard?.foodRegular ?? 0;
  const poor = dashboard?.foodPoor ?? 0;

  return (
    <div className="comida-page">
      {/* Header */}
      <div className="comida-header">
        <button onClick={() => router.push("/panel")} className="comida-back">
          <ChevronLeftIcon />
        </button>
        <div>
          <div className="comida-title">Mi comida</div>
          {dashboard && (
            <div className="comida-subtitle">
              Semana {dashboard.weekNumber} de {dashboard.totalWeeks} · {weekLabel(dashboard.weekStart)}
            </div>
          )}
        </div>
      </div>

      {/* Content - usa TODO el ancho disponible */}
      <div className="comida-content">
        {/* Logger - full width hero */}
        <div className="comida-logger-wrapper">
          <QuickFoodLogger embedded onSaved={refresh} />
        </div>

        {/* Stats grid - 3 columnas en desktop */}
        <div className="comida-stats-grid">
          <div className="stat-card">
            <div className="stat-label" style={{ color: "var(--success)" }}>BUENAS</div>
            <div className="stat-value" style={{ color: "var(--success)" }}>{good}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label" style={{ color: "#FF8E72" }}>REGULARES</div>
            <div className="stat-value" style={{ color: "#FF8E72" }}>{regular}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label" style={{ color: "var(--danger)" }}>POBRES</div>
            <div className="stat-value" style={{ color: "var(--danger)" }}>{poor}</div>
          </div>
          <div className="stat-card total">
            <div className="stat-label">TOTAL</div>
            <div className="stat-value" style={{ color: "var(--lime)" }}>{good + regular + poor}</div>
          </div>
        </div>

        {/* Nutrition + History - 2 columnas en desktop */}
        <div className="comida-bottom-grid">
          <div className="comida-nutrition-section">
            <NutritionSummary good={good} regular={regular} poor={poor} />
          </div>
          <div className="comida-history-section">
            <FoodHistory entries={entries} loading={loading} onRefresh={refresh} />
          </div>
        </div>
      </div>

      <style jsx>{`
        .comida-page {
          min-height: 100dvh;
          background: var(--bg);
          padding-bottom: calc(100px + env(safe-area-inset-bottom));
        }

        /* Mobile first - todo apilado */
        .comida-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          border-bottom: 1px solid var(--line);
        }

        .comida-back {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: var(--bg-1);
          border: 1px solid var(--line-2);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-mute);
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .comida-back:hover {
          border-color: var(--lime);
          color: var(--lime);
        }

        .comida-title {
          font-size: 18px;
          font-weight: 800;
          letter-spacing: -0.02em;
        }

        .comida-subtitle {
          font-size: 11px;
          color: var(--text-mute);
          margin-top: 2px;
        }

        .comida-content {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .comida-logger-wrapper,
        .comida-nutrition-section,
        .comida-history-section {
          width: 100%;
        }

        .comida-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
        }

        .stat-card {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 12px 8px;
          text-align: center;
        }

        .stat-card.total {
          background: var(--bg-2);
          border-color: var(--line-2);
        }

        .stat-label {
          font-family: var(--font-mono);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.08em;
          margin-bottom: 4px;
          color: var(--text-mute);
        }

        .stat-value {
          font-family: var(--font-mono);
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.02em;
        }

        /* Tablet - un poco más de espacio */
        @media (min-width: 640px) {
          .comida-header {
            padding: 20px 24px;
          }

          .comida-title {
            font-size: 22px;
          }

          .comida-subtitle {
            font-size: 12px;
          }

          .comida-content {
            padding: 20px 24px;
            gap: 20px;
          }

          .stat-card {
            padding: 16px 12px;
          }

          .stat-label {
            font-size: 9px;
            margin-bottom: 6px;
          }

          .stat-value {
            font-size: 28px;
          }
        }

        /* Desktop - full width, 2 columnas abajo */
        @media (min-width: 900px) {
          .comida-page {
            padding-bottom: 32px;
          }

          .comida-header {
            padding: 24px 32px;
          }

          .comida-back {
            width: 40px;
            height: 40px;
          }

          .comida-title {
            font-size: 26px;
          }

          .comida-subtitle {
            font-size: 13px;
            margin-top: 4px;
          }

          .comida-content {
            padding: 24px 32px;
            gap: 24px;
          }

          /* Stats más grandes */
          .comida-stats-grid {
            gap: 16px;
          }

          .stat-card {
            padding: 20px 16px;
            border-radius: 14px;
          }

          .stat-label {
            font-size: 10px;
            letter-spacing: 0.1em;
            margin-bottom: 8px;
          }

          .stat-value {
            font-size: 36px;
          }

          /* Bottom: Nutrition + History lado a lado */
          .comida-bottom-grid {
            display: grid;
            grid-template-columns: 1fr 1.5fr;
            gap: 24px;
            align-items: start;
          }

          .comida-nutrition-section {
            position: sticky;
            top: 24px;
          }
        }

        /* Large desktop - más padding, elementos más grandes */
        @media (min-width: 1400px) {
          .comida-header {
            padding: 32px 48px;
          }

          .comida-content {
            padding: 32px 48px;
            gap: 32px;
          }

          .comida-stats-grid {
            gap: 20px;
          }

          .stat-card {
            padding: 28px 24px;
          }

          .stat-label {
            font-size: 11px;
            margin-bottom: 12px;
          }

          .stat-value {
            font-size: 48px;
          }

          .comida-bottom-grid {
            grid-template-columns: 1fr 2fr;
            gap: 32px;
          }

          .comida-nutrition-section {
            top: 32px;
          }
        }

        /* Extra large - ultra wide */
        @media (min-width: 1800px) {
          .comida-header {
            padding: 32px 64px;
          }

          .comida-content {
            padding: 32px 64px;
          }

          .comida-bottom-grid {
            grid-template-columns: 400px 1fr;
          }
        }
      `}</style>
    </div>
  );
}
