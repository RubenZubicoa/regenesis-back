const MS_PER_DAY = 1000 * 60 * 60 * 24;

function parseDay(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00`);
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Días restantes hasta la fecha de fin (incluido el día final). */
export function getDaysLeft(endDate: string, from: Date = new Date()): number {
  const end = new Date(`${endDate}T23:59:59`);
  if (Number.isNaN(end.getTime())) return 0;
  const diff = Math.ceil((end.getTime() - from.getTime()) / MS_PER_DAY);
  return Math.max(0, diff);
}

/** Semanas totales del proceso según start→end. */
export function getTotalWeeks(startDate: string, endDate: string): number {
  const start = parseDay(startDate);
  const end = parseDay(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 1;
  }
  const totalDays = Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY);
  return Math.max(1, Math.ceil(totalDays / 7));
}

/**
 * Semana actual según fecha de inicio y días restantes hasta el fin.
 * Acotada entre 1 y totalWeeks.
 */
export function getCurrentWeek(
  startDate: string,
  endDate: string,
  from: Date = new Date(),
): number {
  const totalWeeks = getTotalWeeks(startDate, endDate);
  const start = parseDay(startDate);
  const end = parseDay(endDate);
  if (Number.isNaN(start.getTime())) return 1;

  const today = startOfDay(from);
  if (today < start) return 1;
  if (!Number.isNaN(end.getTime()) && today > end) return totalWeeks;

  const daysLeft = getDaysLeft(endDate, today);
  const totalSpanDays = Math.floor((end.getTime() - start.getTime()) / MS_PER_DAY);
  const elapsedDays = Math.max(0, totalSpanDays - daysLeft);

  return Math.min(totalWeeks, Math.max(1, Math.floor(elapsedDays / 7) + 1));
}
