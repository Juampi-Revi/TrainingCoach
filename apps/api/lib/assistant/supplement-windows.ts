import { ARGENTINA_TIME_ZONE } from "./calendar";

export const SUPPLEMENT_TIMES = [
  "morning",
  "with_breakfast",
  "afternoon",
  "with_dinner",
  "night",
] as const;

export type SupplementTime = (typeof SUPPLEMENT_TIMES)[number];

const WINDOWS: Record<SupplementTime, { start: number; end: number }> = {
  morning: { start: 8, end: 11 },
  with_breakfast: { start: 8, end: 11 },
  afternoon: { start: 15, end: 18 },
  with_dinner: { start: 20, end: 22 },
  night: { start: 21, end: 23 },
};

export function isSupplementTime(value: string): value is SupplementTime {
  return (SUPPLEMENT_TIMES as readonly string[]).includes(value);
}

export function localHour(instant = new Date()): number {
  const hour = new Intl.DateTimeFormat("en-US", {
    timeZone: ARGENTINA_TIME_ZONE,
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant).find((part) => part.type === "hour")?.value;
  return Number(hour ?? "12");
}

export function shouldRemindAt(timeOfDay: string, hour: number): boolean {
  if (!isSupplementTime(timeOfDay)) return false;
  const window = WINDOWS[timeOfDay];
  if (hour >= window.start && hour < window.end) return true;
  return hour >= 21 && hour >= window.end;
}
