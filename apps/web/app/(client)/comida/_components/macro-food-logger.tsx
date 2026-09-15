"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { CatalogFoodItem, CreateFoodLogItemInput, MealType } from "@regen/types";
import { BarcodeScanner } from "./barcode-scanner";

const MEALS: Array<{ id: MealType; label: string }> = [
  { id: "breakfast", label: "Desayuno" },
  { id: "lunch", label: "Almuerzo" },
  { id: "snack", label: "Snack" },
  { id: "dinner", label: "Cena" },
];

function mealFromClock(): MealType {
  const hour = new Date().getHours();
  if (hour < 11) return "breakfast";
  if (hour < 16) return "lunch";
  if (hour < 19) return "snack";
  return "dinner";
}

interface DraftItem extends CreateFoodLogItemInput {
  key: string;
}

export function MacroFoodLogger({ onSaved }: { onSaved: () => Promise<void> }) {
  const { api } = useAuth();
  const toast = useToast();
  const [meal, setMeal] = useState<MealType>(mealFromClock);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CatalogFoodItem[]>([]);
  const [draft, setDraft] = useState<DraftItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  async function search(q: string) {
    setQuery(q);
    if (q.trim().length < 2) { setHits([]); return; }
    setSearching(true);
    try {
      const res = await api.get<{ items: CatalogFoodItem[] }>(`/client/food/catalog?q=${encodeURIComponent(q)}`);
      setHits(res.items ?? []);
    } catch {
      toast.error("No se pudo buscar alimentos");
    } finally {
      setSearching(false);
    }
  }

  function addItem(item: CatalogFoodItem, amount?: number) {
    const grams = amount && amount > 0 ? amount : (item.servingGrams ?? 100);
    const factor = grams / 100;
    setDraft((prev) => [...prev, {
      key: `${item.id}-${Date.now()}`,
      foodItemId: item.id,
      name: item.name,
      grams,
      servingLabel: item.servingLabel,
      kcal: Math.round(item.kcalPer100g * factor * 10) / 10,
      proteinG: Math.round(item.proteinPer100g * factor * 10) / 10,
      carbsG: Math.round(item.carbsPer100g * factor * 10) / 10,
      fatG: Math.round(item.fatPer100g * factor * 10) / 10,
    }]);
    setQuery("");
    setHits([]);
  }

  async function onBarcode(code: string) {
    setScanning(false);
    try {
      const item = await api.get<CatalogFoodItem>(`/client/food/barcode/${code}`);
      addItem(item);
      toast.success(item.name);
    } catch {
      toast.error("No encontramos ese código. Probá buscarlo.");
    }
  }

  async function save() {
    if (draft.length === 0) return;
    setSaving(true);
    try {
      await api.post("/client/food", {
        mealType: meal,
        items: draft.map(({ key: _key, ...item }) => item),
      });
      toast.success("Comida sumada");
      setDraft([]);
      await onSaved();
    } catch {
      toast.error("No se pudo guardar la comida");
    } finally {
      setSaving(false);
    }
  }

  const totals = draft.reduce((acc, i) => ({
    kcal: acc.kcal + (i.kcal ?? 0),
    p: acc.p + (i.proteinG ?? 0),
    c: acc.c + (i.carbsG ?? 0),
    f: acc.f + (i.fatG ?? 0),
  }), { kcal: 0, p: 0, c: 0, f: 0 });

  return (
    <div className="mfl">
      <div className="mfl-meals">
        {MEALS.map((m) => (
          <button key={m.id} type="button" className={meal === m.id ? "on" : ""} onClick={() => setMeal(m.id)}>{m.label}</button>
        ))}
      </div>
      <div className="mfl-search">
        <Input placeholder="Buscar alimento…" value={query} onChange={(e) => void search(e.target.value)} />
        <Button variant="outline" size="sm" onClick={() => setScanning(true)}>Barcode</Button>
      </div>
      {searching && <div className="mfl-hint">Buscando…</div>}
      {!searching && query.trim().length >= 2 && hits.length === 0 && (
        <div className="mfl-hint">No encontramos “{query}”. Tocá un resultado cuando aparezca, o usá barcode.</div>
      )}
      {hits.map((hit) => (
        <button key={hit.id} type="button" className="mfl-hit" onClick={() => addItem(hit)}>
          <span>{hit.name}</span>
          <span className="ta-mono">{hit.servingLabel ?? `${hit.kcalPer100g} kcal/100g`}</span>
        </button>
      ))}
      {draft.length > 0 && (
        <div className="mfl-draft">
          {draft.map((item) => (
            <div key={item.key} className="mfl-line">
              <span>{item.name} · {item.grams} g</span>
              <span className="ta-mono">{Math.round(item.kcal ?? 0)} kcal</span>
              <button type="button" onClick={() => setDraft((prev) => prev.filter((d) => d.key !== item.key))}>×</button>
            </div>
          ))}
          <div className="mfl-total ta-mono">{Math.round(totals.kcal)} kcal · P {Math.round(totals.p)} · C {Math.round(totals.c)} · G {Math.round(totals.f)}</div>
        </div>
      )}
      <Button onClick={() => void save()} disabled={draft.length === 0 || saving}>
        {saving ? "Guardando…" : draft.length === 1 ? "Registrar alimento" : "Registrar comida"}
      </Button>
      {scanning && <BarcodeScanner onDetect={(code) => void onBarcode(code)} onClose={() => setScanning(false)} />}
      <style jsx>{`
        .mfl { display: flex; flex-direction: column; gap: 10px; padding: 14px; background: var(--bg-1); border: 1px solid var(--line); border-radius: 14px; }
        .mfl-meals, .mfl-search { display: flex; gap: 8px; }
        .mfl-meals button { flex: 1; padding: 8px 0; border-radius: 10px; border: 1px solid var(--line-2); background: var(--bg-2); color: var(--text-mute); font-weight: 700; font-size: 12px; }
        .mfl-meals button.on { border-color: var(--lime); color: var(--lime); background: color-mix(in srgb, var(--lime) 12%, transparent); }
        .mfl-search { align-items: flex-end; }
        .mfl-search :global(label) { flex: 1; }
        .mfl-hint { font-size: 12px; color: var(--text-mute); line-height: 1.4; }
        .mfl-hit { display: flex; justify-content: space-between; width: 100%; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--line); background: var(--bg); color: var(--text); text-align: left; }
        .mfl-line { display: grid; grid-template-columns: 1fr auto auto; gap: 8px; align-items: center; font-size: 13px; }
        .mfl-line button { border: 0; background: none; color: var(--text-mute); font-size: 18px; cursor: pointer; }
        .mfl-total { font-size: 12px; color: var(--lime); }
      `}</style>
    </div>
  );
}
