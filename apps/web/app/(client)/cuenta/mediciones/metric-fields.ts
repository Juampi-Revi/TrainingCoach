export const METRIC_FIELDS = [
  { key: "weightKg", label: "Peso", unit: "kg", icon: "scale" as const, step: 0.1 },
  { key: "waistCm", label: "Cintura", unit: "cm", icon: "ruler" as const, step: 0.5 },
  { key: "chestCm", label: "Pecho", unit: "cm", icon: "chest" as const, step: 0.5 },
  { key: "hipsCm", label: "Cadera", unit: "cm", icon: "hips" as const, step: 0.5 },
  { key: "armCm", label: "Brazo", unit: "cm", icon: "arm" as const, step: 0.5 },
  { key: "thighCm", label: "Muslo", unit: "cm", icon: "leg" as const, step: 0.5 },
] as const;

