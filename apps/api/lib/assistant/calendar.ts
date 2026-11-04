export const ARGENTINA_TIME_ZONE = "America/Argentina/Buenos_Aires";

export function localDate(instant = new Date(), timeZone = ARGENTINA_TIME_ZONE): string {
  return formatParts(instant, timeZone, ["year", "month", "day"]).join("-");
}

export function calendarMonthKey(instant = new Date(), timeZone = ARGENTINA_TIME_ZONE): string {
  return formatParts(instant, timeZone, ["year", "month"]).join("-");
}

export function asDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

export function isoOf(value: Date): string {
  return value.toISOString().slice(0, 10);
}

export function dayBounds(isoDate: string): { start: Date; end: Date } {
  const start = localMidnight(isoDate);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

export function localMidnight(isoDate: string): Date {
  const probe = new Date(`${isoDate}T12:00:00.000Z`);
  const offset = zoneOffsetMinutes(ARGENTINA_TIME_ZONE, probe);
  return new Date(Date.parse(`${isoDate}T00:00:00.000Z`) + offset * 60_000);
}

export function argentinaDateTime(isoDate: string, hour: number, minute: number): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  const wanted = Date.UTC(year, month - 1, day, hour, minute);
  let instant = wanted;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: ARGENTINA_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(instant));
    const found = new Map(parts.map((part) => [part.type, part.value]));
    const got = Date.UTC(
      Number(found.get("year")),
      Number(found.get("month")) - 1,
      Number(found.get("day")),
      Number(found.get("hour")),
      Number(found.get("minute")),
    );
    if (got === wanted) break;
    instant += wanted - got;
  }
  return new Date(instant);
}

export function eachDate(from: string, to: string): string[] {
  const days: string[] = [];
  let cursor = asDate(from).getTime();
  const end = asDate(to).getTime();
  while (cursor <= end) {
    days.push(isoOf(new Date(cursor)));
    cursor += 24 * 60 * 60 * 1000;
  }
  return days;
}

export function weekBounds(iso: string): { from: string; to: string } {
  const date = asDate(iso);
  const weekday = date.getUTCDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const monday = date.getTime() + mondayOffset * 24 * 60 * 60 * 1000;
  return { from: isoOf(new Date(monday)), to: isoOf(new Date(monday + 6 * 24 * 60 * 60 * 1000)) };
}

export function monthBounds(iso: string): { from: string; to: string } {
  const [year, month] = iso.split("-").map(Number);
  const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    from: `${iso.slice(0, 7)}-01`,
    to: `${iso.slice(0, 7)}-${String(last).padStart(2, "0")}`,
  };
}

export function weekdayLabel(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", { weekday: "short", timeZone: "UTC" })
    .format(asDate(iso))
    .replace(".", "");
}

function formatParts(
  instant: Date,
  timeZone: string,
  fields: Array<"year" | "month" | "day">,
): string[] {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const byType = new Map(parts.map((part) => [part.type, part.value]));
  return fields.map((field) => {
    const value = byType.get(field);
    if (!value) throw new Error(`missing ${field} for ${timeZone}`);
    return value;
  });
}

function zoneOffsetMinutes(timeZone: string, instant: Date): number {
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "shortOffset",
    hour: "2-digit",
  }).formatToParts(instant).find((part) => part.type === "timeZoneName")?.value ?? "GMT";
  const match = /GMT([+-])(\d{1,2})(?::?(\d{2}))?/.exec(name);
  if (!match) return 0;
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0);
  return match[1] === "-" ? minutes : -minutes;
}
