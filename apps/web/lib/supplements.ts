export const SUPPLEMENT_TIME_LABELS: Record<string, string> = {
  morning: "Mañana",
  with_breakfast: "Con desayuno",
  afternoon: "Tarde",
  with_dinner: "Con cena",
  night: "Noche",
};

export const SUPPLEMENT_TIMES = [
  "morning",
  "with_breakfast",
  "afternoon",
  "with_dinner",
  "night",
] as const;

export const SUPPLEMENT_PRESETS = [
  { name: "Proteína", timeOfDay: "morning" },
  { name: "Creatina", timeOfDay: "morning" },
  { name: "Magnesio", timeOfDay: "night" },
  { name: "Omega-3", timeOfDay: "with_breakfast" },
  { name: "Vitamina D", timeOfDay: "with_breakfast" },
  { name: "Zinc", timeOfDay: "with_dinner" },
  { name: "Colágeno", timeOfDay: "morning" },
  { name: "Cafeína", timeOfDay: "morning" },
] as const;
