import { cleanPlateQuery, fold } from "./portions";

export type ParsedPlateItem = {
  query: string;
  grams?: number;
  quantity?: number;
};

export type ParsedPlate = {
  replaceLast: boolean;
  items: ParsedPlateItem[];
};

const ATE = /\b(comi|comí|almorce|almorcé|desayune|desayuné|cene|cené|probe|probé)\b/i;
const REPLACE = /\b(actualiz|no era|no es\b|fue una|corrige|reemplaz|cambial|ultima comida|última comida)\b/i;
const LEADING_VERB = /^(comi|comí|almorce|almorcé|desayune|desayuné|cene|cené|probe|probé)\s+/i;

export function parseLoggedPlate(text: string): ParsedPlate | null {
  const replaceLast = REPLACE.test(text);
  if (!ATE.test(text) && !replaceLast) return null;

  const body = plateBody(text);
  const items = splitFoodChunks(body)
    .map(parseChunk)
    .filter((item): item is ParsedPlateItem => item !== null);

  if (items.length === 0) return null;
  return { replaceLast, items };
}

function plateBody(text: string): string {
  const paren = text.match(/\(([^)]+)\)/);
  const source = paren && /\b(y|e)\b/i.test(paren[1]) ? paren[1] : text;
  return source
    .replace(/cu[aá]ntas?\s+calor[ií]as?.*/i, " ")
    .replace(/todo en la air\s*fryer\.?/i, " ")
    .replace(/\bpesad[oa]s?\b/gi, " ")
    .replace(/\bunos\b/gi, " ")
    .trim();
}

function splitFoodChunks(text: string): string[] {
  return text
    .split(/,|;|\s+y\s+|\s+e\s+|(?=\b(?:medio|media)\s+)/i)
    .map((part) => part.trim())
    .filter((part) => part.length > 2 && !/^(todo|cuantas|calorias)$/i.test(part));
}

function parseChunk(raw: string): ParsedPlateItem | null {
  let text = fold(raw).replace(LEADING_VERB, " ").replace(/\([^)]*\)/g, " ");

  let grams: number | undefined;
  const byGrams = text.match(/(\d+(?:[.,]\d+)?)\s*(?:gramos?|gr|g)\b(?:\s+de)?/i);
  const byDe = !byGrams ? text.match(/(\d+)\s+de\s+/i) : null;
  const gramsMatch = byGrams ?? byDe;
  if (gramsMatch) {
    grams = Number(gramsMatch[1].replace(",", "."));
    text = text.replace(gramsMatch[0], " ");
  }

  let quantity: number | undefined;
  if (/\bmedi[oa]\b/.test(text)) {
    quantity = 0.5;
    text = text.replace(/\bmedi[oa]\b/g, " ");
  }
  const counted = text.match(/\b(\d+)\s+(huevos?|unidades?)/i);
  if (counted) {
    quantity = Number(counted[1]);
    text = text.replace(counted[0], counted[2]);
  }
  text = text.replace(/^\s*una?\s+/, "");

  const query = cleanPlateQuery(text);
  if (query.length < 3) return null;
  if (grams != null) return { query, grams };
  if (quantity != null) return { query, quantity };
  return { query };
}
