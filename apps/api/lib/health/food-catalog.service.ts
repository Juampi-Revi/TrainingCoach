import { prisma } from "@/lib/prisma";
import { normalizeFoodName, scaleMacros } from "@/lib/health/macros";
import { SYSTEM_FOODS } from "@/lib/health/food-catalog-data";

const OFF_UA = process.env.OPEN_FOOD_FACTS_UA ?? "TrainApp/1.0 (https://yourcoachfit.com)";

export interface CatalogFoodDTO {
  id: string;
  name: string;
  category: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  servingLabel: string | null;
  servingGrams: number | null;
  source: string;
  barcode: string | null;
}

export async function seedSystemFoods() {
  let created = 0;
  let updated = 0;
  for (const food of SYSTEM_FOODS) {
    const aliases = food.aliases ?? [];
    const nameNormalized = normalizeFoodName([food.name, ...aliases].join(" "));
    const data = {
      name: food.name,
      nameNormalized,
      aliases,
      category: food.category,
      kcalPer100g: food.kcal,
      proteinPer100g: food.p,
      carbsPer100g: food.c,
      fatPer100g: food.f,
      servingLabel: food.servingLabel ?? null,
      servingGrams: food.servingGrams ?? null,
      barcode: null as string | null,
      isSystem: true,
    };
    const existing = await prisma.foodItem.findUnique({
      where: { source_sourceId: { source: "system", sourceId: food.id } },
      select: { id: true },
    });
    if (existing) {
      await prisma.foodItem.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      await prisma.foodItem.create({
        data: { ...data, source: "system", sourceId: food.id },
      });
      created += 1;
    }
  }
  return { created, updated, total: SYSTEM_FOODS.length };
}

export async function searchFoods(query: string, userId: string, take = 20): Promise<CatalogFoodDTO[]> {
  const q = normalizeFoodName(query);
  if (q.length < 1) {
    const recent = await prisma.foodItem.findMany({
      where: { OR: [{ isSystem: true }, { createdByUserId: userId }] },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
      take,
    });
    return recent.map(toCatalogDTO);
  }

  const items = await prisma.foodItem.findMany({
    where: {
      AND: [
        { OR: [{ isSystem: true }, { createdByUserId: userId }, { source: "off" }] },
        { nameNormalized: { contains: q, mode: "insensitive" } },
      ],
    },
    orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    take: Math.min(40, Math.max(5, take)),
  });
  return items.map(toCatalogDTO);
}

export async function getFoodById(id: string) {
  const item = await prisma.foodItem.findUnique({ where: { id } });
  return item ? toCatalogDTO(item) : null;
}

export async function lookupBarcode(barcode: string, userId?: string): Promise<CatalogFoodDTO | null> {
  const code = barcode.replace(/\s+/g, "").trim();
  if (!/^\d{8,14}$/.test(code)) return null;

  const cached = await prisma.foodItem.findFirst({
    where: { barcode: code },
  });
  if (cached) return toCatalogDTO(cached);

  const parsed = await fetchOpenFoodFacts(code);
  if (!parsed) return null;

  const created = await prisma.foodItem.upsert({
    where: { source_sourceId: { source: "off", sourceId: code } },
    update: parsed,
    create: {
      ...parsed,
      source: "off",
      sourceId: code,
      barcode: code,
      isSystem: false,
      createdByUserId: userId ?? null,
    },
  });
  return toCatalogDTO(created);
}

export async function createCustomFood(userId: string, input: {
  name: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  servingLabel?: string | null;
  servingGrams?: number | null;
  barcode?: string | null;
}): Promise<CatalogFoodDTO> {
  const name = input.name.trim();
  if (!name) throw new Error("Nombre requerido");
  const sourceId = `custom-${crypto.randomUUID()}`;
  const item = await prisma.foodItem.create({
    data: {
      name,
      nameNormalized: normalizeFoodName(name),
      aliases: [],
      category: "other",
      kcalPer100g: input.kcalPer100g,
      proteinPer100g: input.proteinPer100g,
      carbsPer100g: input.carbsPer100g,
      fatPer100g: input.fatPer100g,
      servingLabel: input.servingLabel ?? null,
      servingGrams: input.servingGrams ?? null,
      source: "custom",
      sourceId,
      barcode: input.barcode ?? null,
      isSystem: false,
      createdByUserId: userId,
    },
  });
  return toCatalogDTO(item);
}

