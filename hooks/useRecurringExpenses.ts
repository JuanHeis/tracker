"use client";
import { useRef } from "react";
import { format, addMonths, parse, isBefore, isEqual } from "date-fns";
import { useLocalStorage } from "./useLocalStorage";
import type { Category, Expense, MonthlyData } from "./useMoneyTracker";
import { CurrencyType } from "@/constants/investments";

export type RecurringStatus = "Activa" | "Pausada" | "Cancelada";

export interface RecurringExpense {
  id: string;
  name: string;
  amount: number;
  category: Category;
  currencyType: CurrencyType;
  status: RecurringStatus;
  createdAt: string;    // yyyy-MM format - first month to generate
  pausedAt?: string;    // yyyy-MM format - month when paused, cleared on resume
}

function parseMonth(yyyyMM: string): Date {
  return parse(yyyyMM, "yyyy-MM", new Date());
}

function monthIsBeforeOrEqual(a: string, b: string): boolean {
  const dateA = parseMonth(a);
  const dateB = parseMonth(b);
  return isBefore(dateA, dateB) || isEqual(dateA, dateB);
}

/**
 * Iterate months from `start` to `end` (inclusive), returning yyyy-MM strings.
 */
function iterateMonths(start: string, end: string): string[] {
  const months: string[] = [];
  let current = parseMonth(start);
  const endDate = parseMonth(end);

  while (isBefore(current, endDate) || isEqual(current, endDate)) {
    months.push(format(current, "yyyy-MM"));
    current = addMonths(current, 1);
  }
  return months;
}

export function useRecurringExpenses() {
  const [recurringExpenses, setRecurringExpenses] = useLocalStorage<RecurringExpense[]>(
    "recurringExpenses",
    []
  );

  const addRecurring = (data: {
    name: string;
    amount: number;
    category: Category;
    currencyType: CurrencyType;
  }) => {
    const newRecurring: RecurringExpense = {
      id: crypto.randomUUID(),
      name: data.name,
      amount: data.amount,
      category: data.category,
      currencyType: data.currencyType,
      status: "Activa",
      createdAt: format(new Date(), "yyyy-MM"),
    };
    setRecurringExpenses([...recurringExpenses, newRecurring]);
  };

  const updateStatus = (id: string, status: RecurringStatus) => {
    setRecurringExpenses(
      recurringExpenses.map((rec) => {
        if (rec.id !== id) return rec;
        if (status === "Pausada") {
          return { ...rec, status, pausedAt: format(new Date(), "yyyy-MM") };
        }
        if (status === "Activa") {
          return { ...rec, status, pausedAt: undefined };
        }
        // Cancelada
        return { ...rec, status };
      })
    );
  };

  /**
   * Generate missing recurring expense instances across ALL months.
   *
   * Since all data lives in a single monthlyData object with expenses
   * filtered by date, we iterate from each recurring's createdAt to the
   * current month and create Expense instances for any missing months.
   *
   * Returns array of new Expense objects to be merged into monthlyData.expenses.
   */
  const generateMissingInstances = (
    allExpenses: Expense[],
    globalUsdRate: number,
    recurrings: RecurringExpense[]
  ): Expense[] => {
    const currentMonth = format(new Date(), "yyyy-MM");
    const newExpenses: Expense[] = [];

    for (const rec of recurrings) {
      if (rec.status === "Cancelada") continue;

      const months = iterateMonths(rec.createdAt, currentMonth);

      for (const month of months) {
        // Skip months after pausedAt if set
        if (rec.pausedAt && !monthIsBeforeOrEqual(month, rec.pausedAt)) {
          continue;
        }

        // Check if instance already exists for this recurring in this month
        const exists = allExpenses.some(
          (e) => e.recurringId === rec.id && e.date.startsWith(month)
        );
        // Also check if we just created it in this generation run
        const justCreated = newExpenses.some(
          (e) => e.recurringId === rec.id && e.date.startsWith(month)
        );

        if (!exists && !justCreated) {
          newExpenses.push({
            id: crypto.randomUUID(),
            date: `${month}-01`,
            name: rec.name,
            amount: rec.amount,
            usdRate: rec.currencyType === CurrencyType.USD ? globalUsdRate : 0,
            category: rec.category,
            currencyType: rec.currencyType,
            recurringId: rec.id,
            isPaid: false,
          });
        }
      }
    }

    return newExpenses;
  };

  return {
    recurringExpenses,
    addRecurring,
    updateStatus,
    generateMissingInstances,
  };
}
