"use client";
import { lastDayOfMonth, parse, addMonths, subDays } from "date-fns";
import { useLocalStorage } from "./useLocalStorage";

export type ViewMode = "periodo" | "mes";

export function getPayPeriodRange(monthKey: string, payDay: number): { start: Date; end: Date } {
  const monthDate = parse(monthKey, "yyyy-MM", new Date());

  // Clamp pay day to actual days in this month
  const lastDay = lastDayOfMonth(monthDate).getDate();
  const clampedPayDay = Math.min(payDay, lastDay);

  const periodStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), clampedPayDay);

  // End = day before pay day of next month
  const nextMonth = addMonths(monthDate, 1);
  const nextLastDay = lastDayOfMonth(nextMonth).getDate();
  const nextClampedPayDay = Math.min(payDay, nextLastDay);
  const periodEnd = subDays(new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextClampedPayDay), 1);

  return { start: periodStart, end: periodEnd };
}

export function getFilterDateRange(
  monthKey: string,
  viewMode: ViewMode,
  payDay: number
): { start: Date; end: Date } {
  if (viewMode === "periodo") {
    return getPayPeriodRange(monthKey, payDay);
  }
  // Calendar month mode
  const monthDate = parse(monthKey, "yyyy-MM", new Date());
  const start = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const end = lastDayOfMonth(monthDate);
  return { start, end };
}

export function usePayPeriod() {
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>("viewMode", "periodo");
  return { viewMode, setViewMode };
}
