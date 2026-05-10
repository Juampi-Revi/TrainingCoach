"use client";

import type { BlockType, IntervalType } from "@regen/types";

export const BLOCK_TYPES: BlockType[] = ["warmup", "strength", "intervals", "cardio", "cooldown"];
export const INTERVAL_TYPES: IntervalType[] = ["tabata", "hiit", "emom", "amrap"];

export const INTERVAL_PRESETS: Array<{
  id: string;
  label: string;
  intervalType: IntervalType;
  work: string;
  rest: string;
  rounds: string;
  total: string;
}> = [
  { id: "tabata", label: "Tabata", intervalType: "tabata", work: "20", rest: "10", rounds: "8", total: "" },
  { id: "hiit3030", label: "HIIT", intervalType: "hiit", work: "30", rest: "30", rounds: "10", total: "" },
  { id: "emom", label: "EMOM", intervalType: "emom", work: "", rest: "", rounds: "20", total: "1200" },
  { id: "amrap", label: "AMRAP", intervalType: "amrap", work: "", rest: "", rounds: "", total: "600" },
];
