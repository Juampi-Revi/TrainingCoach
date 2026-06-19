export const DAY_LABELS = ["D", "L", "M", "X", "J", "V", "S"];

export function weekContext(weekNumber: number, totalWeeks: number): string {
  if (weekNumber === 1) return "Primera semana — empezá fuerte";
  if (weekNumber === totalWeeks) return "Última semana — cerrá con todo";
  const pct = weekNumber / totalWeeks;
  if (pct < 0.33) return `Semana ${weekNumber} de ${totalWeeks} · estás en el arranque`;
  if (pct < 0.67) return `Semana ${weekNumber} de ${totalWeeks} · estás en la mitad del bloque`;
  return `Semana ${weekNumber} de ${totalWeeks} · falta poco para cerrar`;
}

export function workoutBriefing(w: { tags: string[]; description: string | null; exerciseCount: number | null }): string {
  const parts: string[] = [];
  if (w.tags.length) parts.push(w.tags.join(" · "));
  if (w.description) parts.push(w.description);
  if (w.exerciseCount) parts.push(`${w.exerciseCount} ejercicios`);
  return parts.join(" · ");
}

export function nextWorkoutMessage(
  pending: { title: string }[],
  completed: { title: string }[]
): string {
  if (pending.length === 0 && completed.length > 0) return "Semana completada — descansá hasta la próxima";
  const next = pending[0];
  if (!next) return "Sin entrenos pendientes";
  return `Próximo: ${next.title}`;
}

export function todayStrip() {
  const now = new Date();
  const dow = now.getDay(); // 0=Sun
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() - dow + i);
    return { d: DAY_LABELS[i], n: d.getDate(), today: i === dow };
  });
}
