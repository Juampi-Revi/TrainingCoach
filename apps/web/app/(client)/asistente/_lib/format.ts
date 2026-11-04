export function amount(value: number, digits = 0): string {
  return value.toLocaleString("es-AR", { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

export function portion(quantity: number, unit: string): string {
  const name = cleanServingUnit(unit);
  const digits = Number.isInteger(quantity) ? 0 : 1;
  if (/^\d/.test(name)) {
    return quantity === 1 ? name : `${amount(quantity, digits)} × ${name}`;
  }
  return `${amount(quantity, digits)}${name ? ` ${name}` : ""}`;
}

function cleanServingUnit(unit: string): string {
  const trimmed = unit.trim();
  const stripped = trimmed.replace(/^(?:1(?:[.,]0*)?)\s+/i, "").trim();
  return stripped || trimmed;
}

function isGramUnit(unit: string): boolean {
  return ["", "g", "gr", "gramo", "gramos"].includes(unit.trim().toLowerCase());
}

export function portionLabel(item: {
  quantity?: number | null;
  unit?: string | null;
  grams?: number | null;
}): string {
  const unit = item.unit ?? "";
  const grams = item.grams ?? null;
  const quantity = item.quantity ?? null;
  if (isGramUnit(unit)) {
    const value = grams ?? quantity;
    if (value === null) return "";
    return `${amount(value, value >= 10 ? 0 : 1)} g`;
  }
  const qty = quantity === null ? "" : portion(quantity, unit);
  if (grams === null) return qty;
  return `${qty} (${amount(grams, grams >= 10 ? 0 : 1)} g)`;
}

export function macroLine(totals: { kcal: number; proteinG: number; carbsG: number | null; fatG: number | null }): string {
  const protein = `${amount(totals.proteinG, totals.proteinG >= 10 ? 0 : 1)} g prot.`;
  if (totals.carbsG === null || totals.fatG === null) {
    return `${amount(totals.kcal, totals.kcal >= 100 ? 0 : 1)} kcal · ${protein}`;
  }
  return `${protein} · ${amount(totals.carbsG, totals.carbsG >= 10 ? 0 : 1)} g carbos · ${amount(totals.fatG, totals.fatG >= 10 ? 0 : 1)} g grasas`;
}

export function clock(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

export function whenLabel(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    weekday: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function periodTitle(iso: string): string {
  const label = new Intl.DateTimeFormat("es-AR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00.000Z`));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function meter(consumed: number, goal: number | null): number {
  if (goal === null || goal <= 0) return 0;
  return Math.max(0, Math.min(100, (consumed / goal) * 100));
}

export function parseDrinkText(text: string): { displayName: string; quantity: number; unit: string } {
  const trimmed = text.trim();
  const match = /^(\d+(?:[.,]\d+)?)\s*(litro|litros|vaso|taza|ml|termo|mate)?s?\s*(?:de\s+)?(.+)$/i.exec(trimmed);
  if (!match) return { displayName: trimmed, quantity: 1, unit: "unidad" };
  return {
    quantity: Number(match[1].replace(",", ".")),
    unit: (match[2] ?? "unidad").toLowerCase().replace(/s$/, "") || "unidad",
    displayName: match[3].trim() || trimmed,
  };
}
