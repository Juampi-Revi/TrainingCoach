"use client";

import type { PlateFood } from "./macro-food-logger";

function QtyField({
  value,
  suffix,
  onCommit,
}: {
  value: number;
  suffix: string;
  onCommit: (n: number) => void;
}) {
  return (
    <label className="pir-field">
      <input
        type="number"
        min={1}
        step="any"
        inputMode="decimal"
        defaultValue={value}
        key={value}
        onBlur={(e) => onCommit(Number(e.target.value))}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
      />
      {suffix}
    </label>
  );
}

export function PlateItemRow({
  item,
  onGrams,
  onUnits,
  onBump,
  onRemove,
}: {
  item: PlateFood;
  onGrams: (grams: number) => void;
  onUnits: (units: number) => void;
  onBump: (delta: number) => void;
  onRemove: () => void;
}) {
  const serving = item.servingGrams && item.servingGrams > 0 ? item.servingGrams : null;
  const units = serving ? Math.round((item.grams / serving) * 10) / 10 : 0;
  const unitSuffix = (item.servingLabel ?? "porción").replace(/^[\d/]+\s+/, "");

  return (
    <div className="pir">
      <div className="pir-name">{item.name}</div>
      <button type="button" className="pir-x" onClick={onRemove} aria-label="Quitar">×</button>
      <div className="pir-qty">
        <button type="button" onClick={() => onBump(-1)} aria-label="Menos">−</button>
        {serving ? <QtyField value={units} suffix={unitSuffix} onCommit={onUnits} /> : null}
        <QtyField value={item.grams} suffix="g" onCommit={onGrams} />
        <button type="button" onClick={() => onBump(1)} aria-label="Más">+</button>
      </div>
      <div className="pir-kcal ta-mono">{Math.round(item.kcal)} kcal</div>
      <style jsx>{`
        .pir {
          display: grid;
          grid-template-columns: 1fr auto;
          grid-template-areas: "name x" "qty kcal";
          gap: 6px 8px;
          align-items: center;
          padding: 10px;
          border-radius: 12px;
          background: var(--bg-2);
          border: 1px solid var(--line);
        }
        .pir-name { grid-area: name; font-size: 13px; font-weight: 700; }
        .pir-x { grid-area: x; border: 0; background: none; color: var(--text-mute); font-size: 18px; cursor: pointer; }
        .pir-qty { grid-area: qty; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
        .pir-qty button {
          width: 32px; height: 32px; border-radius: 8px;
          border: 1px solid var(--line-2); background: var(--bg-1);
          color: var(--text); font-size: 18px; font-weight: 700; cursor: pointer;
        }
        .pir-qty :global(.pir-field) {
          display: flex; align-items: center; gap: 4px;
          font-size: 11px; color: var(--text-mute); font-weight: 700;
        }
        .pir-qty :global(.pir-field input) {
          width: 64px; height: 32px; border-radius: 8px;
          border: 1px solid var(--lime);
          background: var(--bg-1); color: var(--text);
          font-family: var(--font-mono); font-size: 13px; padding: 0 8px;
        }
        .pir-kcal { grid-area: kcal; font-size: 12px; color: var(--text-mute); }
      `}</style>
    </div>
  );
}
