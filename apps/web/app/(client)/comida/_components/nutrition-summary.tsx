"use client";

import { NutritionStack } from "@/app/(client)/panel/_components/nutrition-stack";

interface NutritionSummaryProps {
  good: number;
  regular: number;
  poor: number;
}

export function NutritionSummary({ good, regular, poor }: NutritionSummaryProps) {
  const total = good + regular + poor;

  if (total === 0) {
    return (
      <div className="nutrition-summary">
        <div className="nutrition-header">NUTRICIÓN · 7D</div>
        <div className="nutrition-empty">Sin registros esta semana</div>
      </div>
    );
  }

  return (
    <div className="nutrition-summary">
      <div className="nutrition-header">NUTRICIÓN · 7D</div>
      
      <div className="nutrition-content">
        <NutritionStack good={good} regular={regular} poor={poor} />
      </div>

      <style jsx>{`
        .nutrition-summary {
          background: var(--bg-1);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 20px;
          height: 100%;
        }
        
        @media (min-width: 900px) {
          .nutrition-summary {
            padding: 28px;
            border-radius: 16px;
          }
        }
        
        @media (min-width: 1400px) {
          .nutrition-summary {
            padding: 32px;
          }
        }
        
        .nutrition-header {
          font-family: var(--font-mono);
          font-size: 10px;
          color: var(--text-mute);
          font-weight: 700;
          letter-spacing: 0.1em;
          margin-bottom: 16px;
        }
        
        @media (min-width: 900px) {
          .nutrition-header {
            font-size: 12px;
            margin-bottom: 24px;
          }
        }
        
        @media (min-width: 1400px) {
          .nutrition-header {
            font-size: 13px;
            margin-bottom: 28px;
          }
        }
        
        .nutrition-empty {
          font-size: 14px;
          color: var(--text-mute);
        }
        
        @media (min-width: 900px) {
          .nutrition-empty {
            font-size: 16px;
          }
        }
        
        .nutrition-content {
          width: 100%;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
