"use client";

import { useEffect, useState } from "react";
import { Button, Input } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/lib/toast";
import type { CatalogFoodItem, MealType } from "@regen/types";
import { BarcodeScanner } from "./barcode-scanner";
import { PlateItemRow } from "./plate-item-row";

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

export interface PlateFood {
  key: string;
  foodItemId: string | null;
  name: string;
  grams: number;
  servingLabel: string | null;
  servingGrams: number | null;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function withGrams(item: PlateFood, grams: number): PlateFood {
  const g = Math.max(1, round1(grams));
  const factor = g / 100;
  return {
    ...item,
    grams: g,
    kcal: round1(item.kcalPer100g * factor),
    proteinG: round1(item.proteinPer100g * factor),
    carbsG: round1(item.carbsPer100g * factor),
    fatG: round1(item.fatPer100g * factor),
  };
}

function fromCatalog(item: CatalogFoodItem, grams: number): PlateFood {
  return withGrams({
    key: `${item.id}-${Date.now()}`,
    foodItemId: item.id,
    name: item.name,
    grams,
    servingLabel: item.servingLabel,
    servingGrams: item.servingGrams,
    kcalPer100g: item.kcalPer100g,
    proteinPer100g: item.proteinPer100g,
    carbsPer100g: item.carbsPer100g,
    fatPer100g: item.fatPer100g,
    kcal: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
  }, grams);
}

export function MacroFoodLogger({
  onSaved,
  incoming,
  onIncomingUsed,
}: {
  onSaved: () => Promise<void>;
  incoming?: PlateFood[] | null;
  onIncomingUsed?: () => void;
}) {
  const { api } = useAuth();
  const toast = useToast();
  const [meal, setMeal] = useState<MealType>(mealFromClock);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CatalogFoodItem[]>([]);
  const [draft, setDraft] = useState<PlateFood[]>([]);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!incoming?.length) return;
    setDraft((prev) => {
      let next = prev;
      for (const item of incoming) next = upsertFood(next, item);
      return next;
    });
    onIncomingUsed?.();
  }, [incoming, onIncomingUsed]);

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

  function addItem(item: CatalogFoodItem) {
    const grams = item.servingGrams && item.servingGrams > 0 ? item.servingGrams : 100;
    setDraft((prev) => upsertFood(prev, fromCatalog(item, grams)));
    setQuery("");
    setHits([]);
    requestAnimationFrame(focusSearch);
  }

  function setItemGrams(key: string, grams: number) {
    if (!Number.isFinite(grams) || grams <= 0) return;
    setDraft((prev) => prev.map((item) => (item.key === key ? withGrams(item, grams) : item)));
  }

  function setItemUnits(item: PlateFood, units: number) {
    if (!item.servingGrams || item.servingGrams <= 0) return;
    setItemGrams(item.key, units * item.servingGrams);
  }

  function bumpUnits(item: PlateFood, delta: number) {
    const step = item.servingGrams && item.servingGrams > 0 ? item.servingGrams : 10;
    setItemGrams(item.key, item.grams + delta * step);
  }

  function focusSearch() {
    document.getElementById("mfl-food-search")?.focus();
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
        items: draft.map((item) => ({
          foodItemId: item.foodItemId,
          name: item.name,
          grams: item.grams,
          servingLabel: item.servingLabel,
          kcal: item.kcal,
          proteinG: item.proteinG,
          carbsG: item.carbsG,
          fatG: item.fatG,
        })),
      });
      toast.success(`${mealName} registrado`);
      setDraft([]);
      await onSaved();
    } catch {
      toast.error("No se pudo guardar la comida");
    } finally {
      setSaving(false);
    }
  }

  const mealName = MEALS.find((m) => m.id === meal)?.label ?? "comida";
  const totals = draft.reduce((acc, i) => ({
    kcal: acc.kcal + i.kcal,
    p: acc.p + i.proteinG,
    c: acc.c + i.carbsG,
    f: acc.f + i.fatG,
  }), { kcal: 0, p: 0, c: 0, f: 0 });

  return (
    <div className="mfl">
      <div className="mfl-meals">
        {MEALS.map((m) => (
          <button key={m.id} type="button" className={meal === m.id ? "on" : ""} onClick={() => setMeal(m.id)}>{m.label}</button>
        ))}
      </div>
      {draft.length > 0 ? (
        <div className="mfl-draft">
          <div className="mfl-plate">Tu {mealName.toLowerCase()}</div>
          {draft.map((item) => (
            <PlateItemRow
              key={item.key}
              item={item}
              onGrams={(grams) => setItemGrams(item.key, grams)}
              onUnits={(units) => setItemUnits(item, units)}
              onBump={(delta) => bumpUnits(item, delta)}
              onRemove={() => setDraft((prev) => prev.filter((d) => d.key !== item.key))}
            />
          ))}
          <div className="mfl-total ta-mono">{Math.round(totals.kcal)} kcal · P {Math.round(totals.p)} · C {Math.round(totals.c)} · G {Math.round(totals.f)}</div>
        </div>
      ) : (
        <p className="mfl-hint">Armá el plato completo: huevos, tostadas, fruta, queso… y registralo todo junto.</p>
      )}
      <div className="mfl-search">
        <Input
          id="mfl-food-search"
          autoComplete="off"
          enterKeyHint="search"
          label={draft.length > 0 ? "Sumá otro alimento" : undefined}
          placeholder={draft.length > 0 ? "Tostadas, fruta, queso…" : "Buscar y sumar al plato…"}
          value={query}
          onChange={(e) => void search(e.target.value)}
        />
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
      {draft.length > 0 && hits.length === 0 && query.trim().length < 2 && (
        <p className="mfl-hint">Seguí buscando para sumar más. Guardá el {mealName.toLowerCase()} cuando esté listo.</p>
      )}
      <Button onClick={() => void save()} disabled={draft.length === 0 || saving}>
        {saving
          ? "Guardando…"
          : `Registrar ${mealName.toLowerCase()}${draft.length > 1 ? ` · ${draft.length} alimentos` : ""}`}
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
        .mfl-draft { display: flex; flex-direction: column; gap: 8px; }
        .mfl-plate { font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: var(--text-mute); }
        .mfl-search p, .mfl-hint { margin: 0; }
        .mfl-total { font-size: 12px; color: var(--lime); }
      `}</style>
    </div>
  );
}

function upsertFood(draft: PlateFood[], incoming: PlateFood): PlateFood[] {
  const match = incoming.foodItemId
    ? draft.find((item) => item.foodItemId === incoming.foodItemId)
    : undefined;
  if (!match) return [...draft, incoming];
  return draft.map((item) => (item.key === match.key ? withGrams(item, item.grams + incoming.grams) : item));
}
