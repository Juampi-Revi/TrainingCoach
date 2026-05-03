export function daysSince(iso: string): number {
  return Math.floor((new Date().getTime() - new Date(iso).getTime()) / 86400000);
}

export function normalizeEnergyRating(energyRating: number | null): number | null {
  if (energyRating == null) return null;
  if (!Number.isFinite(energyRating)) return null;
  if (energyRating <= 0) return null;
  const v = energyRating <= 5 ? Math.round(energyRating) : Math.ceil(energyRating / 2);
  return Math.min(5, Math.max(1, v));
}

export function fmtSessionDuration(performedAt: string, completedAt: string | null): string | null {
  if (!completedAt) return null;
  const a = new Date(performedAt).getTime();
  const b = new Date(completedAt).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  const ms = b - a;
  if (ms <= 0) return null;
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${m ? ` ${m}m` : ""}`;
}

export function fmtSleep(min: number | null): string {
  if (min == null) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h}h${m ? ` ${m}m` : ""}`;
}
