import type { WithId } from "mongodb";

import type { DailySteps } from "../entities/DailySteps";

export type StepsRankingPeriod = "week" | "month";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function parseDay(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00`);
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Lunes de la semana calendario que contiene `date`. */
export function startOfCalendarWeek(date: Date): Date {
  const d = startOfDay(date);
  const weekday = d.getDay();
  const mondayOffset = weekday === 0 ? 6 : weekday - 1;
  d.setDate(d.getDate() - mondayOffset);
  return d;
}

export function endOfCalendarWeek(date: Date): Date {
  const start = startOfCalendarWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function startOfCalendarMonth(date: Date): Date {
  const d = startOfDay(date);
  d.setDate(1);
  return d;
}

export function endOfCalendarMonth(date: Date): Date {
  const d = startOfCalendarMonth(date);
  d.setMonth(d.getMonth() + 1);
  d.setDate(0);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Días transcurridos en el periodo hasta hoy (inclusive). */
export function getElapsedDaysInPeriod(period: StepsRankingPeriod, refDate = new Date()): number {
  const today = startOfDay(refDate);

  if (period === "week") {
    const start = startOfCalendarWeek(today);
    return Math.max(1, Math.floor((today.getTime() - start.getTime()) / MS_PER_DAY) + 1);
  }

  return today.getDate();
}

function isWithinPeriod(dayDate: Date, period: StepsRankingPeriod, refDate: Date): boolean {
  const today = startOfDay(refDate);
  if (dayDate > today) return false;

  if (period === "week") {
    const start = startOfCalendarWeek(refDate);
    const end = endOfCalendarWeek(refDate);
    return dayDate >= start && dayDate <= end;
  }

  const start = startOfCalendarMonth(refDate);
  const end = endOfCalendarMonth(refDate);
  return dayDate >= start && dayDate <= end;
}

/** Fecha calendario de un día L–D dentro de una semana del programa. */
export function getProgramDayDate(
  startDate: string,
  programWeek: number,
  dayIndex: number,
): Date | null {
  const programStart = parseDay(startDate);
  if (Number.isNaN(programStart.getTime())) return null;

  const weekStart = new Date(programStart);
  weekStart.setDate(weekStart.getDate() + (programWeek - 1) * 7);

  const dayDate = new Date(weekStart);
  dayDate.setDate(dayDate.getDate() + dayIndex);
  return startOfDay(dayDate);
}

export function sumStepsForPeriod(
  startDate: string,
  records: WithId<DailySteps>[],
  period: StepsRankingPeriod,
  refDate = new Date(),
): number {
  if (!startDate) return 0;

  let total = 0;

  for (const record of records) {
    record.days.forEach((day, dayIndex) => {
      const dayDate = getProgramDayDate(startDate, record.week, dayIndex);
      if (!dayDate || !isWithinPeriod(dayDate, period, refDate)) return;
      total += Math.max(0, Number(day.value) || 0);
    });
  }

  return total;
}
