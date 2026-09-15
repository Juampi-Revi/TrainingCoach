"use client";

import {
  MACRO_SPLIT_PRESETS,
  adjustSplit,
  gramsFromSplit,
  sameSplit,
  type MacroSplitKey,
  type MacroSplitPct,
} from "@/lib/macros";

const ROWS: Array<{ key: MacroSplitKey; gramsKey: "proteinG" | "carbsG" | "fatG"; label: string; color: string; kcalPerG: number }> = [
  { key: "proteinPct", gramsKey: "proteinG", label: "Proteína", color: "var(--lime)", kcalPerG: 4 },
  { key: "carbsPct", gramsKey: "carbsG", label: "Carbos", color: "var(--info)", kcalPerG: 4 },
  { key: "fatPct", gramsKey: "fatG", label: "Grasas", color: "var(--warn)", kcalPerG: 9 },
];

export function MacroSplitEditor({
  calories,
  split,
  suggestedSplit,
  onChange,
}: {
  calories: number;
  split: MacroSplitPct;
  suggestedSplit: MacroSplitPct;
  onChange: (next: MacroSplitPct, followSuggested: boolean) => void;
}) {
  const grams = gramsFromSplit(calories, split);
  const activePreset = MACRO_SPLIT_PRESETS.find((p) => {
    if (!p.split) return sameSplit(split, suggestedSplit);
    return sameSplit(split, p.split);
  })?.id ?? "custom";

  function setPct(key: MacroSplitKey, value: number) {
    onChange(adjustSplit(split, key, value), false);
  }

  function setGrams(key: MacroSplitKey, kcalPerG: number, value: number) {
    if (!Number.isFinite(value) || calories <= 0) return;
    setPct(key, (value * kcalPerG / calories) * 100);
  }

  return (
    <div className="split">
      <div className="split-label">Distribución</div>
      <p className="split-hint">El cálculo es un punto de partida. Subí carbos o prote según el plan.</p>
      <div className="split-wrap">
        {MACRO_SPLIT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={activePreset === preset.id ? "on" : ""}
            onClick={() => onChange(preset.split ?? suggestedSplit, !preset.split)}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="split-stack" aria-hidden>
        {ROWS.map((row) => (
          <div key={row.key} style={{ width: `${split[row.key]}%`, background: row.color }} />
        ))}
      </div>
      {ROWS.map((row) => (
        <div key={row.key} className="split-row">
          <div className="split-row-head">
            <span>{row.label}</span>
            <span className="ta-mono">{split[row.key]}% · {grams[row.gramsKey]} g</span>
          </div>
          <input
            className="split-range"
            type="range"
            min={10}
            max={80}
            step={1}
            value={split[row.key]}
            aria-label={`${row.label} porcentaje`}
            onChange={(e) => setPct(row.key, Number(e.target.value))}
            style={{ accentColor: row.color }}
          />
          <div className="split-inputs">
            <label>
              %
              <input
                type="number"
                min={10}
                max={80}
                defaultValue={split[row.key]}
                key={`pct-${row.key}-${split[row.key]}`}
                onBlur={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n)) setPct(row.key, n);
                }}
              />
            </label>
            <label>
              g
              <input
                type="number"
                min={0}
                defaultValue={grams[row.gramsKey]}
                key={`g-${row.gramsKey}-${grams[row.gramsKey]}`}
                onBlur={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n) && n > 0) setGrams(row.key, row.kcalPerG, n);
                }}
              />
            </label>
          </div>
        </div>
      ))}
      <style jsx>{`
        .split { display: flex; flex-direction: column; gap: 10px; padding: 12px; border-radius: 12px; background: var(--bg-2); border: 1px solid var(--line); }
        .split-label { font-size: 10px; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; color: var(--text-mute); }
        .split-hint { margin: 0; font-size: 12px; line-height: 1.4; color: var(--text-dim); }
        .split-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
        .split-wrap button { border: 1px solid var(--line-2); background: var(--bg-1); color: var(--text-mute); border-radius: 10px; padding: 8px 10px; font-size: 12px; font-weight: 700; cursor: pointer; }
        .split-wrap button.on { border-color: var(--lime); background: color-mix(in srgb, var(--lime) 12%, transparent); color: var(--lime); }
        .split-stack { display: flex; height: 8px; border-radius: 99px; overflow: hidden; background: var(--bg-3); }
        .split-row { display: flex; flex-direction: column; gap: 6px; }
        .split-row-head { display: flex; justify-content: space-between; font-size: 12px; font-weight: 700; color: var(--text); }
        .split-range { width: 100%; margin: 0; height: 6px; cursor: pointer; }
        .split-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .split-inputs label { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-mute); font-weight: 700; }
        .split-inputs input { width: 100%; height: 36px; border-radius: 8px; border: 1px solid var(--line-2); background: var(--bg-1); color: var(--text); font-family: var(--font-mono); font-size: 13px; padding: 0 8px; }
      `}</style>
    </div>
  );
}
