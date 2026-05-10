"use client";

import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui";

interface FoodEntry {
  id: string;
  loggedAt: string;
  mealType: "breakfast" | "lunch" | "dinner" | "snack" | null;
  quality: "good" | "regular" | "poor" | null;
  text: string | null;
}

interface TodayFoodProps {
  food: FoodEntry[];
  onAddFood?: () => void;
}

const MEAL_LABELS: Record<string, string> = {
  breakfast: "Desayuno",
  lunch: "Almuerzo",
  dinner: "Cena",
  snack: "Merienda",
};

const MEAL_ORDER = ["breakfast", "lunch", "snack", "dinner"];

function getQualityColor(quality: string | null): string {
  switch (quality) {
    case "good":
      return "var(--success)";
    case "regular":
      return "var(--warn)";
    case "poor":
      return "var(--danger)";
    default:
      return "var(--text-mute)";
  }
}

function getQualityLabel(quality: string | null): string {
  switch (quality) {
    case "good":
      return "Bien";
    case "regular":
      return "Regular";
    case "poor":
      return "Mejorable";
    default:
      return "Sin calificar";
  }
}

export function TodayFood({ food, onAddFood }: TodayFoodProps) {
  const router = useRouter();

  // Group food by meal type
  const grouped = food.reduce((acc, entry) => {
    const type = entry.mealType || "snack";
    if (!acc[type]) acc[type] = [];
    acc[type].push(entry);
    return acc;
  }, {} as Record<string, FoodEntry[]>);

  const hasFood = food.length > 0;

  return (
    <div className="today-food-container">
      <div className="today-food-header">
        <div className="today-food-title">
          <Icon name="beef" size={16} color="var(--text-mute)" />
          Comidas de hoy
        </div>
        <button
          onClick={onAddFood || (() => router.push("/comida"))}
          className="today-food-add-btn"
        >
          <Icon name="plus" size={14} color="var(--bg)" />
          Agregar
        </button>
      </div>

      {!hasFood ? (
        <div className="today-food-empty">
          <Icon name="beef" size={32} color="var(--text-mute)" />
          <p>No registraste comidas hoy</p>
          <button
            onClick={onAddFood || (() => router.push("/comida"))}
            className="today-food-empty-btn"
          >
            Registrar primera comida
          </button>
        </div>
      ) : (
        <div className="today-food-list">
          {MEAL_ORDER.map((mealType) => {
            const entries = grouped[mealType];
            if (!entries || entries.length === 0) return null;

            return (
              <div key={mealType} className="today-food-meal">
                <div className="today-food-meal-header">
                  <span className="today-food-meal-name">{MEAL_LABELS[mealType]}</span>
                  {entries.length > 1 && (
                    <span className="today-food-meal-count">{entries.length}</span>
                  )}
                </div>
                <div className="today-food-entries">
                  {entries.map((entry) => (
                    <div key={entry.id} className="today-food-entry">
                      <div
                        className="today-food-quality"
                        style={{ backgroundColor: getQualityColor(entry.quality) }}
                      >
                        {getQualityLabel(entry.quality)}
                      </div>
                      {entry.text ? (
                        <span className="today-food-text">{entry.text}</span>
                      ) : (
                        <span className="today-food-text empty">Sin descripción</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .today-food-container {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 16px;
        }

        .today-food-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .today-food-title {
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-mute);
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }

        .today-food-add-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: var(--lime);
          border: none;
          border-radius: 8px;
          color: var(--bg);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .today-food-add-btn:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }

        .today-food-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px 16px;
          text-align: center;
          gap: 12px;
        }

        .today-food-empty p {
          font-size: 14px;
          color: var(--text-mute);
          margin: 0;
        }

        .today-food-empty-btn {
          padding: 12px 20px;
          background: var(--bg-2);
          border: 1px dashed var(--line-2);
          border-radius: 10px;
          color: var(--text);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .today-food-empty-btn:hover {
          border-color: var(--lime);
          color: var(--lime);
        }

        .today-food-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .today-food-meal {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .today-food-meal-header {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .today-food-meal-name {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-mute);
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .today-food-meal-count {
          font-size: 10px;
          color: var(--text-mute);
          background: var(--bg-2);
          padding: 2px 6px;
          border-radius: 10px;
        }

        .today-food-entries {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .today-food-entry {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          background: var(--bg);
          border-radius: 10px;
          border: 1px solid var(--line);
        }

        .today-food-quality {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 3px 8px;
          border-radius: 4px;
          color: var(--bg);
          white-space: nowrap;
        }

        .today-food-text {
          font-size: 13px;
          color: var(--text);
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .today-food-text.empty {
          color: var(--text-mute);
          font-style: italic;
        }

        @media (min-width: 768px) {
          .today-food-container {
            padding: 24px;
            border-radius: 16px;
          }

          .today-food-header {
            margin-bottom: 20px;
          }

          .today-food-title {
            font-size: 11px;
            letter-spacing: 0.12em;
          }

          .today-food-add-btn {
            padding: 10px 18px;
            font-size: 14px;
            border-radius: 10px;
          }

          .today-food-empty {
            padding: 40px 24px;
          }

          .today-food-empty p {
            font-size: 15px;
          }

          .today-food-empty-btn {
            padding: 14px 24px;
            font-size: 14px;
          }

          .today-food-list {
            gap: 20px;
          }

          .today-food-meal-name {
            font-size: 11px;
          }

          .today-food-entry {
            padding: 12px 16px;
            border-radius: 12px;
          }

          .today-food-quality {
            font-size: 10px;
            padding: 4px 10px;
          }

          .today-food-text {
            font-size: 14px;
          }
        }

        @media (min-width: 1200px) {
          .today-food-container {
            padding: 28px;
          }
        }
      `}</style>
    </div>
  );
}
