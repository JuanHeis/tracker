"use client";
import { useMemo, useCallback } from "react";
import { parse } from "date-fns";
import { useLocalStorage } from "./useLocalStorage";
import { type Category, type Expense } from "./useMoneyTracker";
import { CurrencyType } from "@/constants/investments";
import { getFilterDateRange, type ViewMode } from "./usePayPeriod";

// --- Data model ---

export interface BudgetDefinition {
  category: Category;
  monthlyLimit: number; // ARS
}

export interface BudgetSnapshot {
  [category: string]: number; // category -> limit at that time
}

export interface BudgetData {
  definitions: BudgetDefinition[];
  snapshots: Record<string, BudgetSnapshot>; // monthKey -> snapshot
}

export interface BudgetProgress {
  category: Category;
  limit: number;          // ARS limit for this month
  spent: number;          // ARS spent in period
  percentage: number;     // spent / limit * 100
  expenses: Array<{ id: string; name: string; amount: number; arsAmount: number }>; // for tooltip breakdown
}

// All possible categories for categoriesWithoutBudget computation
const ALL_CATEGORIES: Category[] = [
  "Alquiler", "Supermercado", "Entretenimiento", "Salidas",
  "Vacaciones", "Servicios", "Vestimenta", "Subscripciones",
  "Insumos", "Estudio", "Otros", "Gym",
  "Seguros", "Impuestos", "Transporte", "Salud",
];

export function useBudgetTracker(
  expenses: Expense[],
  monthKey: string,
  viewMode: ViewMode,
  payDay: number
) {
  const [budgetData, setBudgetData] = useLocalStorage<BudgetData>("budgetData", {
    definitions: [],
    snapshots: {},
  });

  // --- CRUD operations ---

  const addBudget = useCallback((category: Category, monthlyLimit: number) => {
    setBudgetData((prev: BudgetData) => {
      if (prev.definitions.some((d) => d.category === category)) return prev;
      return {
        ...prev,
        definitions: [...prev.definitions, { category, monthlyLimit }],
      };
    });
  }, [setBudgetData]);

  const updateBudget = useCallback((category: Category, monthlyLimit: number) => {
    setBudgetData((prev: BudgetData) => ({
      ...prev,
      definitions: prev.definitions.map((d) =>
        d.category === category ? { ...d, monthlyLimit } : d
      ),
    }));
  }, [setBudgetData]);

  const deleteBudget = useCallback((category: Category) => {
    setBudgetData((prev: BudgetData) => ({
      ...prev,
      definitions: prev.definitions.filter((d) => d.category !== category),
      // Keep historical snapshots intact
    }));
  }, [setBudgetData]);

  // --- Spending computation ---

  const { budgetProgress, totalBudgeted, totalSpent } = useMemo(() => {
    if (budgetData.definitions.length === 0) {
      return { budgetProgress: [] as BudgetProgress[], totalBudgeted: 0, totalSpent: 0 };
    }

    const { start, end } = getFilterDateRange(monthKey, viewMode, payDay);

    // Filter expenses by date range
    const periodExpenses = expenses.filter((expense) => {
      const d = parse(expense.date, "yyyy-MM-dd", new Date());
      return d >= start && d <= end;
    });

    // Get budgeted categories set
    const budgetedCategories = new Set(budgetData.definitions.map((d) => d.category));

    // Check if any period expenses fall in budgeted categories
    const hasRelevantExpenses = periodExpenses.some((e) => budgetedCategories.has(e.category));

    // --- Snapshot logic ---
    // Determine the limit for each category this month
    const snapshot = budgetData.snapshots[monthKey];
    let limitsMap: Record<string, number> = {};

    if (snapshot) {
      // Use existing snapshot limits
      limitsMap = { ...snapshot };
      // For categories added after snapshot was created, use current definition
      for (const def of budgetData.definitions) {
        if (!(def.category in limitsMap)) {
          limitsMap[def.category] = def.monthlyLimit;
        }
      }
    } else {
      // No snapshot yet — use current definitions
      for (const def of budgetData.definitions) {
        limitsMap[def.category] = def.monthlyLimit;
      }

      // Create snapshot lazily if there are relevant expenses
      if (hasRelevantExpenses) {
        const newSnapshot: BudgetSnapshot = {};
        for (const def of budgetData.definitions) {
          newSnapshot[def.category] = def.monthlyLimit;
        }
        setBudgetData((prev: BudgetData) => {
          // Double-check snapshot wasn't created by another render
          if (prev.snapshots[monthKey]) return prev;
          return {
            ...prev,
            snapshots: { ...prev.snapshots, [monthKey]: newSnapshot },
          };
        });
      }
    }

    // Group expenses by category and compute ARS amounts
    const categoryExpenses: Record<string, Array<{ id: string; name: string; amount: number; arsAmount: number }>> = {};
    const categorySpent: Record<string, number> = {};

    for (const expense of periodExpenses) {
      if (!budgetedCategories.has(expense.category)) continue;

      const arsAmount = expense.currencyType === CurrencyType.USD
        ? expense.amount * expense.usdRate
        : expense.amount;

      if (!categoryExpenses[expense.category]) {
        categoryExpenses[expense.category] = [];
        categorySpent[expense.category] = 0;
      }

      categoryExpenses[expense.category].push({
        id: expense.id,
        name: expense.name,
        amount: expense.amount,
        arsAmount,
      });
      categorySpent[expense.category] += arsAmount;
    }

    // Build BudgetProgress for each budgeted category
    const progress: BudgetProgress[] = budgetData.definitions.map((def) => {
      const limit = limitsMap[def.category] ?? def.monthlyLimit;
      const spent = categorySpent[def.category] ?? 0;
      const percentage = limit > 0 ? (spent / limit) * 100 : 0;

      return {
        category: def.category,
        limit,
        spent,
        percentage,
        expenses: categoryExpenses[def.category] ?? [],
      };
    });

    // Sort: exceeded (>= 100%) first, then by percentage descending
    progress.sort((a, b) => {
      const aExceeded = a.percentage >= 100 ? 1 : 0;
      const bExceeded = b.percentage >= 100 ? 1 : 0;
      if (aExceeded !== bExceeded) return bExceeded - aExceeded;
      return b.percentage - a.percentage;
    });

    const totalBudgeted = progress.reduce((sum, p) => sum + p.limit, 0);
    const totalSpent = progress.reduce((sum, p) => sum + p.spent, 0);

    return { budgetProgress: progress, totalBudgeted, totalSpent };
  }, [budgetData, expenses, monthKey, viewMode, payDay, setBudgetData]);

  // --- Categories without budget ---

  const categoriesWithoutBudget = useMemo(() => {
    const budgeted = new Set(budgetData.definitions.map((d) => d.category));
    return ALL_CATEGORIES.filter((c) => !budgeted.has(c));
  }, [budgetData.definitions]);

  return {
    budgetData,
    budgetProgress,
    totalBudgeted,
    totalSpent,
    addBudget,
    updateBudget,
    deleteBudget,
    categoriesWithoutBudget,
  };
}
