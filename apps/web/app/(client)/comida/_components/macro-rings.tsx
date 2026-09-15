"use client";

import type { MacroTotals, NutritionTarget } from "@regen/types";

function barColor(consumed: number, target: number): string {
  if (target <= 0) return "var(--lime)";
  const ratio = consumed / target;
  if (ratio < 0.85) return "var(--warn)";
  if (ratio <= 1.1) return "var(--lime)";
  return "var(--danger)";
}

function MacroBar({ label, consumed, target, unit }: { label: string; consumed: number; target: number; unit: string }) {
  const pct = target > 0 ? Math.min(100, (consumed / target) * 100) : 0;
  const remaining = Math.round(target - consumed);
  return (
    <div className="macro-bar">
      <div className="macro-bar-head">
        <span>{label}</span>
        <span className="ta-mono">
          {Math.round(consumed)}/{target} {unit}
        </span>
      </div>
      <div className="macro-bar-track">
        <div className="macro-bar-fill" style={{ width: `${pct}%`, background: barColor(consumed, target) }} />
      </div>
      <div className="macro-bar-hint">
        {remaining > 0 ? `Faltan ${remaining} ${unit}` : remaining < 0 ? `Te pasaste ${Math.abs(remaining)} ${unit}` : "En el objetivo"}
      </div>
      <style jsx>{`
        .macro-bar { display: flex; flex-direction: column; gap: 4px; }
        .macro-bar-head { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-mute); font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
        .macro-bar-head :global(.ta-mono) { color: var(--text); font-size: 12px; letter-spacing: 0; text-transform: none; }
        .macro-bar-track { height: 8px; border-radius: 99px; background: var(--bg-2); overflow: hidden; }
        .macro-bar-fill { height: 100%; border-radius: 99px; transition: width .2s ease; }
        .macro-bar-hint { font-size: 11px; color: var(--text-dim); }
      `}</style>
    </div>
  );
}

export function MacroRings({
  consumed,
  target,
}: {
  consumed: MacroTotals;
  target: NutritionTarget | null;
}) {
  if (!target) {
    return (
      <div className="macro-empty">
        Todavía no hay objetivo de macros. Calculalo abajo — vos o tu coach pueden cambiarlo cuando quieran.
        <style jsx>{`
          .macro-empty { padding: 14px; border: 1px dashed var(--line-2); border-radius: 12px; color: var(--text-mute); font-size: 13px; line-height: 1.45; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="macro-rings">
      <div className="macro-rings-title">HOY vs OBJETIVO</div>
      <MacroBar label="Calorías" consumed={consumed.kcal} target={target.calories} unit="kcal" />
      <MacroBar label="Proteína" consumed={consumed.proteinG} target={target.proteinG} unit="g" />
      <MacroBar label="Carbos" consumed={consumed.carbsG} target={target.carbsG} unit="g" />
      <MacroBar label="Grasas" consumed={consumed.fatG} target={target.fatG} unit="g" />
      <style jsx>{`
        .macro-rings { display: flex; flex-direction: column; gap: 12px; padding: 16px; background: var(--bg-1); border: 1px solid var(--line); border-radius: 14px; }
        .macro-rings-title { font-family: var(--font-mono); font-size: 9px; letter-spacing: .12em; font-weight: 700; color: var(--text-mute); }
      `}</style>
    </div>
  );
}
