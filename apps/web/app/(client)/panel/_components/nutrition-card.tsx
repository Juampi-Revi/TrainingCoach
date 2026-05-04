"use client";

// components/nutrition-card.tsx — Card de nutrición con score y stack

import { NutritionStack } from "./nutrition-stack";

interface NutritionCardProps {
  good: number;
  regular: number;
  poor: number;
  onAdd: () => void;
}

export function NutritionCard({ good, regular, poor, onAdd }: NutritionCardProps) {
  const total = good + regular + poor;

  return (
    <div className="nutrition-card">
      <div className="nutrition-label">NUTRICIÓN · 7D</div>

      <NutritionStack good={good} regular={regular} poor={poor} />

      <button onClick={onAdd} className="nutrition-add-btn">
        + Registrar comida
      </button>

      <style jsx>{`
        .nutrition-card {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 14px 16px;
        }

        .nutrition-label {
          font-family: var(--font-mono);
          font-size: 9px;
          color: var(--text-mute);
          font-weight: 700;
          letter-spacing: 0.1em;
          margin-bottom: 12px;
        }

        .nutrition-add-btn {
          margin-top: 12px;
          width: 100%;
          padding: 10px;
          background: transparent;
          border: 1px dashed var(--line-2);
          border-radius: 10px;
          cursor: pointer;
          font-size: 12px;
          color: var(--text-mute);
          font-weight: 600;
          transition: border-color 0.2s, color 0.2s;
        }

        .nutrition-add-btn:hover {
          border-color: var(--lime);
          color: var(--lime);
        }

        /* Desktop */
        @media (min-width: 768px) {
          .nutrition-card {
            padding: 18px 20px;
            border-radius: 16px;
          }

          .nutrition-label {
            font-size: 11px;
            letter-spacing: 0.12em;
            margin-bottom: 16px;
          }

          .nutrition-add-btn {
            margin-top: 16px;
            padding: 12px;
            font-size: 13px;
            border-radius: 12px;
          }
        }
      `}</style>
    </div>
  );
}