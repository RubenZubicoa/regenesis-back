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

export function sumStepsForPeriod(
  records: WithId<DailySteps>[],
  period: StepsRankingPeriod,
  refDate = new Date(),
): number {
  let total = 0;

  for (const record of records) {
    const dayDate = parseDay(record.date);
    if (Number.isNaN(dayDate.getTime()) || !isWithinPeriod(dayDate, period, refDate)) continue;
    total += Math.max(0, Number(record.steps) || 0);
  }

  return total;
}
