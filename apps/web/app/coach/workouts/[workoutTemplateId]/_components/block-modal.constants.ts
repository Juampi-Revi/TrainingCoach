"use client";

import type { BlockType, IntervalType } from "@regen/types";

export const BLOCK_TYPES: BlockType[] = ["warmup", "strength", "intervals", "cardio", "cooldown"];
export const INTERVAL_TYPES: IntervalType[] = ["tabata", "hiit", "emom", "amrap"];

export const INTERVAL_PRESETS: Array<{
  id: string;
  label: string;
  intervalType: IntervalType;
  prepare: string;
  work: string;
  rest: string;
  rounds: string;
  setCount: string;
  setRest: string;
  total: string;
}> = [
  { id: "tabata", label: "Tabata", intervalType: "tabata", prepare: "10", work: "20", rest: "10", rounds: "8", setCount: "1", setRest: "60", total: "" },
  { id: "hiit3030", label: "HIIT 30/30", intervalType: "hiit", prepare: "10", work: "30", rest: "30", rounds: "10", setCount: "3", setRest: "60", total: "" },
  { id: "emom", label: "EMOM", intervalType: "emom", prepare: "10", work: "", rest: "", rounds: "20", setCount: "1", setRest: "", total: "1200" },
  { id: "amrap", label: "AMRAP", intervalType: "amrap", prepare: "10", work: "", rest: "", rounds: "", setCount: "1", setRest: "", total: "600" },
];