export function macrosForGrams(item: CatalogFoodDTO, grams: number) {
  return scaleMacros({
    kcal: item.kcalPer100g,
    proteinG: item.proteinPer100g,
    carbsG: item.carbsPer100g,
    fatG: item.fatPer100g,
  }, grams);
}

export type OffFoodFields = {
  name: string;
  nameNormalized: string;
  aliases: string[];
  category: string;
  kcalPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  servingLabel: string | null;
  servingGrams: number | null;
};

export function parseOffProduct(json: unknown, barcode: string): OffFoodFields | null {
  if (!json || typeof json !== "object") return null;
  const root = json as Record<string, unknown>;
  if (root.status !== 1 || !root.product || typeof root.product !== "object") return null;
  const product = root.product as Record<string, unknown>;
  const nutriments = (product.nutriments ?? {}) as Record<string, unknown>;
  const kcal = numberish(nutriments["energy-kcal_100g"])
    ?? numberish(nutriments["energy-kcal"])
    ?? kjToKcal(numberish(nutriments["energy_100g"]));
  const protein = numberish(nutriments["proteins_100g"]) ?? 0;
  const carbs = numberish(nutriments["carbohydrates_100g"]) ?? 0;
  const fat = numberish(nutriments["fat_100g"]) ?? 0;
  if (kcal == null || kcal < 0) return null;

  const name = stringish(product.product_name_es)
    ?? stringish(product.product_name)
    ?? stringish(product.brands)
    ?? `Producto ${barcode}`;
  const servingGrams = numberish(product.serving_quantity)
    ?? parseServingGrams(stringish(product.serving_size));

  return {
    name: name.slice(0, 120),
    nameNormalized: normalizeFoodName(name),
    aliases: stringish(product.brands) ? [String(product.brands)] : [],
    category: "packaged",
    kcalPer100g: round1(kcal),
    proteinPer100g: round1(protein),
    carbsPer100g: round1(carbs),
    fatPer100g: round1(fat),
    servingLabel: stringish(product.serving_size) ?? (servingGrams ? `${servingGrams} g` : null),
    servingGrams,
  };
}

async function fetchOpenFoodFacts(barcode: string) {
  const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,product_name_es,brands,nutriments,serving_size,serving_quantity,code`;
  const res = await fetch(url, {
    headers: { "User-Agent": OFF_UA, Accept: "application/json" },
  });
  if (!res.ok) return null;
  const json: unknown = await res.json();
  const parsed = parseOffProduct(json, barcode);
  if (!parsed) return null;
  return parsed;
}

function toCatalogDTO(item: {
  id: string;
  name: string;
  category: string;
  kcalPer100g: { toString(): string } | number;
  proteinPer100g: { toString(): string } | number;
  carbsPer100g: { toString(): string } | number;
  fatPer100g: { toString(): string } | number;
  servingLabel: string | null;
  servingGrams: { toString(): string } | number | null;
  source: string;
  barcode: string | null;
}): CatalogFoodDTO {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    kcalPer100g: num(item.kcalPer100g),
    proteinPer100g: num(item.proteinPer100g),
    carbsPer100g: num(item.carbsPer100g),
    fatPer100g: num(item.fatPer100g),
    servingLabel: item.servingLabel,
    servingGrams: item.servingGrams == null ? null : num(item.servingGrams),
    source: item.source,
    barcode: item.barcode,
  };
}

function num(value: { toString(): string } | number): number {
  return typeof value === "number" ? value : Number(value.toString());
}

function numberish(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function stringish(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function kjToKcal(kj: number | null): number | null {
  if (kj == null) return null;
  return kj / 4.184;
}

function parseServingGrams(label: string | null): number | null {
  if (!label) return null;
  const match = label.replace(",", ".").match(/(\d+(?:\.\d+)?)\s*g/i);
  return match ? Number(match[1]) : null;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
